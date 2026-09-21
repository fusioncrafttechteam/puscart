/**
 * Notification Service
 * Modular notification system for email and SMS
 */

import { logger } from './loggingService'

export interface NotificationConfig {
  enabled: boolean
  email?: {
    enabled: boolean
    provider: 'emailjs' | 'custom'
    apiKey?: string
    serviceId?: string
    templateId?: string
  }
  sms?: {
    enabled: boolean
    provider: 'twilio' | 'custom'
    accountSid?: string
    authToken?: string
    fromNumber?: string
  }
}

export interface EmailNotification {
  to: string
  subject: string
  template: string
  templateParams?: Record<string, any>
}

export interface SMSNotification {
  to: string
  message: string
}

export interface NotificationResult {
  success: boolean
  error?: string
}

class NotificationService {
  private config: NotificationConfig = {
    enabled: true,
    email: {
      enabled: true,
      provider: 'emailjs'
    },
    sms: {
      enabled: false,
      provider: 'custom'
    }
  }

  /**
   * Initialize notification service with config
   */
  initialize(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info('Notification service initialized', { config: this.config })
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    if (!this.config.enabled || !this.config.email?.enabled) {
      logger.warning('Email notifications are disabled')
      return { success: false, error: 'Email notifications are disabled' }
    }

    try {
      if (this.config.email.provider === 'emailjs') {
        return await this.sendEmailViaEmailJS(notification)
      } else {
        return await this.sendEmailViaCustom(notification)
      }
    } catch (error) {
      logger.error('Failed to send email notification', { error, notification })
      return { success: false, error: String(error) }
    }
  }

  /**
   * Send email via EmailJS
   */
  private async sendEmailViaEmailJS(notification: EmailNotification): Promise<NotificationResult> {
    try {
      const emailjs = await import('@emailjs/browser')
      
      const serviceId = this.config.email?.serviceId || import.meta.env.VITE_EMAILJS_SERVICE_ID
      const templateId = this.config.email?.templateId || import.meta.env.VITE_EMAILJS_TEMPLATE_ID
      const publicKey = this.config.email?.apiKey || import.meta.env.VITE_EMAILJS_PUBLIC_KEY

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS configuration missing')
      }

      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: notification.to,
          subject: notification.subject,
          ...notification.templateParams
        },
        publicKey
      )

      logger.info('Email sent successfully via EmailJS', { to: notification.to })
      return { success: true }
    } catch (error) {
      logger.error('EmailJS send failed', { error })
      return { success: false, error: String(error) }
    }
  }

  /**
   * Send email via custom provider
   */
  private async sendEmailViaCustom(notification: EmailNotification): Promise<NotificationResult> {
    // Placeholder for custom email implementation
    logger.info('Custom email provider not implemented', { notification })
    return { success: false, error: 'Custom email provider not implemented' }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification: SMSNotification): Promise<NotificationResult> {
    if (!this.config.enabled || !this.config.sms?.enabled) {
      logger.warning('SMS notifications are disabled')
      return { success: false, error: 'SMS notifications are disabled' }
    }

    try {
      if (this.config.sms.provider === 'twilio') {
        return await this.sendSMSViaTwilio(notification)
      } else {
        return await this.sendSMSViaCustom(notification)
      }
    } catch (error) {
      logger.error('Failed to send SMS notification', { error, notification })
      return { success: false, error: String(error) }
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMSViaTwilio(notification: SMSNotification): Promise<NotificationResult> {
    // Placeholder for Twilio implementation
    logger.info('Twilio SMS provider not implemented', { notification })
    return { success: false, error: 'Twilio SMS provider not implemented' }
  }

  /**
   * Send SMS via custom provider
   */
  private async sendSMSViaCustom(notification: SMSNotification): Promise<NotificationResult> {
    // Placeholder for custom SMS implementation
    logger.info('Custom SMS provider not implemented', { notification })
    return { success: false, error: 'Custom SMS provider not implemented' }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    to: string,
    orderId: string,
    orderDetails: Record<string, any>
  ): Promise<NotificationResult> {
    return await this.sendEmail({
      to,
      subject: `Order Confirmation - Puscart Order #${orderId.slice(0, 8)}`,
      template: 'order_confirmation',
      templateParams: {
        orderId,
        ...orderDetails
      }
    })
  }

  /**
   * Send order status update notification
   */
  async sendOrderStatusUpdate(
    to: string,
    orderId: string,
    status: string,
    phone?: string
  ): Promise<{ email: NotificationResult; sms?: NotificationResult }> {
    const emailResult = await this.sendEmail({
      to,
      subject: `Order Status Update - Puscart Order #${orderId.slice(0, 8)}`,
      template: 'order_status_update',
      templateParams: {
        orderId,
        status
      }
    })

    let smsResult: NotificationResult | undefined
    if (phone && this.config.sms?.enabled) {
      smsResult = await this.sendSMS({
        to: phone,
        message: `Your Puscart order #${orderId.slice(0, 8)} is now ${status}.`
      })
    }

    return { email: emailResult, sms: smsResult }
  }

  /**
   * Send low stock alert to admin
   */
  async sendLowStockAlert(
    productName: string,
    currentStock: number,
    threshold: number
  ): Promise<NotificationResult> {
    // This would send to admin email
    return await this.sendEmail({
      to: 'puscartdeliveryservice@gmail.com',
      subject: `Low Stock Alert - ${productName}`,
      template: 'low_stock_alert',
      templateParams: {
        productName,
        currentStock,
        threshold
      }
    })
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info('Notification service config updated', { config: this.config })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
