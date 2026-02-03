# Supabase Edge Functions

## generate-recurring

Genera automaticamente tornei ricorrenti basati sugli schedule configurati.

### Setup

1. **Deploy della funzione:**
```bash
supabase functions deploy generate-recurring
```

2. **Configura Cron Job:**

Vai su Supabase Dashboard → Database → Cron Jobs e crea un nuovo job:

- **Nome:** Generate Recurring Tournaments
- **Schedule:** `0 3 * * *` (ogni giorno alle 3:00 AM)
- **SQL Command:**
```sql
SELECT
  net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-recurring',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
```

Oppure chiama direttamente la funzione SQL:
```sql
SELECT generate_recurring_tournaments();
```

3. **Test manuale:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-recurring \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Come funziona

La funzione:
1. Cerca tutti gli schedule ricorrenti attivi
2. Calcola la prossima data basata su frequenza (weekly/biweekly/monthly)
3. Crea il torneo se non esiste già
4. Aggiorna `next_occurrence` per la prossima esecuzione
