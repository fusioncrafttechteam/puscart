import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import AdminSidebar from '../../components/AdminSidebar'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  description: string
  image: string
  is_active: boolean
  display_order: number
  created_at: string
}

const AdminCategories: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    is_active: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)


  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('categories')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('categories')
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

      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
        is_active: formData.is_active,
        display_order: editingCategory ? editingCategory.display_order : categories.length
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData)

        if (error) throw error
      }

      await fetchCategories()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      image: category.image,
      is_active: category.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      is_active: true
    })
    setEditingCategory(null)
    setImageFile(null)
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedCategory) return

    const draggedIndex = categories.findIndex(cat => cat.id === draggedCategory.id)
    if (draggedIndex === dropIndex) return

    // Reorder categories
    const newCategories = [...categories]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(dropIndex, 0, draggedCategory)

    // Update display_order for all categories
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      display_order: index
    }))

    setCategories(updatedCategories)

    // Update database
    try {
      const { error } = await supabase
        .from('categories')
        .upsert(
          updatedCategories.map(cat => ({
            id: cat.id,
            display_order: cat.display_order
          })),
          { onConflict: 'id' }
        )

      if (error) throw error
    } catch (error) {
      console.error('Error updating category order:', error)
      // Revert to original order on error
      setCategories(categories)
    }

    setDraggedCategory(null)
  }

  const handleDragEnd = () => {
    setDraggedCategory(null)
    setDragOverIndex(null)
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
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              </div>

              {/* Add Category button */}
              <button
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>
        </div>
        
        {/* Categories content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Categories Grid */}
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Drag and drop categories to reorder them. The order will be reflected on the home page.
          </div>
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
                dragOverIndex === index ? 'border-blue-500 shadow-lg' : 'border-transparent'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, category)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex">
                {/* Drag Handle */}
                <div className="w-12 bg-gray-50 flex items-center justify-center cursor-move border-r">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                
                {/* Category Content */}
                <div className="flex-1 flex">
                  <div className="w-32 h-24 bg-gray-200">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">Order: {category.display_order}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
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
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter category name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
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
                            placeholder="Enter category description"
                          />
                        </div>
                      </div>

                      {/* Image Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Image</h4>
                        {formData.image && (
                          <div>
                            <img
                              src={formData.image}
                              alt="Category preview"
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
                            Category is active and visible to customers
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
                        <>{editingCategory ? 'Update Category' : 'Create Category'}</>
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

export default AdminCategories
