const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadModule(file, dependencies = {}) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    })
    const module = { exports: {} }
    vm.runInNewContext(compiled.outputText, {
        exports: module.exports,
        module,
        require(name) {
            if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name)
            return dependencies[name]
        },
        console: { error() {} },
    }, { filename: file })
    return module.exports
}

const helpers = loadModule('lib/bill-defaults.ts')
const plain = value => JSON.parse(JSON.stringify(value))
const request = body => ({ text: async () => JSON.stringify(body) })

async function main() {
    for (const [value, expected] of [
        ['', ''], ['5', '5'], ['50', '50'], ['500', '500'], ['5000', '5,000'],
        ['50000', '50,000'], ['500000', '500,000'], ['1000000', '1,000,000'],
        ['50000.', '50,000.'], ['50000.50', '50,000.50'], ['0.05', '0.05'],
    ]) assert.equal(helpers.formatBillAmount(value), expected)

    const water = { amount: '50000.50', dueDate: '2026-10-05', billingPeriod: ' October 2026 ' }
    const defaults = helpers.parseBillDefaults({ water })
    assert.deepEqual(plain(defaults.water), { amount: 50000.5, dueDate: '2026-10-05', billingPeriod: 'October 2026' })
    const fields = helpers.getBillDefaultFields(defaults, 'water')
    const editedBill = { ...fields, amount: '55000', dueDate: '2026-10-10' }
    assert.equal(editedBill.amount, '55000')
    assert.equal(defaults.water.amount, 50000.5)
    assert.equal(defaults.water.dueDate, '2026-10-05')
    assert.deepEqual(plain(helpers.getBillDefaultFields(defaults, 'gas')), { amount: '', dueDate: '', billingPeriod: '' })
    assert.equal(helpers.getBillDefaultFields(defaults, 'water').amount, '50000.5')
    assert.doesNotThrow(() => helpers.parseBillDefaults({ rent: { amount: 1000000000, dueDate: '2028-02-29', billingPeriod: '' } }))
    assert.doesNotThrow(() => helpers.parseBillDefaults({ rent: { amount: 0.01, dueDate: '', billingPeriod: '' } }))

    for (const amount of [0, -1, true, [], null, 'NaN', '5e4', '50,000', '50.001', '1000000001', '']) {
        assert.throws(() => helpers.parseBillDefaults({ water: { ...water, amount } }))
    }
    for (const dueDate of ['2026-02-30', '2026-02-29', '2026-13-01', 'tomorrow', null]) {
        assert.throws(() => helpers.parseBillDefaults({ water: { ...water, dueDate } }))
    }
    assert.throws(() => helpers.parseBillDefaults({ water: { ...water, billingPeriod: 'x'.repeat(81) } }))
    assert.throws(() => helpers.parseBillDefaults({ unknown: water }))
    assert.throws(() => helpers.parseBillDefaults([]))

    const users = {
        landlord: { id: 'landlord', user_metadata: { full_name: 'Landlord', bill_defaults: {} } },
        other: { id: 'other', user_metadata: { bill_defaults: { gas: { amount: 2000, dueDate: '', billingPeriod: '' } } } },
    }
    let identity = 'landlord'
    let role = 'landlord'
    let failedWrite = false
    const writes = []
    const api = loadModule('app/api/bills/defaults/route.ts', {
        'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers }) } },
        '@/lib/bill-defaults': helpers,
        '@/lib/supabase-server': { getCurrentUserWithRole: async () => identity ? { user: users[identity], role } : null },
        '@/lib/supabase-admin': { supabaseAdmin: { auth: { admin: {
            async updateUserById(id, attributes) {
                if (failedWrite) return { error: new Error('Database unavailable') }
                writes.push({ id, attributes })
                users[id].user_metadata = { ...users[id].user_metadata, ...plain(attributes.user_metadata) }
                return { error: null }
            },
        } } } },
    })

    assert.deepEqual(plain((await api.GET()).body.defaults), {})
    const saved = await api.PUT(request({ defaults: { water }, landlordId: 'other', userId: 'other' }))
    assert.equal(saved.status, 200)
    assert.equal(writes[0].id, 'landlord')
    assert.deepEqual(Object.keys(writes[0].attributes), ['user_metadata'])
    assert.deepEqual(Object.keys(writes[0].attributes.user_metadata), ['bill_defaults'])
    assert.equal(users.landlord.user_metadata.full_name, 'Landlord')
    const loaded = await api.GET()
    assert.deepEqual(plain(loaded.body.defaults), plain(defaults))
    assert.equal(loaded.headers['Cache-Control'], 'private, no-store')
    identity = 'other'
    assert.equal((await api.GET()).body.defaults.gas.amount, 2000)
    assert.equal((await api.GET()).body.defaults.water, undefined)
    identity = 'landlord'

    const allTypes = Object.fromEntries(helpers.BILL_TYPE_OPTIONS.map(option => [option.value, { ...water, amount: 50000 }]))
    assert.equal((await api.PUT(request({ defaults: allTypes }))).status, 200)
    assert.equal(Object.keys((await api.GET()).body.defaults).length, 7)
    assert.equal((await api.PUT(request({ defaults: {} }))).status, 200)
    assert.deepEqual(plain((await api.GET()).body.defaults), {})

    for (const body of [null, {}, { defaults: [] }, { defaults: { water: { ...water, amount: -1 } } }]) {
        const count = writes.length
        assert.equal((await api.PUT(request(body))).status, 400)
        assert.equal(writes.length, count)
    }
    assert.equal((await api.PUT({ text: async () => '{' })).status, 400)
    assert.equal((await api.PUT({ text: async () => 'x'.repeat(8193) })).status, 413)
    const count = writes.length
    for (const nextRole of ['tenant', 'service_provider', 'admin']) {
        role = nextRole
        assert.equal((await api.GET()).status, 403)
        assert.equal((await api.PUT(request({ defaults: { water } }))).status, 403)
    }
    identity = null
    assert.equal((await api.GET()).status, 401)
    assert.equal((await api.PUT(request({ defaults: { water } }))).status, 401)
    assert.equal(writes.length, count)
    identity = 'landlord'
    role = 'landlord'
    failedWrite = true
    assert.equal((await api.PUT(request({ defaults: { water } }))).status, 500)
    assert.equal(writes.length, count)
    console.log('PASS: formatting, default selection, one-off overrides, validation, save/reload/clear, and landlord isolation (mocked storage).')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
