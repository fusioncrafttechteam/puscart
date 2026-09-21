import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/admin/EmptyState'
import ConfirmModal from '../../components/admin/ConfirmModal'
import { AdminTableSkeleton } from '../../components/admin/AdminSkeletons'

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

const emptyForm = {
  title: '',
  description: '',
  image: '',
  is_active: true,
  start_date: '',
  end_date: '',
}

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<OfferBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<OfferBanner | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBanners = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: bannersError } = await supabase
        .from('offer_banners')
        .select('*')
        .order('created_at', { ascending: false })
      if (bannersError) throw bannersError
      setBanners(data || [])
    } catch (fetchError) {
      console.error('Error fetching banners:', fetchError)
      setError('Unable to load banners.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBanners()
  }, [])

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    return publicUrl
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingBanner(null)
    setImageFile(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      let imageUrl = formData.image
      if (imageFile) imageUrl = await handleImageUpload(imageFile)

      const bannerData = {
        title: formData.title,
        description: formData.description,
        image: imageUrl,
        is_active: formData.is_active,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      }

      if (editingBanner) {
        const { error: updateError } = await supabase.from('offer_banners').update(bannerData).eq('id', editingBanner.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('offer_banners').insert(bannerData)
        if (insertError) throw insertError
      }

      await fetchBanners()
      setShowModal(false)
      resetForm()
    } catch (saveError) {
      console.error('Error saving banner:', saveError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('offer_banners').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      await fetchBanners()
      setDeleteId(null)
    } catch (deleteError) {
      console.error('Error deleting banner:', deleteError)
    } finally {
      setDeleting(false)
    }
  }

  const toggleBannerStatus = async (id: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase.from('offer_banners').update({ is_active: !isActive }).eq('id', id)
      if (updateError) throw updateError
      setBanners((current) =>
        current.map((banner) => (banner.id === id ? { ...banner, is_active: !isActive } : banner))
      )
    } catch (updateError) {
      console.error('Error updating banner status:', updateError)
    }
  }

  const isBannerLive = (banner: OfferBanner) => {
    const now = new Date()
    return banner.is_active && now >= new Date(banner.start_date) && now <= new Date(banner.end_date)
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Manage promotional banners shown on the home page.</p>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add banner
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton rows={4} />
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            title="No banners"
            description="Get started by creating a new banner."
            action={{
              label: 'Add banner',
              onClick: () => {
                resetForm()
                setShowModal(true)
              },
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <article key={banner.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-40 bg-slate-100">
                <img
                  src={banner.image}
                  alt=""
                  width={640}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {isBannerLive(banner) && (
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-1 text-xs font-medium text-white">
                    Live
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{banner.title}</h3>
                  <StatusBadge
                    label={banner.is_active ? 'Enabled' : 'Disabled'}
                    tone={banner.is_active ? 'success' : 'danger'}
                  />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{banner.description}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {new Date(banner.start_date).toLocaleDateString()} – {new Date(banner.end_date).toLocaleDateString()}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBanner(banner)
                        setFormData({
                          title: banner.title,
                          description: banner.description,
                          image: banner.image,
                          is_active: banner.is_active,
                          start_date: new Date(banner.start_date).toISOString().split('T')[0],
                          end_date: new Date(banner.end_date).toISOString().split('T')[0],
                        })
                        setShowModal(true)
                      }}
                      className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50"
                      aria-label={`Edit ${banner.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(banner.id)}
                      className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${banner.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleBannerStatus(banner.id, banner.is_active)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {banner.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close dialog" onClick={() => setShowModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="banner-dialog-title" className="relative mx-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleSubmit}>
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 id="banner-dialog-title" className="text-lg font-semibold text-slate-900">
                  {editingBanner ? 'Edit banner' : 'Add banner'}
                </h3>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label htmlFor="banner-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Banner title
                  </label>
                  <input
                    id="banner-title"
                    required
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="banner-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    id="banner-description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="banner-start" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Start date
                    </label>
                    <input
                      id="banner-start"
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(event) => setFormData({ ...formData, start_date: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="banner-end" className="mb-1.5 block text-sm font-medium text-slate-700">
                      End date
                    </label>
                    <input
                      id="banner-end"
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(event) => setFormData({ ...formData, end_date: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="banner-image" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Banner image
                  </label>
                  <input
                    id="banner-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Current banner" className="mt-3 h-24 w-40 rounded-lg object-cover" />
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Banner is active
                </label>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {submitting ? 'Saving...' : editingBanner ? 'Update banner' : 'Create banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete banner"
        message="This banner will be permanently removed."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

export default AdminBanners
