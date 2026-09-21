import React, { useEffect, useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/admin/EmptyState'
import ConfirmModal from '../../components/admin/ConfirmModal'
import { AdminTableSkeleton } from '../../components/admin/AdminSkeletons'

interface Category {
  id: string
  name: string
  description: string
  image: string
  is_active: boolean
  display_order: number
  created_at: string
}

const emptyForm = {
  name: '',
  description: '',
  image: '',
  is_active: true,
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
      if (categoriesError) throw categoriesError
      setCategories(data || [])
    } catch (fetchError) {
      console.error('Error fetching categories:', fetchError)
      setError('Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCategories()
  }, [])

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('categories').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('categories').getPublicUrl(fileName)
    return publicUrl
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingCategory(null)
    setImageFile(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      let imageUrl = formData.image
      if (imageFile) imageUrl = await handleImageUpload(imageFile)

      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
        is_active: formData.is_active,
        display_order: editingCategory ? editingCategory.display_order : categories.length,
      }

      if (editingCategory) {
        const { error: updateError } = await supabase.from('categories').update(categoryData).eq('id', editingCategory.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('categories').insert(categoryData)
        if (insertError) throw insertError
      }

      await fetchCategories()
      setShowModal(false)
      resetForm()
    } catch (saveError) {
      console.error('Error saving category:', saveError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('categories').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      await fetchCategories()
      setDeleteId(null)
    } catch (deleteError) {
      console.error('Error deleting category:', deleteError)
    } finally {
      setDeleting(false)
    }
  }

  const handleDrop = async (event: React.DragEvent, dropIndex: number) => {
    event.preventDefault()
    setDragOverIndex(null)
    if (!draggedCategory) return

    const draggedIndex = categories.findIndex((category) => category.id === draggedCategory.id)
    if (draggedIndex === dropIndex) return

    const newCategories = [...categories]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(dropIndex, 0, draggedCategory)
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      display_order: index,
    }))
    setCategories(updatedCategories)

    try {
      const { error: upsertError } = await supabase.from('categories').upsert(
        updatedCategories.map((category) => ({
          id: category.id,
          display_order: category.display_order,
        })),
        { onConflict: 'id' }
      )
      if (upsertError) throw upsertError
    } catch (reorderError) {
      console.error('Error updating category order:', reorderError)
      setCategories(categories)
    }

    setDraggedCategory(null)
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Drag and drop categories to reorder them. The order is reflected on the home page.
        </p>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add category
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton rows={5} />
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            title="No categories"
            description="Get started by creating a new category."
            action={{
              label: 'Add category',
              onClick: () => {
                resetForm()
                setShowModal(true)
              },
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div
              key={category.id}
              draggable
              onDragStart={(event) => {
                setDraggedCategory(category)
                event.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOverIndex(index)
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(event) => void handleDrop(event, index)}
              onDragEnd={() => {
                setDraggedCategory(null)
                setDragOverIndex(null)
              }}
              className={`flex overflow-hidden rounded-xl border bg-white shadow-sm ${
                dragOverIndex === index ? 'border-sky-400' : 'border-slate-200'
              }`}
            >
              <div className="flex w-10 cursor-move items-center justify-center bg-slate-50 text-slate-400" aria-hidden="true">
                <GripVertical className="h-5 w-5" />
              </div>
              <img
                src={category.image}
                alt=""
                width={96}
                height={80}
                loading="lazy"
                decoding="async"
                className="h-20 w-24 object-cover sm:h-24 sm:w-32"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{category.name}</h3>
                    <StatusBadge
                      label={category.is_active ? 'Active' : 'Inactive'}
                      tone={category.is_active ? 'success' : 'danger'}
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{category.description}</p>
                </div>
                <div className="mt-3 flex gap-2 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(category)
                      setFormData({
                        name: category.name,
                        description: category.description,
                        image: category.image,
                        is_active: category.is_active,
                      })
                      setShowModal(true)
                    }}
                    className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(category.id)}
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close dialog" onClick={() => setShowModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" className="relative mx-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleSubmit}>
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 id="category-dialog-title" className="text-lg font-semibold text-slate-900">
                  {editingCategory ? 'Edit category' : 'Add category'}
                </h3>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label htmlFor="category-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Category name
                  </label>
                  <input
                    id="category-name"
                    required
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="category-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="category-image" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Category image
                  </label>
                  <input
                    id="category-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Current category" className="mt-3 h-20 w-20 rounded-lg object-cover" />
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Category is active and visible
                </label>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {submitting ? 'Saving...' : editingCategory ? 'Update category' : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete category"
        message="This category will be permanently removed."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

export default AdminCategories
