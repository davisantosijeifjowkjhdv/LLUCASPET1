import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('=== 1. Tabelas ===');
const tables = ['users', 'pets', 'health', 'reminders', 'groups', 'group_members', 'lost_pets', 'password_resets'];
let fail = 0;
for (const t of tables) {
  const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
  if (error) { fail++; console.log(`[FALHA] ${t}: ${error.message} (${error.code})`); }
  else console.log(`[OK] ${t}: ${count} registro(s)`);
}

console.log('\n=== 2. Auth (signup teste) ===');
const email = `teste.${Date.now()}@petlink-teste.com`;
const senha = 'Teste123!abc';
const { data: signup, error: signupErr } = await supabase.auth.signUp({ email, password: senha });
if (signupErr) { fail++; console.log('[FALHA signup]:', signupErr.message); }
else console.log('[OK signup] user id:', signup.user?.id, '| email confirmado:', !!signup.user?.email_confirmed_at);

console.log('\n=== 3. Login ===');
const { data: login, error: loginErr } = await supabase.auth.signInWithPassword({ email, password: senha });
if (loginErr) { fail++; console.log('[FALHA login]:', loginErr.message); }
else console.log('[OK login] session:', !!login.session, '| user:', login.user?.email);

console.log('\n=== 4. RLS / escrita anônima (sem sessão) ===');
const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { error: insErr } = await anon.from('pets').insert({ name: 'Teste RLS' });
console.log(insErr ? `[OK] RLS bloqueou escrita anônima: ${insErr.message} (${insErr.code})` : '[ALERTA] Escrita anônima permitida em pets!');

console.log(`\nResumo: ${fail === 0 ? 'SUCESSO' : fail + ' falha(s)'}`);
process.exit(fail > 0 ? 1 : 0);
