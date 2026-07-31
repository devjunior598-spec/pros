'use server'

import { paystack } from "@/lib/paystack";

export async function getBanks() {
    try {
        if (!process.env.PAYSTACK_SECRET_KEY) {
            console.warn("PAYSTACK_SECRET_KEY is missing. Bank list cannot be loaded.");
            return [];
        }
        const banks = await paystack.listBanks();
        return banks.map((bank: any) => ({
            name: bank.name,
            code: bank.code,
        }));
    } catch (error) {
        console.error("Error fetching banks:", error);
        return [];
    }
}

export async function verifyBankAccount(accountNumber: string, bankCode: string) {
    try {
        if (!accountNumber || !bankCode) {
            return { error: "Missing account number or bank code" };
        }

        if (!process.env.PAYSTACK_SECRET_KEY) {
            console.warn("PAYSTACK_SECRET_KEY is missing. Bank account verification cannot run.");
            return { error: "Payment verification is not configured yet." };
        }

        const account = await paystack.resolveAccount(accountNumber, bankCode);
        return account;
    } catch (error: any) {
        console.error("Error verifying account:", error);
        return { error: error.message || "Failed to verify account" };
    }
}
