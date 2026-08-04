'use server'

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function addBankAccount(formData: FormData) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to add a bank account." }
    }

    const bankName = formData.get("bankName") as string
    const bankCode = formData.get("bankCode") as string
    const accountNumber = formData.get("accountNumber") as string
    const accountName = formData.get("accountName") as string

    if (!bankName || !bankCode || !accountNumber || !accountName) {
        return { error: "All fields are required." }
    }

    if (accountNumber.length !== 10) {
        return { error: "Account number must be 10 digits." }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role

    if (role !== 'landlord') {
        return { error: "Only landlords can manage withdrawal bank accounts." }
    }

    const accountData = {
        landlord_id: user.id,
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        is_primary: false,
    }

    // Insert into database
    const { error } = await supabase.from("bank_accounts").insert(accountData)

    if (error) {
        console.error("Error adding bank account:", error)
        return { error: "Failed to add bank account." }
    }

    return { success: true }
}

export async function getBankAccounts() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not authenticated" }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role
    if (role !== 'landlord') {
        return { error: "Only landlords can view withdrawal bank accounts." }
    }

    const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq('landlord_id', user.id)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching bank accounts:", error)
        return { error: "Failed to fetch bank accounts" }
    }

    return { data }
}

export async function deleteBankAccount(id: string) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not authenticated" }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role
    if (role !== 'landlord') {
        return { error: "Only landlords can delete withdrawal bank accounts." }
    }

    const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id)
        .eq('landlord_id', user.id)

    if (error) {
        console.error("Error deleting bank account:", error)
        return { error: "Failed to delete bank account" }
    }

    return { success: true }
}

export async function getProfile() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("full_name, name")
        .eq("id", user.id)
        .single()

    if (error) {
        console.error("Error fetching profile:", error)
        return null
    }

    return { fullname: data.full_name || data.name }
}

export async function requestWithdrawal(amount: number, bankAccountId: string) {
    const cookieStore = await cookies()

    if (!Number.isFinite(amount) || amount < 5000) {
        return { error: "The minimum withdrawal amount is ₦5,000." }
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to request a withdrawal." }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role

    if (role !== 'landlord') {
        return { error: "Only landlords can request withdrawals." }
    }

    const [{ data: wallet }, { data: bankAccount }, { data: pendingWithdrawal }] = await Promise.all([
        supabase
            .from('wallets')
            .select('balance')
            .eq('tenant_id', user.id)
            .maybeSingle(),
        supabase
            .from('bank_accounts')
            .select('id, bank_name, account_number, account_name')
            .eq('id', bankAccountId)
            .eq('landlord_id', user.id)
            .maybeSingle(),
        supabase
            .from('withdrawals')
            .select('id')
            .eq('landlord_id', user.id)
            .in('status', ['pending', 'processing'])
            .limit(1)
            .maybeSingle(),
    ])

    if (!bankAccount) {
        return { error: "Select a bank account registered to your landlord account." }
    }

    if (!wallet || Number(wallet.balance) < amount) {
        return { error: "Insufficient wallet balance." }
    }

    if (pendingWithdrawal) {
        return { error: "You already have a withdrawal being processed." }
    }

    const withdrawalData = {
        amount: amount,
        status: 'pending',
        landlord_id: user.id,
        bank_name: bankAccount.bank_name,
        account_number: bankAccount.account_number,
        account_name: bankAccount.account_name,
    }

    const { error } = await supabase
        .from("withdrawals")
        .insert(withdrawalData)

    if (error) {
        console.error("Error requesting withdrawal:", error)
        return { error: "Failed to submit withdrawal request." }
    }

    return { success: true }
}

export async function getAutoWithdrawalSettings() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { enabled: false, threshold: 100000, bankAccountId: null }

    const { data } = await supabase
        .from("profiles")
        .select("auto_withdrawal_enabled, auto_withdrawal_threshold, auto_withdrawal_bank_account_id")
        .eq("id", user.id)
        .maybeSingle()

    return {
        enabled: data?.auto_withdrawal_enabled ?? false,
        threshold: Number(data?.auto_withdrawal_threshold ?? 100000),
        bankAccountId: data?.auto_withdrawal_bank_account_id ?? null,
    }
}

export async function updateAutoWithdrawalSettings(enabled: boolean, bankAccountId: string | null) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "You must be logged in." }
    if (enabled && !bankAccountId) return { error: "Add and select a bank account first." }

    if (bankAccountId) {
        const { data: account } = await supabase
            .from("bank_accounts")
            .select("id")
            .eq("id", bankAccountId)
            .eq("landlord_id", user.id)
            .maybeSingle()
        if (!account) return { error: "Select a bank account registered to your account." }
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            auto_withdrawal_enabled: enabled,
            auto_withdrawal_threshold: 100000,
            auto_withdrawal_bank_account_id: enabled ? bankAccountId : null,
        })
        .eq("id", user.id)

    return error ? { error: error.message } : { success: true }
}

export async function getBalance() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { balance: 0 }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role

    if (role !== 'landlord') {
        return { balance: 0 }
    }

    const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('tenant_id', user.id)
        .maybeSingle()

    return { balance: wallet ? Number(wallet.balance) : 0 }
}

export async function getWithdrawals() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { data: [] }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role
    if (role !== 'landlord') {
        return { data: [] }
    }

    const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching withdrawals:", error)
        return { data: [] }
    }

    return { data: data || [] }
}
