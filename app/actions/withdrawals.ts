'use server'

import { createServerClient, type CookieOptions } from "@supabase/ssr"
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

    const accountData: any = {
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        is_primary: false,
    }

    if (role === 'service_provider') {
        accountData.provider_id = user.id
    } else {
        accountData.landlord_id = user.id
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
    const idField = role === 'service_provider' ? 'provider_id' : 'landlord_id'

    const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq(idField, user.id)
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
    const idField = role === 'service_provider' ? 'provider_id' : 'landlord_id'

    const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id)
        .eq(idField, user.id)

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
        .select("fullname")
        .eq("id", user.id)
        .single()

    if (error) {
        console.error("Error fetching profile:", error)
        return null
    }

    return data
}

export async function requestWithdrawal(amount: number, bankAccountId: string) {
    const cookieStore = await cookies()

    if (amount <= 0) {
        return { error: "Withdrawal amount must be greater than 0." }
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

    // Check balance
    let hasSufficientBalance = false

    if (role === 'service_provider') {
        const { data: wallet } = await supabase
            .from('provider_wallets')
            .select('balance')
            .eq('provider_id', user.id)
            .single()
        hasSufficientBalance = wallet ? Number(wallet.balance) >= amount : false
    } else {
        const { data: wallet } = await supabase
            .from('landlord_wallets')
            .select('balance')
            .eq('landlord_id', user.id)
            .single()
        hasSufficientBalance = wallet ? Number(wallet.balance) >= amount : false
    }

    if (!hasSufficientBalance) {
        return { error: "Insufficient wallet balance." }
    }

    const withdrawalData: any = {
        amount: amount,
        bank_account_id: bankAccountId,
        status: 'pending',
        reference: `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    }

    if (role === 'service_provider') {
        withdrawalData.provider_id = user.id
    } else {
        withdrawalData.landlord_id = user.id
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

    if (role === 'service_provider') {
        const { data: wallet } = await supabase
            .from('provider_wallets')
            .select('balance')
            .eq('provider_id', user.id)
            .single()
        return { balance: wallet ? Number(wallet.balance) : 0 }
    } else {
        const { data: wallet } = await supabase
            .from('landlord_wallets')
            .select('balance')
            .eq('landlord_id', user.id)
            .single()
        return { balance: wallet ? Number(wallet.balance) : 0 }
    }
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
    const idField = role === 'service_provider' ? 'provider_id' : 'landlord_id'

    const { data, error } = await supabase
        .from('withdrawals')
        .select(`*, bank_account:bank_accounts(bank_name)`)
        .eq(idField, user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching withdrawals:", error)
        return { data: [] }
    }

    return { data: data || [] }
}
