"use server"

export async function getBanks() {
  return []
}

export async function verifyBankAccount(_accountNumber: string, _bankCode: string) {
  return { error: "U.S. payout setup is not configured yet." }
}
