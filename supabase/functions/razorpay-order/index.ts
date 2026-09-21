import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NODE_ENV') === 'development' ? 'http://localhost:5173' : 'https://your-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  try {
    // Environment variables
    const SUPABASE_URL =
      Deno.env.get('SUPABASE_URL') ?? ''

    const SUPABASE_SERVICE_ROLE_KEY =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY'
      ) ?? ''

    const RAZORPAY_KEY_ID =
      Deno.env.get(
        'RAZORPAY_KEY_ID'
      ) ?? ''

    const RAZORPAY_KEY_SECRET =
      Deno.env.get(
        'RAZORPAY_KEY_SECRET'
      ) ?? ''

    // Validate env variables
    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !RAZORPAY_KEY_ID ||
      !RAZORPAY_KEY_SECRET
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Missing environment variables',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Get auth header
    const authHeader =
      req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error:
            'Missing authorization header',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    const token =
      authHeader.replace(
        'Bearer ',
        ''
      )

    // Validate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(
      token
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized user',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    // Parse body
    const body = await req.json()

    const {
      amount,
      currency = 'INR',
    } = body

    // Validate amount properly
    if (
      !amount ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0 ||
      Number(amount) > 100000 // Max amount limit: ₹1,00,000
    ) {
      return new Response(
        JSON.stringify({
          error: 'Invalid amount. Amount must be between ₹1 and ₹1,00,000',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    // Round amount to 2 decimal places and convert to paise
    const amountInRupees = Math.round(Number(amount) * 100) / 100
    const amountInPaise = Math.round(amountInRupees * 100)

    // IMPORTANT: Razorpay receipt max length = 40
    const safeReceipt = `rcpt_${Date.now()}`

    // Create order payload with security notes
    const razorpayOrder = {
      amount: amountInPaise,
      currency,
      receipt: safeReceipt,
      notes: {
        user_id: user.id,
        email: user.email?.substring(0, 50) || '', // Limit email length
        created_at: new Date().toISOString(),
        source: 'web_app'
      },
    }

    // Create Basic Auth
    const basicAuth =
      'Basic ' +
      btoa(
        `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
      )

    // Razorpay API request
    const razorpayResponse =
      await fetch(
        'https://api.razorpay.com/v1/orders',
        {
          method: 'POST',
          headers: {
            Authorization: basicAuth,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            razorpayOrder
          ),
        }
      )

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText.substring(0, 500) } // Limit error text length
      }
      
      // Log sanitized error without sensitive data
      console.error('Razorpay API error:', {
        status: razorpayResponse.status,
        error: errorData.error?.substring(0, 100) || 'Unknown error'
      })
      
      return new Response(
        JSON.stringify({
          error:
            'Razorpay API failed',
          details: errorData,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    const responseData = await razorpayResponse.json()

    // Success response
    return new Response(
      JSON.stringify({
        order_id: responseData.id,
        amount:
          responseData.amount,
        currency:
          responseData.currency,
        key_id:
          RAZORPAY_KEY_ID,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    )
  } catch (error) {
    // Log sanitized error without sensitive data
    console.error('EDGE FUNCTION ERROR:', {
      message: error instanceof Error ? error.message.substring(0, 100) : 'Unknown error',
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        error:
          'Internal server error',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    )
  }
})