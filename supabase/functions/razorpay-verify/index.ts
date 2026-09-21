import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NODE_ENV') === 'development' ? 'http://localhost:5173' : 'https://your-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for backend operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get auth token from request header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT token and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment verification data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Razorpay credentials from environment
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify payment signature using proper HMAC SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id
    
    // Import the secret key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // Generate HMAC signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body)
    )
    
    // Convert to hex string
    const expectedSignatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Convert Razorpay signature from hex to lowercase for comparison
    const razorpaySignatureHex = razorpay_signature.toLowerCase()

    if (expectedSignatureHex !== razorpaySignatureHex) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch payment details from Razorpay
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${keySecret}`)}`,
      },
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const razorpayPaymentData = await paymentResponse.json()

    // Check if payment was successful
    if (razorpayPaymentData.status !== 'captured') {
      return new Response(
        JSON.stringify({ error: 'Payment was not successful', status: razorpayPaymentData.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create payment record if it doesn't exist
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .upsert({
        user_id: user.id,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        amount: razorpayPaymentData.amount / 100, // Convert from paise to rupees
        currency: razorpayPaymentData.currency || 'INR',
        status: 'paid',
        payment_method: 'razorpay',
        razorpay_signature: razorpay_signature,
        metadata: {
          verified_at: new Date().toISOString(),
          razorpay_status: razorpayPaymentData.status,
          email: razorpayPaymentData.email,
          contact: razorpayPaymentData.contact
        }
      }, {
        onConflict: 'razorpay_order_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to save payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: razorpayPaymentData.amount,
        status: razorpayPaymentData.status,
        payment_record_id: paymentRecord.id,
        currency: razorpayPaymentData.currency
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
