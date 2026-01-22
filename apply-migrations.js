/**
 * Script para aplicar migraciones de Supabase usando la API REST
 * Ejecuta los archivos SQL de la carpeta supabase/migrations
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://ixcyuyooxwxcoawsghgr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Y3l1eW9veHd4Y29hd3NnaGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkzMDM1MywiZXhwIjoyMDg0NTA2MzUzfQ.MBzN1gXGyiuDcA5NC-xwTNg8AKR8YcVxhdMLSXyCEtU';

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'ixcyuyooxwxcoawsghgr.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Ejecución exitosa');
          resolve(body);
        } else {
          console.error('❌ Error:', res.statusCode, body);
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  console.log('📂 Leyendo migraciones de:', migrationsDir);
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ No existe la carpeta de migraciones');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`📋 Encontradas ${files.length} migraciones:\n`);

  for (const file of files) {
    console.log(`\n📄 Aplicando: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('📤 Ejecutando SQL...');
    
    // Dividir en statements individuales y ejecutar uno por uno
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   Statement ${i + 1}/${statements.length}`);
      
      try {
        // Usar pg_stat_statements o simplemente ejecutar directo
        // Como no tenemos RPC customizado, vamos a usar el editor SQL
        console.log('   ⚠️  Necesitas ejecutar esto manualmente en el SQL Editor de Supabase');
      } catch (error) {
        console.error(`   ❌ Error en statement ${i + 1}:`, error.message);
      }
    }
  }

  console.log('\n\n⚠️  IMPORTANTE: Las migraciones deben aplicarse manualmente');
  console.log('===============================================================');
  console.log('');
  console.log('Instrucciones paso a paso:');
  console.log('');
  console.log('1. Ve a tu proyecto de Supabase: https://app.supabase.com');
  console.log('2. Selecciona tu proyecto: ixcyuyooxwxcoawsghgr');
  console.log('3. Ve a "SQL Editor" en el menú lateral');
  console.log('4. Haz clic en "New query"');
  console.log('5. Copia y pega el contenido de cada archivo:');
  console.log('');
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. supabase/migrations/${file}`);
  });
  console.log('');
  console.log('6. Ejecuta cada uno haciendo clic en "Run"');
  console.log('7. Verifica que no haya errores en la consola');
  console.log('');
  console.log('Contenido de las migraciones:');
  console.log('===============================================================\n');
  
  files.forEach(file => {
    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 ARCHIVO: ${file}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(content);
  });
}

applyMigrations().catch(console.error);
