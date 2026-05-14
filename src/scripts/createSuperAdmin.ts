import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// ─── Supabase client directo (sin pasar por env.ts para evitar dependencias) ──
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Datos del superadmin ─────────────────────────────────────────────────────
const SUPERADMIN = {
  nombre: 'Cesar',
  apellido: 'Moreno',
  email: 'cesar@demo.com',
  username: 'superadmin',
  password: '123456',
};

async function main() {
  console.log('🚀 Creando superadmin...\n');

  // 0. Diagnóstico de conexión
  console.log(`🔗 Conectando a: ${SUPABASE_URL}`);
  console.log(`🔑 Key (primeros 20 chars): ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

  // 1. Obtener el rol superadmin
  const { data: rol, error: rolError } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', 'superadmin')
    .single();

  if (rolError || !rol) {
    console.error('❌ No se encontró el rol "superadmin".');
    if (rolError) {
      console.error('   Error de Supabase:', rolError.message);
      console.error('   Código:', rolError.code);
      console.error('   Detalle:', rolError.details);
      console.error('   Hint:', rolError.hint);
    }
    console.error('\n   Posibles causas:');
    console.error('   1. La tabla "roles" no tiene datos — ejecuta el SQL de la Parte 5 del README');
    console.error('   2. RLS activo — desactívalo en Supabase: Authentication > Policies > roles > Disable RLS');
    console.error('   3. La SUPABASE_SERVICE_ROLE_KEY es incorrecta');
    process.exit(1);
  }

  // 2. Verificar si el usuario ya existe
  const { data: existente } = await supabase
    .from('usuarios')
    .select('id, username')
    .eq('username', SUPERADMIN.username)
    .single();

  if (existente) {
    console.log(`⚠️  El usuario "${SUPERADMIN.username}" ya existe (id: ${existente.id}). No se creó de nuevo.`);
    process.exit(0);
  }

  // 3. Hashear la contraseña
  const password_hash = await bcrypt.hash(SUPERADMIN.password, 10);

  // 4. Insertar el superadmin
  const { data: usuario, error: insertError } = await supabase
    .from('usuarios')
    .insert({
      nombre: SUPERADMIN.nombre,
      apellido: SUPERADMIN.apellido,
      email: SUPERADMIN.email,
      username: SUPERADMIN.username,
      password_hash,
      rol_id: rol.id,
      pais_id: null,
      estado: 'activo',
    })
    .select('id, nombre, apellido, email, username')
    .single();

  if (insertError) {
    console.error('❌ Error al crear el superadmin:', insertError.message);
    process.exit(1);
  }

  console.log('✅ Superadmin creado exitosamente:\n');
  console.log(`   Nombre:   ${usuario.nombre} ${usuario.apellido}`);
  console.log(`   Email:    ${usuario.email}`);
  console.log(`   Username: ${usuario.username}`);
  console.log(`   Password: ${SUPERADMIN.password}`);
  console.log(`   ID:       ${usuario.id}`);
  console.log('\n🔑 Ya puedes hacer login en POST /api/auth/login');
}

main().catch((err) => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
