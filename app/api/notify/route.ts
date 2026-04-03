import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, managerEmail, batchId, type, productName, truckPlate } = body;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const senderEmail = 'updates@seirei.com.ng'; 
    const baseUrl = 'https://www.seirei.com.ng';
    const trackingUrl = `${baseUrl}/batch/${batchId}`;
    const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(trackingUrl)}&size=150&margin=2`;

    const themeColor = type === 'DISPATCH' ? '#06b6d4' : '#10b981';
    const statusLabel = type === 'DISPATCH' ? 'TRANSIT ACTIVE' : 'DELIVERY VERIFIED';

    // B2B Professional Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #f4f7f9; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 40px; }
            .container { max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { background-color: #050505; padding: 30px; text-align: left; }
            .brand { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -1px; font-style: italic; margin: 0; }
            .content { padding: 40px 30px; }
            .badge { display: inline-block; padding: 4px 12px; background-color: ${themeColor}10; color: ${themeColor}; border: 1px solid ${themeColor}30; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
            .title { font-family: 'Helvetica', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a202c; margin: 0 0 15px 0; }
            .text { font-family: 'Helvetica', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4a5568; margin-bottom: 25px; }
            .specs-table { width: 100%; background-color: #f8fafc; border-radius: 8px; border-collapse: collapse; margin-bottom: 30px; }
            .specs-td { padding: 15px; border-bottom: 1px solid #edf2f7; font-family: 'Helvetica', Arial, sans-serif; }
            .label { font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 700; }
            .value { font-size: 13px; color: #1a202c; font-weight: 600; text-align: right; }
            .qr-box { padding: 20px; border: 1px dashed #cbd5e0; border-radius: 12px; text-align: center; margin-bottom: 30px; }
            .btn { display: inline-block; background-color: #050505; color: #ffffff !important; padding: 16px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-family: 'Helvetica', Arial, sans-serif; font-size: 11px; color: #a0aec0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <p class="brand">SEIREI</p>
              </div>
              <div class="content">
                <div class="badge">${statusLabel}</div>
                <h1 class="title">${type === 'DISPATCH' ? 'Logistics Dispatch Notice' : 'Final Delivery Confirmation'}</h1>
                <p class="text">This is an automated forensic update regarding your consignment. The supply chain ledger has been updated with the following telemetry data.</p>
                
                <table class="specs-table">
                  <tr>
                    <td class="specs-td"><span class="label">Node ID</span></td>
                    <td class="specs-td" style="text-align:right;"><span class="value">${batchId}</span></td>
                  </tr>
                  <tr>
                    <td class="specs-td"><span class="label">Commodity</span></td>
                    <td class="specs-td" style="text-align:right;"><span class="value">${productName || 'Verified Cargo'}</span></td>
                  </tr>
                  <tr style="border:none;">
                    <td class="specs-td"><span class="label">Asset Plate</span></td>
                    <td class="specs-td" style="text-align:right;"><span class="value">${truckPlate || 'Assigned Fleet'}</span></td>
                  </tr>
                </table>

                <div class="qr-box">
                  <img src="${qrCodeUrl}" width="120" height="120" alt="Tracking QR" style="margin-bottom:10px;">
                  <p style="font-family: Arial; font-size: 10px; color: #718096; margin:0;">Scan for instant mobile authentication</p>
                </div>

                <div style="text-align: center;">
                  <a href="${trackingUrl}" class="btn">View Digital Ledger</a>
                </div>
              </div>
              <div class="footer">
                <strong>SEIREI SUPPLY CHAIN FORENSICS</strong><br>
                Verification Node: NG-LGS-2026<br>
                This security transmission is intended for authorized parties only.
              </div>
            </div>
          </div>
        </body>
      </html>`;

    // 5. Send Email to both Buyer AND Manager
    const recipients = [email];
    if (managerEmail) recipients.push(managerEmail);

    const { data, error } = await resend.emails.send({
      from: `Seirei Updates <${senderEmail}>`,
      to: recipients, // Resend accepts an array of strings
      subject: type === 'DISPATCH' ? `🚚 Dispatch: ${batchId}` : `✅ Delivered: ${batchId}`,
      html: htmlContent,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}