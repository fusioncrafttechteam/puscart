import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import {
  User,
  Mail,
  Phone,
  Camera,
  MapPin,
  Package,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
  Bell,
  Key,
  Edit3,
  Plus
} from 'lucide-react'

const Profile: React.FC = () => {
  const { appUser, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [ordersCount, setOrdersCount] = useState(0)
  const [addresses, setAddresses] = useState<any[]>([])
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      setMessage('Error logging out')
      setMessageType('error')
    }
  }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profile_image: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (appUser) {
      setFormData({
        name: appUser.name || '',
        email: appUser.email || '',
        phone: appUser.phone || '',
        profile_image: appUser.profile_image || ''
      })
      fetchOrdersCount()
      fetchAddresses()
    }
  }, [appUser])

  const fetchOrdersCount = async () => {
    if (!user) return
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setOrdersCount(count || 0)
    } catch (error) {
      console.error('Error fetching orders count:', error)
    }
  }

  const fetchAddresses = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!user) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      setFormData({ ...formData, profile_image: publicUrl })
      setMessage('Profile image uploaded successfully')
      setMessageType('success')
    } catch (error) {
      setMessage('Error uploading image')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          profile_image: formData.profile_image
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('Profile updated successfully')
      setMessageType('success')
    } catch (error) {
      setMessage('Error updating profile')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setMessage('Password updated successfully')
      setMessageType('success')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)
    } catch (error) {
      setMessage('Error updating password')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  if (!appUser) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Message Alert */}
        {message && (
          <div className={`px-4 py-3 rounded-2xl ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              {formData.profile_image ? (
                <img
                  src={formData.profile_image}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              )}
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{formData.name || 'Your Name'}</h2>
            <div className="flex items-center text-gray-600 mb-1">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">{formData.email || 'email@example.com'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span className="text-sm">{formData.phone || '+1234567890'}</span>
            </div>
            
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
            </div>
          </div>
          
          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700">{address.address_line1}</p>
                  {address.address_line2 && (
                    <p className="text-sm text-gray-600">{address.address_line2}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No address saved</p>
            </div>
          )}
          
          <div className="flex space-x-3 mt-4">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </button>
            {addresses.length > 0 && (
              <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors">
                Edit Address
              </button>
            )}
          </div>
        </div>

        {/* Total Orders Section */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Total Orders</h3>
              <p className="text-3xl font-bold">{ordersCount}</p>
              <p className="text-blue-100 text-sm">Orders placed</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
          <Link 
            to="/orders" 
            className="mt-4 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-medium transition-colors inline-block text-center w-full"
          >
            View Order History
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/orders')}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col items-center space-y-2 hover:scale-105"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Orders</span>
          </button>
          
          <button className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col items-center space-y-2 hover:scale-105">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Addresses</span>
          </button>
          
          <button className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col items-center space-y-2 hover:scale-105">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Payments</span>
          </button>
          
          <button className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col items-center space-y-2 hover:scale-105">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Settings</span>
          </button>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Key className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-gray-900 font-medium">Change Password</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="border-t border-gray-100"></div>
          
          <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-gray-900 font-medium">Notification Preferences</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="border-t border-gray-100"></div>
          
         
        </div>

        {/* Mobile Logout Button - Always visible on mobile */}
        <div className="md:hidden bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4 mt-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>

        {/* Password Change Modal */}
        {showPasswordForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-field"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Photo
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center text-blue-600 hover:text-blue-500 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                      <Camera className="w-5 h-5 mr-2" />
                      <span className="text-sm">Upload Photo</span>
                    </div>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfileModal(false)
                      setFormData({
                        name: appUser.name || '',
                        email: appUser.email || '',
                        phone: appUser.phone || '',
                        profile_image: appUser.profile_image || ''
                      })
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
