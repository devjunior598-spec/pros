import { redirect } from "next/navigation"

export default function LegacyKycPage() {
    redirect("/settings?tab=identity")
}
