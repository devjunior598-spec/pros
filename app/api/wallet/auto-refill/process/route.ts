import { usPaymentUnavailable } from "@/lib/payment-status"

export function GET() { return usPaymentUnavailable() }
