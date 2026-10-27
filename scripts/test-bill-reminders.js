const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadModule(file, dependencies = {}, globals = {}) {
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
        console,
        process: { env: { NEXT_PUBLIC_SITE_URL: 'https://example.test' } },
        ...globals,
    }, { filename: file })
    return module.exports
}

const billDates = loadModule('lib/bill-dates.ts')
const fixedNow = new Date('2026-09-19T12:00:00Z')
const billId = '11111111-1111-4111-8111-111111111111'
const landlord = { user: { id: 'landlord' }, role: 'landlord' }
const tenant = { user: { id: 'tenant', email: 'tenant@example.test' }, role: 'tenant' }
const bill = {
    id: billId, type: 'water', amount: 5000, amount_paid: 1000, status: 'partially_paid',
    due_date: '2026-09-26',
    rental: { tenant_id: 'tenant', landlord_id: 'landlord', property_id: 'property', property: { title: 'Home' } },
}

function route(file, currentUser, record = bill) {
    const inserted = []
    const filters = []
    const gatewayCalls = []
    const admin = {
        from(table) {
            const query = {
                select() { return query },
                eq(column, value) { filters.push([column, value]); return query },
                async maybeSingle() { return { data: record, error: null } },
                async insert(value) { inserted.push({ table, value }); return { error: null } },
            }
            return query
        },
    }
    const loaded = loadModule(file, {
        'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
        '@/lib/supabase-admin': { supabaseAdmin: admin },
        '@/lib/supabase-server': { getCurrentUserWithRole: async () => currentUser },
        '@/lib/bill-dates': { getBillDaysUntilDue: dueDate => billDates.getBillDaysUntilDue(dueDate, fixedNow) },
    }, {
        fetch: async (url, options) => {
            gatewayCalls.push({ url, body: JSON.parse(options.body) })
            return { ok: true, json: async () => ({ data: { authorization_url: 'https://example.test/checkout' } }) }
        },
    })
    return { ...loaded, inserted, filters, gatewayCalls }
}

const request = body => ({ json: async () => body })

async function main() {
    const days = billDates.getBillDaysUntilDue
    assert.equal(days('2026-09-26', fixedNow), 7)
    assert.equal(days('2026-09-19', fixedNow), 0)
    assert.equal(days('2026-09-18', fixedNow), -1)
    assert.equal(days('2026-09-20', new Date('2026-09-19T23:30:00Z')), 0)
    assert.equal(days('2026-09-19', new Date('2026-09-19T22:59:59Z')), 0)
    assert.equal(days('2026-09-19', new Date('2026-09-19T23:00:00Z')), -1)
    assert.equal(days('2026-03-09', new Date('2026-03-08T10:00:00Z')), 1)
    assert.equal(days('2027-01-01', new Date('2026-12-31T12:00:00Z')), 1)

    const reminderFile = 'app/api/bills/remind/route.ts'
    for (const [user, expected] of [[null, 401], [tenant, 403]]) {
        const handler = route(reminderFile, user)
        assert.equal((await handler.POST(request({ billId }))).status, expected)
        assert.equal(handler.inserted.length, 0)
    }
    for (const body of [null, {}, { billId: 'invalid' }]) {
        assert.equal((await route(reminderFile, landlord).POST(request(body))).status, 400)
    }
    for (const [record, expected] of [[null, 404], [{ ...bill, status: 'paid' }, 400], [{ ...bill, amount_paid: 5000 }, 400]]) {
        const handler = route(reminderFile, landlord, record)
        assert.equal((await handler.POST(request({ billId }))).status, expected)
        assert.equal(handler.inserted.length, 0)
    }
    for (const [dueDate, timing] of [['2026-09-26', 'due in 7 days'], ['2026-09-19', 'due today'], ['2026-09-18', '1 day overdue']]) {
        for (const type of ['rent', 'electricity', 'water', 'waste', 'gas', 'service', 'custom']) {
            const handler = route(reminderFile, landlord, { ...bill, type, due_date: dueDate })
            assert.equal((await handler.POST(request({ billId }))).status, 200)
            assert.ok(handler.filters.some(([column, value]) => column === 'rental.landlord_id' && value === 'landlord'))
            assert.equal(handler.inserted.length, 1)
            const notification = handler.inserted[0].value
            assert.equal(notification.user_id, 'tenant')
            assert.equal(notification.link, '/pay-bills?billId=' + billId)
            assert.ok(notification.message.includes(timing))
            assert.ok(notification.message.includes('4,000'))
        }
    }
    const paymentFile = 'app/api/payments/initiate/route.ts'
    const payment = { amount: 4000, reference: 'rent-' + billId + '-test', paymentMethod: 'card', metadata: { bill_id: billId } }
    for (const dueDate of ['2026-09-26', '2026-09-19']) {
        const handler = route(paymentFile, tenant, { ...bill, due_date: dueDate })
        assert.equal((await handler.POST(request(payment))).status, 200)
        assert.equal(handler.gatewayCalls.length, 1)
        assert.equal(handler.gatewayCalls[0].body.amount, 400000)
    }
    const otherTenant = route(paymentFile, { ...tenant, user: { ...tenant.user, id: 'other-tenant' } })
    assert.equal((await otherTenant.POST(request(payment))).status, 403)
    assert.equal(otherTenant.inserted.length, 0)
    assert.equal(otherTenant.gatewayCalls.length, 0)
    const excessivePayment = route(paymentFile, tenant)
    assert.equal((await excessivePayment.POST(request({ ...payment, amount: 5000 }))).status, 400)
    assert.equal(excessivePayment.gatewayCalls.length, 0)
    console.log('PASS: bill reminders, calendar dates, early/same-day payment initialization, ownership and outstanding balance checks (mocked services; no real payments).')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
