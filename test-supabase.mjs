const SVC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Y3l1eW9veHd4Y29hd3NnaGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkzMDM1MywiZXhwIjoyMDg0NTA2MzUzfQ.MBzN1gXGyiuDcA5NC-xwTNg8AKR8YcVxhdMLSXyCEtU';
const ANON_KEY = 'sb_publishable_Zxfhheo27JCOo_dWSyP5Mg_nydy02cE';
const URL = 'https://ixcyuyooxwxcoawsghgr.supabase.co';

async function test() {
  console.log('--- Test 1: Service Role Key ---');
  try {
    const r1 = await fetch(`${URL}/rest/v1/configuracion_sitio?select=clave&limit=2`, {
      headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` }
    });
    console.log('Status:', r1.status, r1.statusText);
    const t1 = await r1.text();
    console.log('Body:', t1.substring(0, 300));
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\n--- Test 2: Anon Key ---');
  try {
    const r2 = await fetch(`${URL}/rest/v1/configuracion_sitio?select=clave&limit=2`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    });
    console.log('Status:', r2.status, r2.statusText);
    const t2 = await r2.text();
    console.log('Body:', t2.substring(0, 300));
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\n--- Test 3: Health check ---');
  try {
    const r3 = await fetch(`${URL}/auth/v1/health`);
    console.log('Auth health:', r3.status, await r3.text());
  } catch (e) {
    console.log('Error:', e.message);
  }
}

test();
