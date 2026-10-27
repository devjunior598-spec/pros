import { NextRequest, NextResponse } from "next/server"
import { processPaymentReminders } from "@/lib/reminders"

export async function GET(req: NextRequest) {
    try {
        const result = await processPaymentReminders()
        return NextResponse.json({ success: true, ...result })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Reminder processing failed" }, { status: 500 })
    }
}
