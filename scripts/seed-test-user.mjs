/**
 * Crea utente di test: Markus123 / Demo123! / Ragusa
 * Esegui: node --env-file=.env.local scripts/seed-test-user.mjs
 * Richiede SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Manca NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const { data, error } = await supabase.auth.admin.createUser({
  email: "markus123@example.com",
  password: "Demo123!",
  email_confirm: true,
  user_metadata: {
    nickname: "Markus123",
    role: "player",
    province: "RG",
  },
});

if (error) {
  console.error("Errore:", error.message);
  if (error.message?.includes("already been registered")) {
    console.log("L'utente esiste già. Usa: markus123@example.com / Demo123!");
  }
  process.exit(1);
}

console.log("Utente creato:", data.user?.email);
console.log("Login: markus123@example.com");
console.log("Password: Demo123!");
console.log("Nickname: Markus123");
console.log("Provincia: Ragusa (RG)");
