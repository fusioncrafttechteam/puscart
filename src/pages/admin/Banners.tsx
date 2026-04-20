import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import AdminSidebar from '../../components/AdminSidebar'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface OfferBanner {
  id: string
  title: string
  description: string
  image: string
  is_active: boolean
  start_date: string
  end_date: string
  created_at: string
}

const AdminBanners: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [banners, setBanners] = useState<OfferBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<OfferBanner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    is_active: true,
    start_date: '',
    end_date: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)


  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_banners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let imageUrl = formData.image

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
      }

      const bannerData = {
        title: formData.title,
        description: formData.description,
        image: imageUrl,
        is_active: formData.is_active,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      }

      if (editingBanner) {
        const { error } = await supabase
          .from('offer_banners')
          .update(bannerData)
          .eq('id', editingBanner.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('offer_banners')
          .insert(bannerData)

        if (error) throw error
      }

      await fetchBanners()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving banner:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (banner: OfferBanner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description,
      image: banner.image,
      is_active: banner.is_active,
      start_date: new Date(banner.start_date).toISOString().split('T')[0],
      end_date: new Date(banner.end_date).toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const { error } = await supabase
        .from('offer_banners')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const toggleBannerStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('offer_banners')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      await fetchBanners()
    } catch (error) {
      console.error('Error updating banner status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      is_active: true,
      start_date: '',
      end_date: ''
    })
    setEditingBanner(null)
    setImageFile(null)
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  const isBannerActive = (banner: OfferBanner) => {
    const now = new Date()
    const startDate = new Date(banner.start_date)
    const endDate = new Date(banner.end_date)
    return banner.is_active && now >= startDate && now <= endDate
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex pt-14 md:pt-20 overflow-x-hidden">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main content */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Page title */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Offer Banners</h1>
              </div>

              {/* Add Banner button */}
              <button
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Banner
              </button>
            </div>
          </div>
        </div>
        
        {/* Banners content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Banners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {isBannerActive(banner) && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    banner.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {banner.is_active ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{banner.description}</p>
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <p>Start: {new Date(banner.start_date).toLocaleDateString()}</p>
                  <p>End: {new Date(banner.end_date).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                    className={`text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      banner.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {banner.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No banners</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new banner.</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-18">
              <div 
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
                aria-hidden="true"
                onClick={() => setShowModal(false)}
              />

              <div 
                className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full lg:max-w-3xl relative z-10 mx-4 sm:mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-6 pt-6 pb-4 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Basic Information Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Title</label>
                            <input
                              type="text"
                              required
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter banner title"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                        </div>
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter banner description"
                          />
                        </div>
                      </div>

                      {/* Schedule Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                              type="date"
                              required
                              value={formData.start_date}
                              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                              type="date"
                              required
                              value={formData.end_date}
                              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Current Image Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Image</h4>
                        {formData.image && (
                          <div>
                            <img
                              src={formData.image}
                              alt="Banner preview"
                              className="h-32 w-32 rounded-xl object-cover shadow-md"
                            />
                          </div>
                        )}
                        {!formData.image && (
                          <div className="text-sm text-gray-500">
                            No image uploaded yet
                          </div>
                        )}
                      </div>

                      {/* Status Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Status</h4>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-xl"
                          />
                          <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-900">
                            Banner is active and visible to customers
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse sm:space-x-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>{editingBanner ? 'Update Banner' : 'Create Banner'}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

    </div>
  )
}

export default AdminBanners
