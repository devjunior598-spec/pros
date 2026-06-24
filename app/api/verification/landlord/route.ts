import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const landlordId = formData.get('landlordId') as string;
        const fullName = formData.get('fullName') as string;
        const phone = formData.get('phone') as string;
        const idType = formData.get('idType') as string;
        const idNumber = formData.get('idNumber') as string;
        
        const idImage = formData.get('idImage') as File;
        const selfieImage = formData.get('selfieImage') as File;
        const cacDoc = formData.get('cacDoc') as File | null;
        const addressProof = formData.get('addressProof') as File;

        if (!landlordId || !idImage || !selfieImage || !addressProof) {
            return NextResponse.json({ message: 'Missing required files or fields' }, { status: 400 });
        }

        // 1. Upload ID Image
        const idExt = idImage.name.split('.').pop();
        const idPath = `landlord/${landlordId}/id_${Date.now()}.${idExt}`;
        const { error: idUploadError } = await supabaseAdmin.storage
            .from('landlord-documents')
            .upload(idPath, idImage);
        if (idUploadError) throw idUploadError;
        const { data: { publicUrl: idUrl } } = supabaseAdmin.storage.from('landlord-documents').getPublicUrl(idPath);

        // 2. Upload Selfie Image
        const selfieExt = selfieImage.name.split('.').pop();
        const selfiePath = `landlord/${landlordId}/selfie_${Date.now()}.${selfieExt}`;
        const { error: selfieUploadError } = await supabaseAdmin.storage
            .from('landlord-documents')
            .upload(selfiePath, selfieImage);
        if (selfieUploadError) throw selfieUploadError;
        const { data: { publicUrl: selfieUrl } } = supabaseAdmin.storage.from('landlord-documents').getPublicUrl(selfiePath);

        // 3. Upload CAC Doc (optional)
        let cacUrl = null;
        if (cacDoc && cacDoc.size > 0) {
            const cacExt = cacDoc.name.split('.').pop();
            const cacPath = `landlord/${landlordId}/cac_${Date.now()}.${cacExt}`;
            const { error: cacUploadError } = await supabaseAdmin.storage
                .from('landlord-documents')
                .upload(cacPath, cacDoc);
            if (cacUploadError) throw cacUploadError;
            const { data: { publicUrl: cUrl } } = supabaseAdmin.storage.from('landlord-documents').getPublicUrl(cacPath);
            cacUrl = cUrl;
        }

        // 4. Upload Utility Bill / Address Proof
        const addressExt = addressProof.name.split('.').pop();
        const addressPath = `landlord/${landlordId}/address_${Date.now()}.${addressExt}`;
        const { error: addressUploadError } = await supabaseAdmin.storage
            .from('landlord-documents')
            .upload(addressPath, addressProof);
        if (addressUploadError) throw addressUploadError;
        const { data: { publicUrl: addressUrl } } = supabaseAdmin.storage.from('landlord-documents').getPublicUrl(addressPath);

        // 5. Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                name: fullName,
                phone: phone,
                verification_status: 'pending',
                kyc_submitted_at: new Date().toISOString()
            })
            .eq('id', landlordId);
        if (profileError) throw profileError;

        // 6. Create Landlord KYC record
        const { error: kycError } = await supabaseAdmin
            .from('landlord_kyc')
            .insert({
                landlord_id: landlordId,
                id_type: idType,
                id_number: idNumber,
                id_url: idUrl,
                selfie_url: selfieUrl,
                cac_url: cacUrl,
                address_proof_url: addressUrl,
                status: 'pending'
            });
        if (kycError) throw kycError;

        // Create notification
        await supabaseAdmin.rpc('create_notification', {
            p_user_id: landlordId,
            p_type: 'verification_submitted',
            p_title: 'Verification Submitted',
            p_message: 'Your landlord identity verification request has been successfully submitted and is under admin review.',
            p_link: '/dashboard/verification'
        });

        return NextResponse.json({ success: true, message: 'Landlord verification submitted successfully' });
    } catch (error: any) {
        console.error('Landlord verification submit error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
