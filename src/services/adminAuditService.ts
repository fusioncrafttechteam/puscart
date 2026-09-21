/**
 * Admin Audit Service
 * Logs all admin actions for security and compliance
 */

import { supabase } from './supabase'
import { logger } from './loggingService'

export interface AdminAuditLog {
  id?: string
  admin_id: string
  admin_name: string
  action: string
  entity_type: 'product' | 'category' | 'order' | 'user' | 'banner' | 'settings' | 'other'
  entity_id?: string
  entity_name?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at?: string
}

class AdminAuditService {
  /**
   * Log an admin action
   */
  async logAction(auditLog: Omit<AdminAuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      // Log to local logger first
      logger.logAdminAction(auditLog.action, {
        entity_type: auditLog.entity_type,
        entity_id: auditLog.entity_id,
        entity_name: auditLog.entity_name,
        details: auditLog.details
      })

      // Store in database for permanent record
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          ...auditLog,
          created_at: new Date().toISOString()
        })

      if (error) {
        // Log error but don't throw - admin actions should not block
        logger.error('Failed to log admin action to database', { error, auditLog })
      }
    } catch (error) {
      logger.error('Error in admin audit logging', { error, auditLog })
    }
  }

  /**
   * Log product creation/update
   */
  async logProductAction(
    adminId: string,
    adminName: string,
    action: 'created' | 'updated' | 'deleted',
    productId: string,
    productName: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      admin_id: adminId,
      admin_name: adminName,
      action: `product_${action}`,
      entity_type: 'product',
      entity_id: productId,
      entity_name: productName,
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    })
  }

  /**
   * Log category creation/update
   */
  async logCategoryAction(
    adminId: string,
    adminName: string,
    action: 'created' | 'updated' | 'deleted',
    categoryId: string,
    categoryName: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      admin_id: adminId,
      admin_name: adminName,
      action: `category_${action}`,
      entity_type: 'category',
      entity_id: categoryId,
      entity_name: categoryName,
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    })
  }

  /**
   * Log order status change
   */
  async logOrderAction(
    adminId: string,
    adminName: string,
    action: string,
    orderId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      admin_id: adminId,
      admin_name: adminName,
      action: `order_${action}`,
      entity_type: 'order',
      entity_id: orderId,
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    })
  }

  /**
   * Log user management action
   */
  async logUserAction(
    adminId: string,
    adminName: string,
    action: 'blocked' | 'unblocked' | 'role_changed' | 'deleted',
    userId: string,
    userName: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      admin_id: adminId,
      admin_name: adminName,
      action: `user_${action}`,
      entity_type: 'user',
      entity_id: userId,
      entity_name: userName,
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    })
  }

  /**
   * Log banner creation/update
   */
  async logBannerAction(
    adminId: string,
    adminName: string,
    action: 'created' | 'updated' | 'deleted',
    bannerId: string,
    bannerTitle: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      admin_id: adminId,
      admin_name: adminName,
      action: `banner_${action}`,
      entity_type: 'banner',
      entity_id: bannerId,
      entity_name: bannerTitle,
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    })
  }

  /**
   * Log settings change
   */
  async logSettingsAction(
    adminId: string,
    adminName: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      admin_id: adminId,
      admin_name: adminName,
      action: `settings_${action}`,
      entity_type: 'settings',
      details: details || {},
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    })
  }

  /**
   * Get client IP address (placeholder - actual IP requires backend)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you would get this from the backend
      // For now, return a placeholder
      return 'client-ip-placeholder'
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Get audit logs for a specific admin
   */
  async getAdminLogs(adminId: string, limit: number = 50): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Failed to fetch admin audit logs', { error, adminId })
      return []
    }
  }

  /**
   * Get all audit logs (super-admin only)
   */
  async getAllLogs(limit: number = 100, offset: number = 0): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Failed to fetch all audit logs', { error })
      return []
    }
  }
}

// Export singleton instance
export const adminAuditService = new AdminAuditService()
