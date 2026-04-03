import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, batchId, type, productName, truckPlate } = body;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    // UPDATED: Using the verified root domain
    const senderEmail = 'updates@seirei.com.ng'; 
    const baseUrl = 'https://www.seirei.com.ng';

    let subject = '';
    let htmlContent = '';
    const themeColor = type === 'DISPATCH' ? '#06b6d4' : '#10b981';

    if (type === 'DISPATCH') {
      subject = `🚚 DISPATCH: Cargo ${batchId} is En Route`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 40px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: ${themeColor}; margin-top: 0;">SEIREI LOGISTICS</h2>
            <p style="font-size: 16px; color: #374151;">Consignment <strong>${productName || 'Industrial Goods'}</strong> has been dispatched.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Tracking ID:</strong> ${batchId}</p>
                <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${truckPlate || 'Verified Fleet'}</p>
            </div>
            <a href="${baseUrl}/batch/${batchId}" 
               style="display: inline-block; background: ${themeColor}; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">
               ACCESS LIVE FORENSIC TRACKING
            </a>
          </div>
        </div>`;
    } else {
      subject = `✅ VERIFIED: Delivery Complete for ${batchId}`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 40px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: ${themeColor}; margin-top: 0;">DELIVERY AUTHENTICATED</h2>
            <p style="font-size: 16px; color: #374151;">Consignment <strong>${batchId}</strong> has reached its destination.</p>
            <a href="${baseUrl}/batch/${batchId}" 
               style="display: inline-block; background: ${themeColor}; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">
               DOWNLOAD FINAL LEDGER
            </a>
          </div>
        </div>`;
    }

    const { data, error } = await resend.emails.send({
      from: `Seirei <${senderEmail}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}