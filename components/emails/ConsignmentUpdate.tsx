import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Text, 
  Button,
  Hr,
  Img,
  Preview 
} from '@react-email/components';

interface ConsignmentUpdateProps {
  trackingId: string;
  currentStatus: string;
  driverName: string;
}

export default function ConsignmentUpdate({
  trackingId = "TRK-0000",
  currentStatus = "Processing",
  driverName = "Assigned Personnel"
}: ConsignmentUpdateProps) {

  const cyanAccent = '#00bcd4';

  return (
    <Html>
      <Head />
      <Preview>SeireiYoki Update: {trackingId} is now {currentStatus}</Preview>
      <Body style={{ backgroundColor: '#050505', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <Container style={{ margin: '40px auto', padding: '20px', width: '560px', borderRadius: '12px', border: '1px solid #1a202c', backgroundColor: '#080808' }}>
          
          <Section style={{ textAlign: 'center' as const }}>
            <Img src="https://www.seirei.com.ng/seireiyoki-stamp.svg" width="60" height="60" style={{ margin: '0 auto' }} alt="Seirei Yoki" />
            <Text style={{ fontSize: '12px', fontWeight: 'bold', color: cyanAccent, letterSpacing: '2px', textTransform: 'uppercase' as const, marginTop: '10px' }}>
              Forensic Ledger Update
            </Text>
          </Section>

          <Hr style={{ borderColor: '#1a202c', margin: '20px 0' }} />

          <Section>
            <Text style={{ fontSize: '16px', color: '#cbd5e0' }}>Dear Buyer,</Text>
            <Text style={{ fontSize: '16px', color: '#cbd5e0' }}>The digital chain of custody has been updated.</Text>

            <Section style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '8px', border: '1px solid #111', margin: '20px 0' }}>
              <Text style={{ margin: '0', color: '#718096', fontSize: '11px' }}>ID: {trackingId}</Text>
              <Text style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold', color: cyanAccent }}>{currentStatus}</Text>
              <Text style={{ margin: '0', color: '#ffffff', fontSize: '14px' }}>Driver: {driverName}</Text>
            </Section>

            <Section style={{ textAlign: 'center' as const, marginTop: '30px' }}>
              <Button href={`https://www.seirei.com.ng/track/${trackingId}`} style={{ backgroundColor: cyanAccent, color: '#000', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
                VIEW LEDGER
              </Button>
            </Section>
          </Section>
          
        </Container>
      </Body>
    </Html>
  );
}