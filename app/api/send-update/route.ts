import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import ConsignmentUpdate from '@/components/emails/ConsignmentUpdate';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyerEmail, status, consignmentId, partnerName } = body;

    // 1. Validate Fields
    if (!buyerEmail || !status || !consignmentId || !partnerName) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // 2. Send via Resend
    // We use the 'react' property directly instead of 'render'
    const { data, error } = await resend.emails.send({
      from: 'SeireiYoki Forensic <updates@seirei.com.ng>', 
      to: buyerEmail,
      subject: `Consignment Update: ${consignmentId}`,
      react: ConsignmentUpdate({
        trackingId: consignmentId,
        currentStatus: status,
        driverName: partnerName,
      }),
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Forensic update dispatched.',
      id: data?.id 
    });

  } catch (error: any) {
    // 3. Specific Error Handling for Spam/Invalid Emails
    if (error.name === 'Invalid Email' || error.message?.includes('email_address')) {
        return NextResponse.json({ error: 'Invalid Email Address' }, { status: 400 });
    }
    
    console.error('Fatal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}