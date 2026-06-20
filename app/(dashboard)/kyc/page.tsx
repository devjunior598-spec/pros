import { DashboardGuard } from "@/components/dashboard-guard";
import { KYCForm } from "@/components/tenant/kyc-form";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function KYCPage() {
    const cookieStore = cookies();
    // In a real app, we'd get the user from the session properly
    // This is a simplified server-side check for this environment
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'tenant') {
        redirect("/dashboard");
    }

    if (profile?.is_verified) {
        redirect("/dashboard");
    }

    return (
        <DashboardGuard>
            <div className="container py-10">
                <KYCForm userId={user.id} currentProfile={profile} />
            </div>
        </DashboardGuard>
    );
}
