const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export interface VirtualAccountResponse {
    account_number: string;
    bank_name: string;
    account_name: string;
    customer_id: string;
}

export const paystack = {
    async createCustomer(email: string, firstName: string, lastName: string) {
        const response = await fetch('https://api.paystack.co/customer', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                first_name: firstName,
                last_name: lastName,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create Paystack customer');
        }
        return data.data;
    },

    async createDedicatedAccount(customerId: string) {
        // ... (existing code)
        const response = await fetch('https://api.paystack.co/dedicated_account', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: customerId,
                preferred_bank: "wema-bank"
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create Dedicated Virtual Account');
        }
        return data.data;
    },

    async resolveAccount(accountNumber: string, bankCode: string) {
        const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to resolve bank account');
        }
        return data.data; // { account_number, account_name, bank_id }
    },

    async listBanks() {
        const response = await fetch('https://api.paystack.co/bank?currency=NGN', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to list banks');
        }
        return data.data; // Array of { name, code, ... }
    },

    async createTransferRecipient(name: string, accountNumber: string, bankCode: string) {
        const response = await fetch('https://api.paystack.co/transferrecipient', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "nuban",
                name: name,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: "NGN"
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create transfer recipient');
        }
        return data.data; // { recipient_code, ... }
    },

    async initiateTransfer(amount: number, recipient: string, reference: string, reason: string) {
        const response = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: "balance",
                amount: amount * 100, // Paystack uses kobo
                recipient: recipient,
                reference: reference,
                reason: reason
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to initiate transfer');
        }
        return data.data; // { transfer_code, status, reference, ... }
    }
};
