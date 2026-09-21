import { supabase } from './supabase'

export interface DeliverySettings {
  id: string
  free_delivery_limit: number
  delivery_fee: number
  enable_delivery_charge: boolean
  free_delivery_message: string
  created_at: string
  updated_at: string
}

export const getDeliverySettings = async (): Promise<DeliverySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching delivery settings:', error)
    // Return default settings if table doesn't exist or error occurs
    return {
      id: 'default',
      free_delivery_limit: 500,
      delivery_fee: 40,
      enable_delivery_charge: true,
      free_delivery_message: 'Free delivery above ₹500',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

export const updateDeliverySettings = async (settings: Partial<DeliverySettings>): Promise<DeliverySettings | null> => {
  try {
    // First get the current settings to get the ID
    const { data: currentSettings } = await supabase
      .from('delivery_settings')
      .select('id')
      .single()

    if (!currentSettings) {
      throw new Error('No delivery settings found')
    }

    const { data, error } = await supabase
      .from('delivery_settings')
      .update({
        free_delivery_limit: settings.free_delivery_limit,
        delivery_fee: settings.delivery_fee,
        enable_delivery_charge: settings.enable_delivery_charge,
        free_delivery_message: settings.free_delivery_message,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSettings.id)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating delivery settings:', error)
    throw error
  }
}

export const calculateDeliveryFee = (subtotal: number, settings: DeliverySettings | null): number => {
  if (!settings || !settings.enable_delivery_charge) {
    return 0
  }

  return subtotal >= settings.free_delivery_limit ? 0 : settings.delivery_fee
}
