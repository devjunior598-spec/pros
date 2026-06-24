import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const userId = formData.get('userId') as string;
        const fullName = formData.get('fullName') as string;
        const phone = formData.get('phone') as string;
        const dob = formData.get('dob') as string;
        const address = formData.get('address') as string;
        const idType = formData.get('idType') as string;
        const idNumber = formData.get('idNumber') as string;
        const idImage = formData.get('idImage') as File;
        const selfieImage = formData.get('selfieImage') as File;

        // Employment and Emergency details
        const employmentCompany = formData.get('employmentCompany') as string || '';
        const employmentPosition = formData.get('employmentPosition') as string || '';
        const emergencyContactName = formData.get('emergencyContactName') as string || '';
        const emergencyContactPhone = formData.get('emergencyContactPhone') as string || '';
        const emergencyContactRelationship = formData.get('emergencyContactRelationship') as string || '';

        if (!userId || !idImage || !selfieImage) {
            return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
        }

        // 1. Upload ID Image to tenant-documents
        const idExt = idImage.name.split('.').pop();
        const idPath = `kyc/${userId}/id_${Date.now()}.${idExt}`;
        const { error: idUploadError } = await supabaseAdmin.storage
            .from('tenant-documents')
            .upload(idPath, idImage);

        if (idUploadError) throw idUploadError;

        const { data: { publicUrl: idUrl } } = supabaseAdmin.storage
            .from('tenant-documents')
            .getPublicUrl(idPath);

        // 2. Upload Selfie Image to tenant-documents
        const selfieExt = selfieImage.name.split('.').pop();
        const selfiePath = `kyc/${userId}/selfie_${Date.now()}.${selfieExt}`;
        const { error: selfieUploadError } = await supabaseAdmin.storage
            .from('tenant-documents')
            .upload(selfiePath, selfieImage);

        if (selfieUploadError) throw selfieUploadError;

        const { data: { publicUrl: selfieUrl } } = supabaseAdmin.storage
            .from('tenant-documents')
            .getPublicUrl(selfiePath);

        // 3. Update Profile with temporary info (Status: pending)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                name: fullName,
                phone: phone,
                verification_status: 'pending',
                kyc_submitted_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 4. Create KYC Record
        const { error: kycError } = await supabaseAdmin
            .from('tenant_kyc')
            .insert({
                tenant_id: userId,
                id_type: idType,
                id_number: idNumber,
                id_image_url: idUrl,
                selfie_image_url: selfieUrl,
                address: address,
                dob: dob,
                status: 'pending',
                employment_company: employmentCompany,
                employment_position: employmentPosition,
                emergency_contact_name: emergencyContactName,
                emergency_contact_phone: emergencyContactPhone,
                emergency_contact_relationship: emergencyContactRelationship
            });

        if (kycError) throw kycError;

        // Create notification
        await supabaseAdmin.rpc('create_notification', {
            p_user_id: userId,
            p_type: 'verification_submitted',
            p_title: 'Verification Submitted',
            p_message: 'Your tenant identity verification request has been successfully submitted and is under admin review.',
            p_link: '/dashboard/verification'
        });

        return NextResponse.json({ success: true, message: 'KYC submitted successfully' });
    } catch (error: any) {
        console.error('KYC Submission Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
