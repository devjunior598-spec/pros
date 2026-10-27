const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { File } = require('node:buffer')
const { webcrypto } = require('node:crypto')

const root = process.env.PRMS_TEST_ROOT || path.join(__dirname, '..')
function load(file, dependencies = {}, globals = {}) {
    const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
        reportDiagnostics: true,
    })
    assert.equal(compiled.diagnostics.length, 0, file)
    const module = { exports: {} }
    vm.runInNewContext(compiled.outputText, {
        module, exports: module.exports, URL, Request, Response, Headers, File, FormData, TextDecoder,
        crypto: webcrypto, console: { error() {} }, setTimeout, clearTimeout,
        require(name) { assert.ok(name in dependencies, `Unexpected import ${name}`); return dependencies[name] },
        ...globals,
    }, { filename: file })
    return module.exports
}
const nextResponse = {
    json: (body, options) => Response.json(body, options),
    redirect: destination => new Response(null, { status: 307, headers: { location: String(destination) } }),
}
const flush = () => new Promise(resolve => setTimeout(resolve, 5))
function deferred() {
    let resolve
    const promise = new Promise(done => { resolve = done })
    return { promise, resolve }
}

async function testCallbacks() {
    const redirects = load('lib/auth-redirects.ts')
    for (const destination of ['https://evil.test', '//evil.test', '/admin', '/\\evil.test', null]) {
        assert.equal(redirects.safeAuthDestination(destination), '/dashboard')
    }
    const calls = []
    let error = null
    const callback = load('app/auth/callback/route.ts', {
        'next/server': { NextResponse: nextResponse },
        '@/lib/auth-redirects': redirects,
        '@/lib/supabase-server': { createClient: async () => ({ auth: {
            exchangeCodeForSession: async code => { calls.push(['code', code]); return { error } },
            verifyOtp: async input => { calls.push(['otp', input.type]); return { error } },
        } }) },
    }).GET
    let response = await callback(new Request('https://example.test/auth/callback?code=test&next=https://evil.test'))
    assert.equal(response.headers.get('location'), 'https://example.test/dashboard')
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
    assert.deepEqual(calls, [['code', 'test']])
    response = await callback(new Request('https://example.test/auth/confirm?token_hash=test&type=recovery&next=/dashboard'))
    assert.equal(response.headers.get('location'), 'https://example.test/reset-password')
    assert.deepEqual(calls[1], ['otp', 'recovery'])
    error = { message: 'Expired' }
    response = await callback(new Request('https://example.test/auth/callback?code=expired'))
    assert.equal(response.headers.get('location'), 'https://example.test/auth/error')
    response = await callback(new Request('https://example.test/auth/callback?token_hash=test&type=invalid'))
    assert.equal(response.headers.get('location'), 'https://example.test/auth/error')
    assert.equal(calls.length, 3)
}

function providerHarness() {
    const state = { user: null, existing: null, uploads: [], removed: [], inserts: [], insertError: null, uploadError: false }
    const query = {
        select() { return query }, eq() { return query },
        async maybeSingle() { return { data: state.existing, error: null } },
        async insert(value) { state.inserts.push(value); return { error: state.insertError } },
    }
    const storage = {
        async upload(storagePath) {
            if (state.uploadError && state.uploads.length) return { error: new Error('Upload interrupted') }
            state.uploads.push(storagePath)
            return { error: null }
        },
        async remove(paths) { state.removed.push(...paths); return { error: null } },
    }
    const { POST } = load('app/api/providers/onboarding/route.ts', {
        'next/server': { NextResponse: nextResponse },
        '@/lib/supabase-server': { getCurrentUserWithRole: async () => state.user },
        '@/lib/supabase-admin': { supabaseAdmin: { from: () => query, storage: { from(bucket) { assert.equal(bucket, 'provider_documents'); return storage } } } },
    })
    const form = () => {
        const data = new FormData()
        for (const [key, value] of Object.entries({ fullName: 'Test Provider', phone: '08000000000', category: 'Plumbing', state: 'Lagos', city: 'Ikeja', bio: 'Plumbing services', experience: '3' })) data.set(key, value)
        data.set('profilePhoto', new File([new Uint8Array([255, 216, 255, 0])], 'photo.jpg', { type: 'image/jpeg' }))
        data.set('governmentId', new File(['%PDF-test'], 'id.pdf', { type: 'application/pdf' }))
        return data
    }
    return { state, form, post: (data = form()) => POST({ headers: new Headers(), formData: async () => data }) }
}

async function testProvider() {
    const harness = providerHarness()
    assert.equal((await harness.post()).status, 401)
    harness.state.user = { role: 'tenant', user: { id: 'user' } }
    assert.equal((await harness.post()).status, 403)
    harness.state.user.role = 'service_provider'
    assert.equal((await harness.post()).status, 403)
    assert.equal(harness.state.uploads.length, 0)
    harness.state.user.user.email_confirmed_at = '2026-09-20'
    harness.state.existing = { id: 'existing' }
    assert.equal((await harness.post()).status, 200)
    assert.equal(harness.state.inserts.length, 0)
    harness.state.existing = null
    const missingExperience = harness.form()
    missingExperience.delete('experience')
    assert.equal((await harness.post(missingExperience)).status, 400)
    const forgedImage = harness.form()
    forgedImage.set('profilePhoto', new File(['<script>bad</script>'], 'photo.jpg', { type: 'image/jpeg' }))
    assert.equal((await harness.post(forgedImage)).status, 400)
    assert.equal(harness.state.uploads.length, 0)
    assert.equal((await harness.post()).status, 201)
    assert.equal(harness.state.uploads.length, 2)
    const saved = harness.state.inserts[0]
    assert.equal(saved.full_name, 'Test Provider')
    assert.equal(saved.user_id, 'user')
    assert.equal(saved.approval_status, 'pending')
    assert.equal(saved.verified, false)
    assert.equal(saved.certificates.length, 0)
    assert.equal(saved.skills[0], 'Plumbing')
    assert.equal(saved.trades[0], 'Plumbing')
    assert.equal(saved.service_areas[0], 'Ikeja, Lagos')
    assert.match(saved.id_document_path, /^user\//)
    assert.equal(harness.state.removed.length, 0)
    const uploadFailure = providerHarness()
    uploadFailure.state.user = harness.state.user
    uploadFailure.state.uploadError = true
    assert.equal((await uploadFailure.post()).status, 500)
    assert.equal(uploadFailure.state.removed.length, 1)
    assert.equal(uploadFailure.state.inserts.length, 0)
    const uncertainInsert = providerHarness()
    uncertainInsert.state.user = harness.state.user
    uncertainInsert.state.insertError = new Error('Response lost after commit')
    assert.equal((await uncertainInsert.post()).status, 500)
    assert.equal(uncertainInsert.state.removed.length, 0, 'Never delete documents after an uncertain database commit')
    uncertainInsert.state.existing = { id: 'user' }
    assert.equal((await uncertainInsert.post()).status, 200)
    assert.equal(uncertainInsert.state.inserts.length, 1)
}

function contextHarness(sessionResult) {
    const hooks = []
    const effects = []
    const queries = []
    let cursor = 0
    let authListener
    let signouts = 0
    let unsubscribed = 0
    let cleanup
    const react = {
        createContext: () => ({ Provider: 'provider' }), useContext() {},
        useState(initial) {
            const index = cursor++
            if (!(index in hooks)) hooks[index] = initial
            return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
        },
        useRef(initial) { const index = cursor++; return hooks[index] || (hooks[index] = { current: initial }) },
        useEffect(callback) { effects.push(callback) },
    }
    const jsx = (type, props) => ({ type, props })
    const auth = {
        onAuthStateChange(callback) { authListener = callback; return { data: { subscription: { unsubscribe() { unsubscribed++ } } } } },
        getSession: async () => sessionResult,
        signOut: async () => { signouts++ },
    }
    const { AuthProvider } = load('contexts/auth-context.tsx', {
        react, 'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/lib/supabase': { supabase: { auth, from(table) {
            const pending = deferred()
            const query = { table, pending, select() { return query }, eq(column, value) { query.userId = value; return query }, maybeSingle() { queries.push(query); return pending.promise } }
            return query
        } } },
    }, { window: { addEventListener() {}, removeEventListener() {} } })
    const render = () => { cursor = 0; return AuthProvider({ children: null }).props.value }
    render()
    cleanup = effects[0]()
    return { render, queries, emit: session => authListener('SIGNED_IN', session), cleanup: () => cleanup(), get signouts() { return signouts }, get unsubscribed() { return unsubscribed } }
}

async function testSessionLifecycle() {
    const outage = contextHarness({ data: { session: null }, error: new Error('Network failed') })
    await flush()
    assert.equal(outage.signouts, 0)
    assert.match(outage.render().authError, /reconnect/)
    assert.equal(outage.render().loading, false)
    outage.cleanup()
    const initial = { user: { id: 'first' } }
    const harness = contextHarness({ data: { session: initial }, error: null })
    await flush()
    assert.equal(harness.queries.length, 1)
    harness.emit({ user: { id: 'second' } })
    await flush()
    harness.queries[1].pending.resolve({ data: { id: 'second', role: 'tenant' }, error: null })
    await flush()
    harness.queries[0].pending.resolve({ data: { id: 'first', role: 'landlord' }, error: null })
    await flush()
    assert.equal(harness.render().profile.id, 'second')
    harness.emit(null)
    assert.equal(harness.render().profile, null)
    assert.equal(harness.render().user, null)
    harness.emit({ user: { id: 'third' } })
    await flush()
    harness.cleanup()
    harness.queries[2].pending.resolve({ data: { id: 'third', role: 'landlord' }, error: null })
    await flush()
    assert.equal(harness.render().profile, null)
    assert.equal(harness.unsubscribed, 1)
    assert.equal(harness.signouts, 0)
    const provider = contextHarness({ data: { session: { user: { id: 'provider' } } }, error: null })
    await flush()
    provider.queries[0].pending.resolve({ data: { id: 'provider', role: 'service_provider' }, error: null })
    await flush()
    provider.queries[1].pending.resolve({ data: null, error: null })
    await flush()
    assert.equal(provider.render().providerStatus, 'incomplete')
    provider.cleanup()
}

async function testProxyCookies() {
    let authCookies
    const responses = {
        ...nextResponse,
        next: () => attachCookies(new Response()),
        redirect: destination => attachCookies(nextResponse.redirect(destination)),
        json: (body, options) => attachCookies(nextResponse.json(body, options)),
    }
    function attachCookies(response) {
        const values = []
        response.cookies = { getAll: () => values, set(cookie, value, options) { values.push(typeof cookie === 'string' ? { name: cookie, value, ...options } : cookie) } }
        return response
    }
    let claims = { data: { claims: { sub: 'user', aal: 'aal2' } }, error: null }
    const proxy = load('proxy.ts', {
        'next/server': { NextResponse: responses },
        '@supabase/ssr': { createServerClient(url, key, options) {
            authCookies = options.cookies
            const query = { select() { return query }, eq() { return query }, maybeSingle: async () => ({ data: { role: 'admin' } }) }
            return { from: () => query, auth: {
                async getClaims() { authCookies.setAll([{ name: 'session', value: 'refreshed', options: { httpOnly: true } }]); return claims },
                getUser: async () => ({ data: { user: { email_confirmed_at: '2026-09-20' } }, error: null }),
            } }
        } },
        '@/lib/rate-limit': { getClientIp: () => 'test', rateLimit: async () => ({ success: true }) },
    }, { process: { env: {} } }).proxy
    const request = pathname => {
        const url = new URL('https://example.test' + pathname)
        url.clone = () => new URL(url)
        return { nextUrl: url, method: 'GET', headers: new Headers(), cookies: { getAll: () => [], set() {} } }
    }
    let response = await proxy(request('/login'))
    assert.equal(response.status, 307)
    assert.equal(response.cookies.getAll()[0].value, 'refreshed')
    response = await proxy(request('/admin/dashboard'))
    assert.equal(response.status, 200, 'Confirmed email is checked on the user, not a nonexistent JWT claim')
    claims = { data: null, error: { name: 'AuthRetryableFetchError', status: 503 } }
    response = await proxy(request('/dashboard'))
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('location'), null)
    response = await proxy(request('/reset-password?code=one-time'))
    const destination = new URL(response.headers.get('location'))
    assert.equal(destination.pathname, '/auth/callback')
    assert.equal(destination.searchParams.get('next'), '/reset-password')
}

async function main() {
    await testCallbacks()
    await testProvider()
    await testSessionLifecycle()
    await testProxyCookies()
    console.log('PASS: safe email callbacks, provider authorization/validation/retries, private document persistence, session outage/account-switch races, refreshed redirect cookies, and admin confirmation (mocked dependencies).')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
