import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Test environment variables
    const envVars = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
      RAZORPAY_KEY_ID: Deno.env.get('RAZORPAY_KEY_ID') ? 'SET' : 'MISSING',
      RAZORPAY_KEY_SECRET: Deno.env.get('RAZORPAY_KEY_SECRET') ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
    }

    return new Response(
      JSON.stringify({ 
        message: 'Environment variables test',
        envVars,
        method: req.method,
        headers: (() => {
        const headers: Record<string, string> = {}
        req.headers.forEach((value, key) => {
          headers[key] = value
        })
        return headers
      })()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
