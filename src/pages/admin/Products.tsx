import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/admin/EmptyState'
import Pagination from '../../components/admin/Pagination'
import ConfirmModal from '../../components/admin/ConfirmModal'
import { AdminTableSkeleton } from '../../components/admin/AdminSkeletons'

interface Product {
  id: string
  name: string
  description: string
  category_id: string
  price: number
  offer_price: number | null
  discount_percentage: number
  stock: number
  image: string
  is_active: boolean
  popular: boolean
  featured: boolean
  best_selling: boolean
  created_at: string
  categories?: { name: string }
}

interface Category {
  id: string
  name: string
}

const PAGE_SIZE = 12

const emptyForm = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  offer_price: '',
  discount_percentage: '0',
  stock: '',
  image: '',
  is_active: true,
  popular: false,
  featured: false,
  best_selling: false,
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(searchTerm, 350)

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        return
      }
      setCategories(data || [])
    }

    void loadCategories()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const from = (page - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
          .from('products')
          .select('*, categories(name)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to)

        if (debouncedSearch) {
          query = query.ilike('name', `%${debouncedSearch}%`)
        }
        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory)
        }

        const { data, error: productsError, count } = await query
        if (productsError) throw productsError
        setProducts(data || [])
        setTotal(count || 0)
      } catch (fetchError) {
        console.error('Error fetching products:', fetchError)
        setError('Unable to load products.')
      } finally {
        setLoading(false)
      }
    }

    void fetchProducts()
  }, [debouncedSearch, selectedCategory, page])

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
    return publicUrl
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingProduct(null)
    setImageFile(null)
  }

  const refreshCurrentPage = async () => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let query = supabase
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (debouncedSearch) query = query.ilike('name', `%${debouncedSearch}%`)
    if (selectedCategory) query = query.eq('category_id', selectedCategory)
    const { data, count } = await query
    setProducts(data || [])
    setTotal(count || 0)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      let imageUrl = formData.image
      if (imageFile) imageUrl = await handleImageUpload(imageFile)

      const productData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        price: Number.parseFloat(formData.price),
        offer_price: formData.offer_price ? Number.parseFloat(formData.offer_price) : null,
        discount_percentage: Number.parseInt(formData.discount_percentage, 10) || 0,
        stock: Number.parseInt(formData.stock, 10),
        image: imageUrl,
        is_active: formData.is_active,
        popular: formData.popular,
        featured: formData.featured,
        best_selling: formData.best_selling,
      }

      if (editingProduct) {
        const { error: updateError } = await supabase.from('products').update(productData).eq('id', editingProduct.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('products').insert(productData)
        if (insertError) throw insertError
      }

      await refreshCurrentPage()
      setShowModal(false)
      resetForm()
    } catch (saveError) {
      console.error('Error saving product:', saveError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      price: product.price.toString(),
      offer_price: product.offer_price?.toString() || '',
      discount_percentage: product.discount_percentage?.toString() || '0',
      stock: product.stock.toString(),
      image: product.image,
      is_active: product.is_active,
      popular: product.popular,
      featured: product.featured,
      best_selling: product.best_selling,
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('products').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      await refreshCurrentPage()
      setDeleteId(null)
    } catch (deleteError) {
      console.error('Error deleting product:', deleteError)
    } finally {
      setDeleting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Create, edit, and organize store products.</p>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add product
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products..."
              className={`${inputClass} pl-9`}
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className={inputClass}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt=""
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <span className="text-sm font-medium text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{product.categories?.name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-900">
                      ₹{product.price.toFixed(2)}
                      {product.offer_price ? (
                        <span className="ml-2 text-xs text-emerald-600">offer ₹{product.offer_price.toFixed(2)}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-900">{product.stock}</td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        label={product.is_active ? 'Active' : 'Inactive'}
                        tone={product.is_active ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(product.id)}
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {products.map((product) => (
              <div key={product.id} className="flex items-start gap-3 p-4">
                <img
                  src={product.image}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.categories?.name || '—'}</p>
                    </div>
                    <StatusBadge
                      label={product.is_active ? 'Active' : 'Inactive'}
                      tone={product.is_active ? 'success' : 'danger'}
                    />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">₹{product.price.toFixed(2)} · Stock {product.stock}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => handleEdit(product)} className="text-sm font-medium text-sky-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleteId(product.id)} className="text-sm font-medium text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <EmptyState
              title="No products"
              description="Get started by creating a new product."
              action={{
                label: 'Add product',
                onClick: () => {
                  resetForm()
                  setShowModal(true)
                },
              }}
            />
          )}

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close dialog" onClick={() => setShowModal(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-dialog-title"
            className="relative mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-xl"
          >
            <form onSubmit={handleSubmit}>
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 id="product-dialog-title" className="text-lg font-semibold text-slate-900">
                  {editingProduct ? 'Edit product' : 'Add product'}
                </h3>
              </div>
              <div className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Product name
                    </label>
                    <input
                      id="product-name"
                      required
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Category
                    </label>
                    <select
                      id="product-category"
                      required
                      value={formData.category_id}
                      onChange={(event) => setFormData({ ...formData, category_id: event.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    id="product-description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Regular price
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-offer" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Offer price
                    </label>
                    <input
                      id="product-offer"
                      type="number"
                      step="0.01"
                      value={formData.offer_price}
                      onChange={(event) => setFormData({ ...formData, offer_price: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-discount" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Discount %
                    </label>
                    <input
                      id="product-discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(event) => setFormData({ ...formData, discount_percentage: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-stock" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Stock
                    </label>
                    <input
                      id="product-stock"
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(event) => setFormData({ ...formData, stock: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="product-image" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Product image
                  </label>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Current product" className="mt-3 h-20 w-20 rounded-lg object-cover" />
                  )}
                </div>
                <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <legend className="mb-1 text-sm font-medium text-slate-700">Homepage sections</legend>
                  {[
                    ['popular', 'Popular'],
                    ['featured', 'Featured'],
                    ['best_selling', 'Best selling'],
                    ['is_active', 'Active and visible'],
                  ].map(([key, label]) => {
                    const field = key as 'popular' | 'featured' | 'best_selling' | 'is_active'
                    return (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData[field]}
                        onChange={(event) => setFormData({ ...formData, [field]: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      {label}
                    </label>
                    )
                  })}
                </fieldset>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update product' : 'Create product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete product"
        message="This product will be permanently removed from the catalog."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

export default AdminProducts
