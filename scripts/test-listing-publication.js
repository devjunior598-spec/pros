const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const fixtures = [
    { id: 'visible', landlord_id: 'landlord', title: 'Published home', status: 'available', publication_status: 'published' },
    { id: 'archived', landlord_id: 'landlord', title: 'Archived home', status: 'available', publication_status: 'archived' },
    { id: 'draft', landlord_id: 'landlord', title: 'Draft home', status: 'available', publication_status: 'draft' },
]
function load(file, dependencies) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    const compiled = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
    const module = { exports: {} }
    vm.runInNewContext(compiled.outputText, { module, exports: module.exports, URL, process: { env: {} }, console: { error() {} },
        require(name) { assert.ok(name in dependencies, name); return dependencies[name] },
    })
    return module.exports
}
function client() {
    return { from(table) {
        assert.ok(['properties', 'profiles', 'payments'].includes(table), 'Unexpected downstream access: ' + table)
        let rows = table === 'properties' ? [...fixtures] : []
        const query = {
            select() { return query },
            eq(column, value) { rows = rows.filter(row => row[column] === value); return query },
            gte() { return query }, range() { return query }, order() { return query }, limit(count) { rows = rows.slice(0, count); return query },
            maybeSingle: async () => ({ data: rows[0] || null, error: null }),
            then(resolve, reject) { return Promise.resolve({ data: rows, count: rows.length, error: null }).then(resolve, reject) },
        }
        return query
    } }
}
async function main() {
    const dependencies = {
        'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
        '@/lib/supabase-admin': { supabaseAdmin: client() },
        '@/lib/supabase-server': { getCurrentUserWithRole: async () => ({ role: 'tenant', user: { id: 'tenant' } }) },
        '@/lib/notifications': { createNotification() { throw new Error('No notification should be sent') } },
    }
    dependencies['@supabase/supabase-js'] = { createClient: client }
    dependencies['@/lib/rate-limit'] = { getClientIp: () => 'test', rateLimit: async () => ({ success: true, remaining: 59 }) }
    const listings = await load('app/api/listings/route.ts', dependencies).GET({ url: 'https://example.test/api/listings' })
    assert.equal(listings.status, 200)
    assert.equal(listings.body.properties.length, 1)
    assert.equal(listings.body.properties[0].id, 'visible')
    const home = await load('app/api/public/home/route.ts', dependencies).GET()
    assert.equal(home.status, 200)
    assert.equal(home.body.stats.properties, 1)
    assert.equal(home.body.featuredProperties[0].id, 'visible')
    assert.equal(home.body.featuredProperties.length, 1)
    for (const propertyId of ['archived', 'draft']) {
        const application = await load('app/api/applications/route.ts', dependencies).POST({ formData: async () => new Map([['propertyId', propertyId]]) })
        assert.equal(application.status, 400)
        const rental = await load('app/api/rentals/apply/route.ts', dependencies).POST({ json: async () => ({ propertyId }) })
        assert.equal(rental.status, 404)
    }
    for (const file of ['listings/page.tsx', 'listings/[id]/page.tsx', 'listings/compare/page.tsx', 'landlords/page.tsx', 'landlords/[id]/page.tsx', 'properties/[id]/apply/page.tsx']) {
        const source = fs.readFileSync(path.join(__dirname, '../app/(public)', file), 'utf8')
        assert.match(source, /\.eq\(["']publication_status["'],\s*["']published["']\)/, file + ' must filter unpublished listings')
    }
    assert.equal(fixtures[1].status, 'available')
    console.log('PASS: only published listings appear on the homepage; archived/draft applications rejected before writes; all public property pages filter publication status. Mocked services; no account or rental changes.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
