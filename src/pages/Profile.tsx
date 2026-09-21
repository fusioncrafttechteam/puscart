import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AddressProvider } from '../contexts/AddressContext'
import AddressManager from '../components/address/AddressManager'
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
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react'

const ProfileContent: React.FC = () => {
  const { appUser, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [ordersCount, setOrdersCount] = useState(0)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)

  // Add CSS animation for fade-in effect on component mount
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    `
    document.head.appendChild(style)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
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
      // Error fetching orders count
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

    setPasswordLoading(true)
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
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (error) {
      setMessage('Error updating password')
      setMessageType('error')
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setMessage('')
      }, 5000)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user || !user.email) {
      setMessage('Unable to send password reset email. Please try again.')
      setMessageType('error')
      return
    }

    setResetPasswordLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setMessage('Password reset link has been sent to your registered email.')
      setMessageType('success')
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setMessage('')
      }, 5000)
    } catch (error) {
      setMessage('Unable to send password reset email. Please try again.')
      setMessageType('error')
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setMessage('')
      }, 5000)
    } finally {
      setResetPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pt-14 md:pt-20 pb-16 md:pb-20">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6">
        
        {/* Enhanced Message Alert */}
        {message && (
          <div className={`px-4 py-3 rounded-2xl backdrop-blur-sm border flex items-center space-x-2 animate-fade-in ${
            messageType === 'success' 
              ? 'bg-green-50/80 border-green-200 text-green-700' 
              : 'bg-red-50/80 border-red-200 text-red-700'
          }`}>
            {messageType === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        {/* Enhanced Profile Header Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              {formData.profile_image ? (
                <img
                  src={formData.profile_image}
                  alt="Profile"
                  loading="lazy"
                  width="80"
                  height="80"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-50 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              )}
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-4 md:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
                aria-label="Change profile photo"
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
              className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center"
              aria-label="Edit profile information"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Delivery Address Section - Clean Text Based */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors" aria-label="Edit delivery address">
              Edit
            </button>
          </div>
          
          <AddressManager 
            mode="profile" 
            compact={true}
            showAddButton={true}
          />
        </div>

        {/* Enhanced Total Orders Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Total Orders</h3>
              <p className="text-3xl font-bold">{ordersCount}</p>
              <p className="text-blue-100 text-sm">Orders placed</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-10 h-10 text-blue-200" />
            </div>
          </div>
          <Link 
            to="/orders" 
            className="mt-4 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-medium transition-all duration-200 inline-block text-center w-full transform hover:scale-[1.02] active:scale-[0.98]"
          >
            View Order History
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/orders')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col items-center space-y-2 hover:scale-105 active:scale-95"
            aria-label="View orders"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Orders</span>
          </button>
          
          <button className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col items-center space-y-2 hover:scale-105 active:scale-95" aria-label="View payments">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Payments</span>
          </button>
          
          <button className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col items-center space-y-2 hover:scale-105 active:scale-95" aria-label="View settings">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Settings</span>
          </button>
        </div>

        {/* Modern Password Change Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
            aria-label={showPasswordForm ? "Hide password change form" : "Show password change form"}
            aria-expanded={showPasswordForm}
          >
            <div className="flex items-center">
              <Key className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-gray-900 font-medium">Change Password</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showPasswordForm ? 'rotate-90' : ''}`} />
          </button>
          
          {showPasswordForm && (
            <div className="border-t border-gray-100/50 p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder=" "
                    className="peer w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  />
                  <label 
                    htmlFor="newPassword" 
                    className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-gray-600 peer-focus:text-blue-600 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent transition-all duration-200"
                  >
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder=" "
                    className="peer w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  />
                  <label 
                    htmlFor="confirmPassword" 
                    className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-gray-600 peer-focus:text-blue-600 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent transition-all duration-200"
                  >
                    Confirm New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  {passwordLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Updating Password...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Check className="w-5 h-5 mr-2" />
                      Update Password
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}
          
          <div className="border-t border-gray-100/50"></div>
          
          <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors" aria-label="View notification preferences">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-gray-600 mr-3" />
              <span className="text-gray-900 font-medium">Notification Preferences</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Security Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">••••••••</p>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                aria-label="Reset password"
              >
                {resetPasswordLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Logout Button */}
        <div className="md:hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-4 mt-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>


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
                        name: appUser?.name || '',
                        email: appUser?.email || '',
                        phone: appUser?.phone || '',
                        profile_image: appUser?.profile_image || ''
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

const Profile: React.FC = () => {
  const { appUser } = useAuth()

  if (!appUser) {
    return (
      <div className="min-h-screen bg-slate-50 pt-14 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    )
  }

  return (
    <AddressProvider userId={appUser!.id}>
      <ProfileContent />
    </AddressProvider>
  )
}

export default Profile
