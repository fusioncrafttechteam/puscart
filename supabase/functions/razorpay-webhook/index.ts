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

  // Only allow POST requests for webhooks
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase client with service role key for backend operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook signature from headers
    const webhookSignature = req.headers.get('x-razorpay-signature')
    if (!webhookSignature) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Webhook configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read request body
    const body = await req.text()
    
    // Verify webhook signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body)
    )

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Compare signatures (webhook signature format: sha256=<hex>)
    const razorpaySignature = webhookSignature.replace('sha256=', '')
    
    if (expectedSignature !== razorpaySignature) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse webhook payload
    const webhookData = JSON.parse(body)
    const { event, payload } = webhookData

    // Process different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(supabaseClient, payload)
        break
      case 'payment.failed':
        await handlePaymentFailed(supabaseClient, payload)
        break
      case 'refund.processed':
        await handleRefundProcessed(supabaseClient, payload)
        break
      default:
        // Log unhandled webhook events for monitoring
        console.error('Unhandled webhook event:', { event, timestamp: new Date().toISOString() })
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', {
      message: error instanceof Error ? error.message.substring(0, 100) : 'Unknown error',
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(supabaseClient: any, payload: any) {
  const { payment } = payload
  const { id: paymentId, order_id: razorpayOrderId, amount, currency, status } = payment

  try {
    // Update payment record to paid
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        status: 'paid',
        razorpay_payment_id: paymentId,
        metadata: {
          ...payment.metadata,
          webhook_processed_at: new Date().toISOString(),
          razorpay_status: status
        }
      })
      .eq('razorpay_order_id', razorpayOrderId)

    if (paymentError) {
      console.error('Failed to update payment:', paymentError)
      return
    }

    // Get payment record to find user
    const { data: paymentRecord, error: fetchError } = await supabaseClient
      .from('payments')
      .select('user_id, id')
      .eq('razorpay_order_id', razorpayOrderId)
      .single()

    if (fetchError || !paymentRecord) {
      console.error('Failed to fetch payment record:', fetchError)
      return
    }

    // Create order if not exists
    const { data: existingOrder, error: orderCheckError } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('razorpay_payment_id', paymentId)
      .single()

    if (!orderCheckError && existingOrder) {
      // Order already exists, no action needed
      return
    }

    // Note: Order creation from webhook is optional since checkout flow handles it
    // This is mainly for backup/recovery scenarios

    // Payment captured webhook processed successfully
    // No need to log success for production

  } catch (error) {
    console.error('Error in handlePaymentCaptured:', error)
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(supabaseClient: any, payload: any) {
  const { payment } = payload
  const { id: paymentId, order_id: razorpayOrderId, error, error_description } = payment

  try {
    // Update payment record to failed
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: `${error}: ${error_description}`,
        metadata: {
          webhook_processed_at: new Date().toISOString(),
          razorpay_error: error,
          razorpay_error_description: error_description
        }
      })
      .eq('razorpay_order_id', razorpayOrderId)

    if (updateError) {
      console.error('Failed to update failed payment:', updateError)
      return
    }

    // Payment failed webhook processed successfully
    // No need to log success for production

  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}

/**
 * Handle refund.processed event
 */
async function handleRefundProcessed(supabaseClient: any, payload: any) {
  const { refund } = payload
  const { payment_id: paymentId, amount, status } = refund

  try {
    // Find payment record
    const { data: paymentRecord, error: fetchError } = await supabaseClient
      .from('payments')
      .select('id, status')
      .eq('razorpay_payment_id', paymentId)
      .single()

    if (fetchError || !paymentRecord) {
      console.error('Payment record not found for refund:', paymentId)
      return
    }

    // Update payment status to refunded
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: 'refunded',
        metadata: {
          refund_processed_at: new Date().toISOString(),
          refund_amount: amount,
          refund_status: status
        }
      })
      .eq('razorpay_payment_id', paymentId)

    if (updateError) {
      console.error('Failed to update refunded payment:', updateError)
      return
    }

    // Update corresponding order status
    const { error: orderError } = await supabaseClient
      .from('orders')
      .update({
        payment_status: 'refunded'
      })
      .eq('razorpay_payment_id', paymentId)

    if (orderError) {
      console.error('Failed to update order refund status:', orderError)
      return
    }

    // Refund processed webhook handled successfully
    // No need to log success for production

  } catch (error) {
    console.error('Error in handleRefundProcessed:', error)
  }
}
