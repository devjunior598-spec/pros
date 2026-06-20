'use server'

import { paystack } from "@/lib/paystack";

export async function getBanks() {
    try {
        if (!process.env.PAYSTACK_SECRET_KEY) {
            console.warn("PAYSTACK_SECRET_KEY is missing. Returning mock bank list.");
            return [
                { name: "Access Bank", code: "044" },
                { name: "Citibank Nigeria", code: "023" },
                { name: "Ecobank Nigeria", code: "050" },
                { name: "Fidelity Bank", code: "070" },
                { name: "First Bank of Nigeria", code: "011" },
                { name: "First City Monument Bank", code: "214" },
                { name: "Guaranty Trust Bank", code: "058" },
                { name: "Heritage Bank", code: "030" },
                { name: "Keystone Bank", code: "082" },
                { name: "Polaris Bank", code: "076" },
                { name: "Stanbic IBTC Bank", code: "221" },
                { name: "Standard Chartered Bank", code: "068" },
                { name: "Sterling Bank", code: "232" },
                { name: "SunTrust Bank", code: "100" },
                { name: "Union Bank of Nigeria", code: "032" },
                { name: "United Bank for Africa", code: "033" },
                { name: "Unity Bank", code: "215" },
                { name: "Wema Bank", code: "035" },
                { name: "Zenith Bank", code: "057" },
            ];
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
            console.warn("PAYSTACK_SECRET_KEY is missing. Returning mock verification.");
            // Mock verification logic
            if (accountNumber.length === 10) {
                return {
                    account_name: "JUSTINA O.", // Mock name matching likely user
                    account_number: accountNumber,
                    bank_id: bankCode
                };
            } else {
                return { error: "Invalid account number" };
            }
        }

        const account = await paystack.resolveAccount(accountNumber, bankCode);
        return account;
    } catch (error: any) {
        console.error("Error verifying account:", error);
        return { error: error.message || "Failed to verify account" };
    }
}
