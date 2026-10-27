const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadModule(file, dependencies = {}, globals = {}) {
    const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
        fileName: file,
    })
    const module = { exports: {} }
    vm.runInNewContext(compiled.outputText, {
        module, exports: module.exports,
        require(name) {
            if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name)
            return dependencies[name]
        },
        console: { error() {} },
        ...globals,
    }, { filename: file })
    return module.exports
}

const verification = loadModule('lib/auth-verification.ts')

function find(node, type) {
    if (!node || typeof node !== 'object') return null
    if (node.type === type) return node
    for (const child of [node.props?.children].flat(Infinity)) {
        const result = find(child, type)
        if (result) return result
    }
    return null
}

function findAll(node, predicate) {
    if (!node || typeof node !== 'object') return []
    return [...(predicate(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => findAll(child, predicate))]
}

function pageHarness(page, auth) {
    const hooks = []
    let cursor = 0
    const routes = []
    const tokenStore = verification.createCaptchaTokenStore()
    let resets = 0
    let effectStarted = false
    const react = {
        useEffect(callback) { if (!effectStarted) { effectStarted = true; callback() } },
        useState(initial) {
            const index = cursor++
            if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial
            return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
        },
        useRef(initial) {
            const index = cursor++
            if (!(index in hooks)) hooks[index] = { current: initial }
            return hooks[index]
        },
    }
    const jsx = (type, props) => ({ type, props })
    const profileQuery = {
        select() { return profileQuery },
        eq() { return profileQuery },
        async maybeSingle() { return { data: { role: page === 'provider-login' ? 'service_provider' : 'tenant' } } },
    }
    const component = loadModule('app/(auth)/' + page + '/page.tsx', {
        react,
        'react/jsx-runtime': { jsx, jsxs: jsx },
        'next/link': { __esModule: true, default: 'link' },
        'next/navigation': { useRouter: () => ({ replace: value => routes.push(value), push: value => routes.push(value) }) },
        'lucide-react': new Proxy({}, { get: (_, key) => key }),
        '@/components/ui/button': { Button: 'Button' },
        '@/components/ui/input': { Input: 'Input' },
        '@/components/ui/card': Object.fromEntries(['Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle', 'CardFooter'].map(name => [name, name])),
        '@/components/ui/alert': { Alert: 'Alert', AlertDescription: 'AlertDescription' },
        '@/lib/supabase': { supabase: { auth, from: () => profileQuery } },
        '@/lib/auth-verification': verification,
        '@/components/auth/auth-turnstile': { AuthTurnstile: 'turnstile', turnstileEnabled: true },
    }, { window: { location: { origin: 'https://example.test' } }, localStorage: { getItem: () => null } }).default
    function render() {
        cursor = 0
        const tree = component()
        const widget = find(tree, 'turnstile')
        if (widget) widget.props.ref.current = {
            consumeToken() { const token = tokenStore.consume(); widget.props.onTokenChange(''); return token },
            reset() { resets++; tokenStore.clear(); widget.props.onTokenChange('') },
        }
        return tree
    }
    return {
        render, routes,
        verify(token) { tokenStore.set(token); find(render(), 'turnstile').props.onTokenChange(token) },
        get resets() { return resets },
    }
}

function fillField(harness, id, value) {
    const field = findAll(harness.render(), node => node.props?.id === id)[0]
    assert.ok(field, 'Missing field ' + id)
    field.props.onChange({ target: { id, value } })
}
function fillPasswords(harness) {
    fillField(harness, 'password', 'test-password')
    fillField(harness, 'confirmPassword', 'test-password')
}
const submit = tree => find(tree, 'form').props.onSubmit({ preventDefault() {} })

async function main() {
    let clock = 1000
    const store = verification.createCaptchaTokenStore(() => clock)
    assert.equal(store.consume(), '')
    assert.equal(store.set('first'), true)
    assert.equal(store.consume(), 'first')
    assert.equal(store.consume(), '')
    assert.equal(store.set('first'), false)
    store.set('expired')
    clock += 280000
    assert.equal(store.consume(), '')
    store.set('fresh')
    clock += 279999
    assert.equal(store.consume(), 'fresh')
    store.set('cleared')
    store.clear()
    assert.equal(store.consume(), '')
    assert.match(verification.getAuthErrorMessage({ message: 'captcha protection: request disallowed (timeout-or-duplicate)' }), /check "Verify you are human" again/)
    assert.equal(verification.getAuthErrorMessage({ message: 'Invalid login credentials' }), 'Invalid login credentials')

    for (const hasSession of [false, true]) {
        let finish
        const calls = []
        const signup = pageHarness('signup', {
            signUp(input) { calls.push(input); return new Promise(resolve => { finish = resolve }) },
            signInWithPassword() { throw new Error('A signup token must never be reused for login') },
        })
        fillPasswords(signup)
        signup.verify('signup-token')
        const tree = signup.render()
        const first = submit(tree)
        const duplicate = submit(tree)
        assert.equal(calls.length, 1)
        assert.equal(calls[0].options.captchaToken, 'signup-token')
        finish({ data: { user: { user_metadata: { role: 'landlord' } }, session: hasSession ? { access_token: 'mock' } : null }, error: null })
        await Promise.all([first, duplicate])
        if (hasSession) assert.deepEqual(signup.routes, ['/dashboard/landlord'])
        else {
            assert.equal(signup.routes.length, 0)
            assert.match(JSON.stringify(signup.render()), /Check your email/)
        }
    }

    const retryCalls = []
    const retry = pageHarness('signup', {
        async signUp(input) {
            retryCalls.push(input)
            if (retryCalls.length === 1) return { data: {}, error: { message: 'captcha protection: request disallowed (timeout-or-duplicate)' } }
            return { data: { user: { user_metadata: { role: 'tenant' } }, session: null }, error: null }
        },
        signInWithPassword() { throw new Error('Unexpected login') },
    })
    fillPasswords(retry)
    retry.verify('old-token')
    await submit(retry.render())
    assert.equal(retry.resets, 1)
    assert.match(JSON.stringify(retry.render()), /Security verification expired or was already used/)
    await submit(retry.render())
    assert.equal(retryCalls.length, 1)
    retry.verify('new-token')
    await submit(retry.render())
    assert.equal(retryCalls.length, 2)
    assert.equal(retryCalls[1].options.captchaToken, 'new-token')
    assert.match(JSON.stringify(retry.render()), /Check your email/)

    for (const page of ['login', 'provider-login']) {
        let finish
        const calls = []
        const login = pageHarness(page, {
            signInWithPassword(input) { calls.push(input); return new Promise(resolve => { finish = resolve }) },
        })
        login.verify('login-token')
        const tree = login.render()
        const first = submit(tree)
        const duplicate = submit(tree)
        assert.equal(calls.length, 1)
        assert.equal(calls[0].options.captchaToken, 'login-token')
        finish({ data: { user: { id: 'user' } }, error: null })
        await Promise.all([first, duplicate])
        assert.equal(login.routes.length, 1)
    }
    for (const page of ['login', 'provider-login']) {
        const calls = []
        const confirmation = pageHarness(page, {
            async signInWithPassword() { return { data: {}, error: { message: 'Email not confirmed' } } },
            async resend(input) { calls.push(input); return { error: null } },
        })
        confirmation.verify('login-confirmation-token')
        await submit(confirmation.render())
        let resend = findAll(confirmation.render(), node => node.type === 'button' && JSON.stringify(node.props.children).includes('Resend confirmation email'))[0]
        await resend.props.onClick()
        assert.equal(calls.length, 0)
        confirmation.verify('fresh-confirmation-token')
        resend = findAll(confirmation.render(), node => node.type === 'button' && JSON.stringify(node.props.children).includes('Resend confirmation email'))[0]
        await resend.props.onClick()
        assert.equal(calls.length, 1)
        assert.equal(calls[0].options.captchaToken, 'fresh-confirmation-token')
    }

    const recoveryCalls = []
    const recovery = pageHarness('forgot-password', {
        async resetPasswordForEmail(email, options) {
            recoveryCalls.push({ email, options })
            if (recoveryCalls.length === 1) throw new Error('Temporary network failure')
            return { error: null }
        },
    })
    find(recovery.render(), 'Input').props.onChange({ target: { value: ' test@example.test ' } })
    recovery.verify('recovery-first')
    const recoveryTree = recovery.render()
    await Promise.all([submit(recoveryTree), submit(recoveryTree)])
    assert.equal(recoveryCalls.length, 1)
    assert.equal(recoveryCalls[0].email, 'test@example.test')
    assert.equal(recovery.resets, 1)
    await submit(recovery.render())
    assert.equal(recoveryCalls.length, 1)
    recovery.verify('recovery-second')
    await submit(recovery.render())
    assert.equal(recoveryCalls[1].options.captchaToken, 'recovery-second')
    assert.match(JSON.stringify(recovery.render()), /If this email has an account/)

    for (const hasSession of [false, true]) {
        const calls = []
        const reset = pageHarness('reset-password', {
            async getSession() { return { data: { session: hasSession ? { user: { id: 'test' } } : null }, error: null } },
            async updateUser(input) { calls.push(input); return { error: null } },
        })
        reset.render()
        await new Promise(resolve => setTimeout(resolve, 0))
        const inputs = findAll(reset.render(), node => node.type === 'Input')
        inputs.forEach(input => input.props.onChange({ target: { value: 'new-secure-password' } }))
        const tree = reset.render()
        await Promise.all([submit(tree), submit(tree)])
        assert.equal(calls.length, hasSession ? 1 : 0)
        assert.match(JSON.stringify(reset.render()), hasSession ? /saved data are unchanged/ : /expired or is invalid/)
    }

    const mismatchCalls = []
    const mismatch = pageHarness('signup', {
        async signUp(input) { mismatchCalls.push(input); return { data: { user: { id: 'test' }, session: null }, error: null } },
    })
    fillField(mismatch, 'password', 'test-password')
    fillField(mismatch, 'confirmPassword', 'different-password')
    mismatch.verify('still-unused-token')
    await submit(mismatch.render())
    assert.equal(mismatchCalls.length, 0)
    assert.match(JSON.stringify(mismatch.render()), /Passwords do not match/)
    for (const [label, id] of [['password', 'password'], ['confirm password', 'confirmPassword']]) {
        const toggle = findAll(mismatch.render(), node => node.props?.['aria-label'] === 'Show ' + label)[0]
        assert.ok(toggle)
        assert.equal(toggle.props.type, 'button')
        toggle.props.onClick()
        assert.equal(findAll(mismatch.render(), node => node.props?.id === id)[0].props.type, 'text')
        const hide = findAll(mismatch.render(), node => node.props?.['aria-label'] === 'Hide ' + label)[0]
        hide.props.onClick()
        assert.equal(findAll(mismatch.render(), node => node.props?.id === id)[0].props.type, 'password')
    }
    fillField(mismatch, 'confirmPassword', 'test-password')
    await submit(mismatch.render())
    assert.equal(mismatchCalls.length, 1)
    assert.equal(mismatchCalls[0].options.captchaToken, 'still-unused-token')
    assert.equal('confirmPassword' in mismatchCalls[0], false)

    const providerCalls = []
    const provider = pageHarness('provider-signup', {
        async signUp(input) { providerCalls.push(input); return { data: { user: { id: 'test' }, session: null }, error: null } },
        signInWithPassword() { throw new Error('Provider signup must not reuse the CAPTCHA token') },
    })
    function providerField(id, value) {
        const field = findAll(provider.render(), node => node.props?.id === id)[0]
        assert.ok(field, 'Missing provider field: ' + id)
        field.props.onChange({ target: { id, value } })
    }
    for (const [id, value] of Object.entries({ fullName: 'Test Provider', email: ' provider@example.test ', phone: '08000000000', password: 'secure-password', confirmPassword: 'secure-password' })) providerField(id, value)
    providerField('confirmPassword', 'different-password')
    await submit(provider.render())
    assert.match(JSON.stringify(provider.render()), /Passwords do not match/)
    assert.equal(providerCalls.length, 0)
    providerField('confirmPassword', 'secure-password')
    await submit(provider.render())
    for (const [id, value] of Object.entries({ category: 'Plumbing', experience: '3', bio: 'Test services' })) providerField(id, value)
    await submit(provider.render())
    providerField('state', 'Lagos')
    providerField('city', 'Ikeja')
    await submit(provider.render())
    provider.verify('provider-signup-token')
    await submit(provider.render())
    assert.equal(providerCalls.length, 1)
    assert.equal(providerCalls[0].email, 'provider@example.test')
    assert.equal(providerCalls[0].options.data.provider_registration.category, 'Plumbing')
    assert.match(JSON.stringify(provider.render()), /Confirm your email, then sign in to upload/)
    assert.equal(provider.routes.length, 0)

    console.log('PASS: single-use/expired tokens, signup confirmation without repeated login, fresh-token retries, duplicate submission guards, fresh-token confirmation resend/recovery, valid-session password reset, and provider confirmation before document uploads (mocked authentication).')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
