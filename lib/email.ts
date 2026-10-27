const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!RESEND_API_KEY) {
        console.log(`[Email Mock - Resend key missing] To: ${to} | Subject: ${subject}`);
        return { success: true, mock: true };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'PRMS <notifications@housedoplatform.com>',
                to: [to],
                subject,
                html,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Resend API error:', data);
            return { success: false, error: data };
        }
        return { success: true, data };
    } catch (err) {
        console.error('Failed to send email via Resend:', err);
        return { success: false, error: err };
    }
}

export function buildEmailTemplate({
    title,
    recipientName,
    message,
    ctaText,
    ctaUrl,
}: {
    title: string;
    recipientName: string;
    message: string;
    ctaText?: string;
    ctaUrl?: string;
}) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px; }
        .logo span { color: #3b82f6; }
        .badge { background-color: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .content { line-height: 1.6; font-size: 15px; color: #334155; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 20px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PRMS<span>.</span></div>
          <div class="badge">Official Notification</div>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Hello ${recipientName},</p>
          <p>${message}</p>
          ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText}</a>` : ''}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Property Rental Management System (PRMS). All rights reserved.</p>
          <p>This email was sent automatically. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
    `;
}
