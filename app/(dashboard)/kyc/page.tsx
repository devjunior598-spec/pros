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
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="mb-6 rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">Identity verification</p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Complete your profile verification</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600">This helps us keep your account secure and unlock the full rental experience for you.</p>
                        </div>
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                            Secure and private
                        </div>
                    </div>
                </div>
                <KYCForm userId={user.id} currentProfile={profile} />
            </div>
        </DashboardGuard>
    );
}
