import { NextResponse } from "next/server"

export function usPaymentUnavailable() {
  return NextResponse.json(
    { error: "U.S. payment processing is not configured. No payment was taken." },
    { status: 503 },
  )
}

export function legacyPaymentWebhookRetired() {
  return NextResponse.json(
    { message: "This legacy payment integration has been retired." },
    { status: 410 },
  )
}
