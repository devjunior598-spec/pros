import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const propertyId = formData.get('propertyId') as string;
        const landlordId = formData.get('landlordId') as string;
        
        const ownershipDoc = formData.get('ownershipDoc') as File;
        const agencyAgreement = formData.get('agencyAgreement') as File;
        
        // Handle multiple photos
        const photoFiles = formData.getAll('propertyPhotos') as File[];

        if (!propertyId || !landlordId || !ownershipDoc || !agencyAgreement) {
            return NextResponse.json({ message: 'Missing required files or fields' }, { status: 400 });
        }

        // 1. Upload Ownership Document
        const ownerDocExt = ownershipDoc.name.split('.').pop();
        const ownerDocPath = `properties/${propertyId}/ownership_${Date.now()}.${ownerDocExt}`;
        const { error: ownerUploadError } = await supabaseAdmin.storage
            .from('property-documents')
            .upload(ownerDocPath, ownershipDoc);
        if (ownerUploadError) throw ownerUploadError;
        const { data: { publicUrl: ownershipDocUrl } } = supabaseAdmin.storage.from('property-documents').getPublicUrl(ownerDocPath);

        // 2. Upload Agency Agreement
        const agencyExt = agencyAgreement.name.split('.').pop();
        const agencyPath = `properties/${propertyId}/agency_${Date.now()}.${agencyExt}`;
        const { error: agencyUploadError } = await supabaseAdmin.storage
            .from('property-documents')
            .upload(agencyPath, agencyAgreement);
        if (agencyUploadError) throw agencyUploadError;
        const { data: { publicUrl: agencyAgreementUrl } } = supabaseAdmin.storage.from('property-documents').getPublicUrl(agencyPath);

        // 3. Upload Property Photos
        const propertyPhotos: string[] = [];
        for (let i = 0; i < photoFiles.length; i++) {
            const photoFile = photoFiles[i];
            if (photoFile.size === 0) continue;
            const photoExt = photoFile.name.split('.').pop();
            const photoPath = `properties/${propertyId}/photo_${i}_${Date.now()}.${photoExt}`;
            const { error: photoUploadError } = await supabaseAdmin.storage
                .from('property-documents')
                .upload(photoPath, photoFile);
            if (photoUploadError) throw photoUploadError;
            const { data: { publicUrl } } = supabaseAdmin.storage.from('property-documents').getPublicUrl(photoPath);
            propertyPhotos.push(publicUrl);
        }

        // 4. Create Property Verification record
        const { error: verifError } = await supabaseAdmin
            .from('property_verifications')
            .insert({
                property_id: propertyId,
                landlord_id: landlordId,
                ownership_doc_url: ownershipDocUrl,
                agency_agreement_url: agencyAgreementUrl,
                property_photos: propertyPhotos,
                status: 'pending'
            });
        if (verifError) throw verifError;

        // 5. Update Property table verification_status
        const { error: propUpdateError } = await supabaseAdmin
            .from('properties')
            .update({ verification_status: 'pending' })
            .eq('id', propertyId);
        if (propUpdateError) throw propUpdateError;

        // Create notification for the landlord
        await supabaseAdmin.rpc('create_notification', {
            p_user_id: landlordId,
            p_type: 'property_verification_submitted',
            p_title: 'Property Verification Submitted',
            p_message: 'Your documents for property verification have been successfully uploaded and are pending admin review.',
            p_link: '/dashboard/verification'
        });

        return NextResponse.json({ success: true, message: 'Property verification submitted successfully' });
    } catch (error: any) {
        console.error('Property verification submit error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
