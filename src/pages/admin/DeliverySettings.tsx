import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { AdminPageSkeleton } from '../../components/admin/AdminSkeletons'
import {
  CogIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface DeliverySettings {
  id: string
  free_delivery_limit: number
  delivery_fee: number
  enable_delivery_charge: boolean
  free_delivery_message: string
  created_at: string
  updated_at: string
}

const DeliverySettings: React.FC = () => {
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error fetching delivery settings:', error)
      setErrorMessage('Failed to load delivery settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const { error } = await supabase
        .from('delivery_settings')
        .update({
          free_delivery_limit: settings.free_delivery_limit,
          delivery_fee: settings.delivery_fee,
          enable_delivery_charge: settings.enable_delivery_charge,
          free_delivery_message: settings.free_delivery_message,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error

      setSuccessMessage('Delivery settings updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating delivery settings:', error)
      setErrorMessage('Failed to update delivery settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CogIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
                <p className="mt-1 text-sm text-gray-600">Configure delivery fees and free delivery thresholds</p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <XMarkIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{errorMessage}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 sm:p-8">
              {settings && (
                <div className="space-y-6">
                  {/* Enable/Disable Delivery Charge */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Enable Delivery Charge</h3>
                      <p className="text-sm text-gray-600 mt-1">Turn on to apply delivery fees to orders</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, enable_delivery_charge: !settings.enable_delivery_charge })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.enable_delivery_charge ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.enable_delivery_charge ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Free Delivery Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Delivery Above (₹)
                    </label>
                    <input
                      type="number"
                      value={settings.free_delivery_limit}
                      onChange={(e) => setSettings({ ...settings, free_delivery_limit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Orders above this amount will get free delivery</p>
                  </div>

                  {/* Delivery Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={settings.delivery_fee}
                      onChange={(e) => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Delivery fee for orders below the free delivery limit</p>
                  </div>

                  {/* Free Delivery Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Delivery Message
                    </label>
                    <input
                      type="text"
                      value={settings.free_delivery_message}
                      onChange={(e) => setSettings({ ...settings, free_delivery_message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Free delivery above ₹500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Message displayed to users when they qualify for free delivery</p>
                  </div>

                  {/* Preview Section */}
                  <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Free delivery above:</span>
                        <span className="font-medium text-gray-900">₹{settings.free_delivery_limit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery fee:</span>
                        <span className="font-medium text-gray-900">₹{settings.delivery_fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery charge enabled:</span>
                        <span className={`font-medium ${settings.enable_delivery_charge ? 'text-green-600' : 'text-red-600'}`}>
                          {settings.enable_delivery_charge ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">{settings.free_delivery_message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={fetchSettings}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated Info */}
          {settings && (
            <div className="mt-4 text-xs text-gray-500">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </div>
          )}
        </div>
    </div>
  )
}

export default DeliverySettings
