const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

async function main() {
    const database = new PGlite()
    try {
        await database.exec(`
            create role anon;
            create role authenticated;
            create role service_role;
            create schema auth;
            create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
            create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb, encrypted_password text);
            create table public.profiles (
                id uuid primary key references auth.users(id), email text not null,
                first_name text, last_name text, phone text, role text not null, name text, full_name text,
                is_verified boolean default false, verification_status text default 'unverified',
                balance numeric default 0, status text default 'active'
            );
            create table public.service_providers (
                id uuid primary key, user_id uuid references public.profiles(id),
                full_name text, verified boolean default false, approval_status text default 'pending',
                verification_status text default 'pending', verified_at timestamptz
            );
            grant usage on schema public, auth to anon, authenticated, service_role;
            grant all on public.profiles, public.service_providers to anon, authenticated, service_role;
            insert into auth.users values ('00000000-0000-0000-0000-000000000001', 'admin@example.test', '{"role":"landlord"}', 'unchanged-hash');
            insert into public.profiles(id,email,role,name,full_name,balance,is_verified) values
                ('00000000-0000-0000-0000-000000000001','admin@example.test','admin','Existing name','Existing name',50,true);
            insert into auth.users values ('00000000-0000-0000-0000-000000000002', 'missing@example.test', '{"role":"landlord","first_name":"Missing","last_name":"Profile"}', 'another-unchanged-hash');
        `)
        const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260920010000_auth_account_integrity.sql'), 'utf8')
        await database.exec(migration)
        await database.exec(migration)
        let rows = (await database.query('select role, full_name, balance::text, is_verified from public.profiles order by id')).rows
        assert.equal(rows.length, 2)
        assert.deepEqual(rows[0], { role: 'admin', full_name: 'Existing name', balance: '50', is_verified: true })
        assert.equal(rows[1].role, 'landlord')
        assert.equal(rows[1].full_name, 'Missing Profile')
        await database.exec(`
            insert into auth.users values ('00000000-0000-0000-0000-000000000003', 'attempt@example.test', '{"role":"admin","full_name":"Public Signup"}', 'new-hash');
            insert into auth.users values ('00000000-0000-0000-0000-000000000004', 'provider@example.test', '{"role":"service_provider","full_name":"Provider"}', 'provider-hash');
            insert into public.service_providers(id,user_id,full_name) values ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','Provider');
            set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
            set role authenticated;
        `)
        assert.equal((await database.query("select role from public.profiles where id = auth.uid()")).rows[0].role, 'tenant')
        for (const assignment of ["role = 'admin'", 'balance = 99999', 'is_verified = true', "verification_status = 'verified'", "status = 'suspended'"]) {
            await assert.rejects(database.exec(`update public.profiles set ${assignment} where id = auth.uid()`), error => error.code === '42501')
        }
        await assert.rejects(database.exec('delete from public.profiles where id = auth.uid()'), error => error.code === '42501')
        await assert.rejects(database.exec("update public.profiles set full_name = 'Other account' where id = '00000000-0000-0000-0000-000000000001'"), error => error.code === '42501')
        await database.exec("update public.profiles set full_name = 'Allowed name edit' where id = auth.uid()")
        await database.exec("set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004'")
        for (const assignment of ["approval_status = 'approved'", 'verified = true', "verification_status = 'verified'", 'verified_at = now()']) {
            await assert.rejects(database.exec(`update public.service_providers set ${assignment} where user_id = auth.uid()`), error => error.code === '42501')
        }
        await database.exec("update public.service_providers set full_name = 'Allowed provider edit' where user_id = auth.uid()")
        await assert.rejects(database.exec('delete from public.service_providers where user_id = auth.uid()'), error => error.code === '42501')
        await database.exec(`reset role; set role service_role;
            update public.service_providers set approval_status = 'approved' where user_id = '00000000-0000-0000-0000-000000000004';
            update public.profiles set is_verified = true where id = '00000000-0000-0000-0000-000000000004';
            reset role;
        `)
        assert.equal((await database.query('select approval_status from public.service_providers')).rows[0].approval_status, 'approved')
        assert.equal((await database.query("select encrypted_password from auth.users where id = '00000000-0000-0000-0000-000000000001'")).rows[0].encrypted_password, 'unchanged-hash')
        console.log('PASS: migration executes twice; existing accounts/password hashes preserved; missing profiles backfilled; public admin signup blocked; browser privilege edits rejected; profile edits and secured service updates allowed (isolated PostgreSQL fixture).')
    } finally { await database.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
