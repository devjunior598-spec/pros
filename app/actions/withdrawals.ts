'use server'

const payoutUnavailable = "U.S. payout setup is not configured yet. Withdrawals and bank account management are paused."

export async function addBankAccount(_formData: FormData) {
    return { error: payoutUnavailable }
}

export async function getBankAccounts() {
    return { data: [] }
}

export async function deleteBankAccount(_id: string) {
    return { error: payoutUnavailable }
}

export async function getProfile() {
    return null
}

export async function requestWithdrawal(_amount: number, _bankAccountId: string) {
    return { error: payoutUnavailable }
}

export async function getAutoWithdrawalSettings() {
    return { enabled: false, threshold: 0, bankAccountId: null }
}

export async function updateAutoWithdrawalSettings(_enabled: boolean, _bankAccountId: string | null) {
    return { error: payoutUnavailable }
}

export async function getBalance() {
    return { balance: 0 }
}

export async function getWithdrawals() {
    return { data: [] }
}
