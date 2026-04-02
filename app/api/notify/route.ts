import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, batchId, type, productName, truckPlate } = body;

    // 1. Check if Resend Key exists
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is missing in environment' }, { status: 500 });
    }

    // 2. Validation
    if (!email) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    // 3. Sender Logic (Use 'onboarding@resend.dev' for free tier testing)
    const sender = 'onboarding@resend.dev';

    // 4. Define Email Template based on type
    let subject = '';
    let htmlContent = '';

    if (type === 'DISPATCH') {
      subject = `🚚 DISPATCH: Cargo ${batchId} is En Route`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #06b6d4;">SEIREIYOKI LOGISTICS</h2>
          <p>Consignment <strong>${productName}</strong> has been dispatched.</p>
          <p><strong>Tracking ID:</strong> ${batchId}</p>
          <p><strong>Vehicle:</strong> ${truckPlate}</p>
          <a href="https://seireiyoki.com.ng/batch/${batchId}" 
             style="display: inline-block; background: #06b6d4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
             VIEW LIVE TRACKING
          </a>
        </div>`;
    } else {
      subject = `✅ VERIFIED: Delivery Complete for ${batchId}`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #10b981;">DELIVERY AUTHENTICATED</h2>
          <p>Consignment <strong>${batchId}</strong> has reached its destination.</p>
          <p>The Secure Ledger is now finalized.</p>
          <a href="https://seireiyoki.com.ng/batch/${batchId}" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
             DOWNLOAD FINAL LEDGER
          </a>
        </div>`;
    }

    // 5. Send Email
    const { data, error } = await resend.emails.send({
      from: `SeireiYoki <${sender}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}