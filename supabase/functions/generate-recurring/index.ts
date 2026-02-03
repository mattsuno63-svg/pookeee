import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Chiama la funzione SQL per generare tornei ricorrenti
    const { error } = await supabase.rpc('generate_recurring_tournaments')
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Recurring tournaments generated successfully',
        timestamp: new Date().toISOString()
      }), 
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      {
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})
