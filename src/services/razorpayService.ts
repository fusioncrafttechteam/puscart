import { supabase } from './supabase'

export interface RazorpayOrderRequest {
  amount: number
  currency?: string
  receipt?: string
}

export interface RazorpayOrderResponse {
  order_id: string
  amount: number
  currency: string
  key_id: string
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface PaymentVerificationResponse {
  success: boolean
  payment_id: string
  order_id: string
  amount: number
  status: string
}

class RazorpayService {
  private isLoaded = false
  private loadPromise: Promise<void> | null = null

  /**
   * Load Razorpay SDK with timeout
   */
  private loadRazorpay(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve()
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = new Promise(
      (resolve, reject) => {
        if (window.Razorpay) {
          this.isLoaded = true
          resolve()
          return
        }

        const script =
          document.createElement('script')

        script.src =
          'https://checkout.razorpay.com/v1/checkout.js'

        script.async = true

        // Set timeout for SDK loading (15 seconds)
        const timeout = setTimeout(() => {
          reject(
            new Error(
              'Razorpay SDK loading timeout. Please check your internet connection and try again.'
            )
          )
        }, 15000)

        script.onload = () => {
          clearTimeout(timeout)
          if (window.Razorpay) {
            this.isLoaded = true
            resolve()
          } else {
            reject(
              new Error(
                'Razorpay SDK failed to initialize properly'
              )
            )
          }
        }

        script.onerror = () => {
          clearTimeout(timeout)
          reject(
            new Error(
              'Failed to load Razorpay SDK. Please check your internet connection and try again.'
            )
          )
        }

        document.body.appendChild(script)
      }
    )

    return this.loadPromise
  }

  /**
   * Create Razorpay order
   */
  async createOrder(
    request: RazorpayOrderRequest
  ): Promise<RazorpayOrderResponse> {
    try {

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error(
          'User not authenticated'
        )
      }

      // Calling Edge Function...

      const { data, error } =
        await supabase.functions.invoke(
          'razorpay-order',
          {
            body: {
              amount:
                Number(
                  request.amount
                ),
              currency:
                request.currency ||
                'INR',
              receipt: request.receipt,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        )

      if (error) {
        throw new Error(
          error.message ||
            'Failed to create payment order'
        )
      }

      if (!data?.order_id) {
        throw new Error(
          'Invalid order response'
        )
      }

      return data as RazorpayOrderResponse
    } catch (error) {
      throw error
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResponse> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error(
          'User not authenticated'
        )
      }

      const { data, error } =
        await supabase.functions.invoke(
          'razorpay-verify',
          {
            body: request,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        )

      if (error) {
        throw new Error(
          error.message ||
            'Payment verification failed'
        )
      }

      return data as PaymentVerificationResponse
    } catch (error) {
      throw error
    }
  }

  /**
   * Open Razorpay checkout
   */
  async initializePayment(
    orderData: RazorpayOrderResponse,
    options: {
      name?: string
      description?: string
      image?: string
      prefill?: {
        name?: string
        email?: string
        contact?: string
      }
      theme?: {
        color?: string
      }
      handler: (response: any) => void
      modal?: {
        ondismiss?: () => void
      }
    }
  ): Promise<void> {
    await this.loadRazorpay()

    if (!window.Razorpay) {
      throw new Error(
        'Razorpay SDK not loaded'
      )
    }

    const razorpayOptions = {
      key: orderData.key_id,

      amount: orderData.amount,

      currency: orderData.currency,

      order_id: orderData.order_id,

      name:
        options.name ||
        'Puscart',

      description:
        options.description ||
        'Order Payment',

      image:
        options.image ||
        '/Puscart logo.jpeg',

      prefill: options.prefill,

      theme: {
        color:
          options.theme?.color ||
          '#193cb8',
      },

      handler: options.handler,

      modal: {
        ondismiss:
          options.modal?.ondismiss,
      },

      notes: {
        order_id:
          orderData.order_id,
      },
    }

    // Opening Razorpay checkout

    const razorpay =
      new window.Razorpay(
        razorpayOptions
      )

    razorpay.open()
  }

  /**
   * Complete payment flow with verification
   */
  async processPayment(
    amount: number,
    orderRequest?: Partial<RazorpayOrderRequest>,
    checkoutOptions?: Parameters<
      typeof this.initializePayment
    >[1]
  ): Promise<any> {
    try {
      console.log('[Razorpay] Starting payment process for amount:', amount);

      // Step 1: Create order
      const order =
        await this.createOrder({
          amount,
          ...orderRequest,
        })

      console.log('[Razorpay] Order created:', order.order_id);

      // Step 2: Open payment popup and get payment response
      const paymentResponse = await new Promise<any>(
        (resolve, reject) => {
          this.initializePayment(order, {
            ...checkoutOptions,

            handler: async (
              response
            ) => {
              console.log('[Razorpay] Payment success callback received');
              // Validate payment response
              if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
                console.error('[Razorpay] Invalid payment response');
                reject(
                  new Error(
                    'Invalid payment response received from Razorpay'
                  )
                )
                return
              }
              console.log('[Razorpay] Payment response validated:', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id
              });
              resolve(response)
            },

            modal: {
              ondismiss: () => {
                console.log('[Razorpay] Payment dismissed by user');
                reject(
                  new Error(
                    'Payment cancelled by user'
                  )
                )
              },
            },
          }).catch(reject)
        }
      )

      console.log('[Razorpay] Starting payment verification');

      // Step 3: Verify payment with backend
      const verificationResult = await this.verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      })

      console.log('[Razorpay] Payment verification result:', verificationResult.success);

      if (!verificationResult.success) {
        throw new Error(
          'Payment verification failed. Please contact support if the amount was deducted.'
        )
      }

      console.log('[Razorpay] Payment process completed successfully');

      // Return verified payment response
      return {
        ...paymentResponse,
        verification: verificationResult,
      }
    } catch (error) {
      console.error('[Razorpay] Payment process error:', error);
      throw error
    }
  }
}

// Razorpay window type
declare global {
  interface Window {
    Razorpay: any
  }
}

export const razorpayService =
  new RazorpayService()