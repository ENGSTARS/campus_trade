import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listingsApi } from '@/api/listingsApi'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { CAMPUS_OPTIONS, CATEGORY_OPTIONS, CONDITION_OPTIONS, TYPE_OPTIONS } from '@/utils/constants'
import { getListingPermissions } from '@/utils/listingPermissions'
import { createListingSchema } from '@/utils/validators'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { extractApiErrorMessage } from '@/utils/apiErrors'

function idsEqual(left, right) {
  return String(left) === String(right)
}

const baseFormValues = {
  title: '',
  description: '',
  price: '',
  category: CATEGORY_OPTIONS[0],
  condition: CONDITION_OPTIONS[0],
  type: TYPE_OPTIONS[0],
  campus: CAMPUS_OPTIONS[0],
  quantity: '1',
  imageUrl: '',
}

function mapListingToFormValues(listing) {
  return {
    title: listing.title || '',
    description: listing.description || '',
    price: String(listing.price ?? ''),
    category: listing.category || CATEGORY_OPTIONS[0],
    condition: listing.condition || CONDITION_OPTIONS[0],
    type: listing.type || TYPE_OPTIONS[0],
    campus: listing.campus || CAMPUS_OPTIONS[0],
    quantity: String(listing.quantity ?? 1),
    imageUrl: listing.images?.[0] || '',
  }
}

function CreateListingPage() {
  const navigate = useNavigate()
  const { listingId } = useParams()
  const isEditMode = Boolean(listingId)
  const { user: currentUser } = useAuth()
  const { createListing, updateListing, deleteListing, listings, setListings } = useApp()
  const { addToast } = useNotifications()

  const listingFromContext = useMemo(
    () => (isEditMode ? listings.find((item) => idsEqual(item.id, listingId)) || null : null),
    [isEditMode, listings, listingId],
  )

  const [editingListing, setEditingListing] = useState(listingFromContext)
  const [isBootstrapping, setIsBootstrapping] = useState(isEditMode)
  const [loadError, setLoadError] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createListingSchema),
    defaultValues: baseFormValues,
  })
  const imageUrlValue = watch('imageUrl')

  useEffect(() => {
    if (!isEditMode) {
      setIsBootstrapping(false)
      setLoadError('')
      return
    }

    if (listingFromContext) {
      setEditingListing(listingFromContext)
      setLoadError('')
      setIsBootstrapping(false)
      return
    }

    let isMounted = true

    async function loadEditableListing() {
      setIsBootstrapping(true)
      setLoadError('')
      try {
        const data = await listingsApi.getListingById(listingId)
        if (!isMounted) return
        const item = data?.item || null
        setEditingListing(item)
        if (item) {
          setListings((previous) =>
            previous.some((listing) => idsEqual(listing.id, item.id)) ? previous : [item, ...previous],
          )
        }
      } catch {
        if (!isMounted) return
        setLoadError('Could not load listing for editing.')
      } finally {
        if (isMounted) setIsBootstrapping(false)
      }
    }

    loadEditableListing()

    return () => {
      isMounted = false
    }
  }, [isEditMode, listingFromContext, listingId, setListings])

  const permissions = useMemo(
    () => (isEditMode && editingListing ? getListingPermissions(editingListing, currentUser) : null),
    [isEditMode, editingListing, currentUser],
  )

  useEffect(() => {
    if (isEditMode) {
      if (!editingListing) return
      reset(mapListingToFormValues(editingListing))
      return
    }

    reset({
      ...baseFormValues,
      campus: currentUser?.campus || baseFormValues.campus,
    })
  }, [isEditMode, editingListing, currentUser?.campus, reset])

  const onSubmit = async (values) => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    try {
      if (isEditMode) {
        if (!editingListing || !permissions?.isOwner) return

        const patch = {
          title: values.title.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          campus: values.campus,
          quantity: Number(values.quantity),
          category: values.category,
          condition: values.condition,
          type: values.type,
          images: values.imageUrl ? [values.imageUrl.trim()] : editingListing.images,
        }

        const updated = await updateListing(editingListing.id, patch)
        if (!updated) return

        addToast({ type: 'success', message: 'Listing updated successfully' })
        navigate(`/listings/${editingListing.id}`)
        return
      }

      const created = await createListing(values, currentUser)
      if (!created) return

      addToast({ type: 'success', message: 'Listing posted successfully' })
      navigate(`/listings/${created.id}`)
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to save this listing.') })
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const data = await listingsApi.uploadImage(file)
      const imageUrl = data?.imageUrl || ''
      setValue('imageUrl', imageUrl, { shouldValidate: true, shouldDirty: true })
      addToast({ type: 'success', message: 'Image uploaded successfully' })
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Could not upload image') })
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!editingListing || !permissions?.isOwner) return
    const shouldDelete = window.confirm('Delete this listing? This action cannot be undone.')
    if (!shouldDelete) return

    try {
      const deleted = await deleteListing(editingListing.id)
      if (!deleted) return

      addToast({ type: 'success', message: 'Listing deleted' })
      navigate('/')
    } catch (error) {
      addToast({ type: 'error', message: extractApiErrorMessage(error, 'Unable to delete this listing.') })
    }
  }

  if (isBootstrapping) {
    return <Skeleton className="mx-auto h-[520px] w-full max-w-3xl" />
  }

  if (loadError) {
    return <ErrorState title="Unable to edit listing" description={loadError} />
  }

  if (isEditMode && !editingListing) {
    return <ErrorState title="Listing not found" description="This listing may have been removed." />
  }

  if (isEditMode && !permissions?.isOwner) {
    return (
      <ErrorState
        title="Editing unavailable"
        description="You can only edit listings you posted."
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            {isEditMode ? 'Manage Listing' : 'Sell on CampusTrade'}
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {isEditMode ? 'Edit Listing' : 'Post a New Item'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isEditMode
              ? 'Update your listing details and keep your post current.'
              : 'Your listing will appear on the marketplace immediately and under My Listings in your profile.'}
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Title"
            placeholder="Ex: iPad 9th Gen - 64GB"
            {...register('title')}
            error={errors.title?.message}
          />

          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            <span className="font-medium">Description</span>
            <textarea
              className="input-base min-h-28 resize-y"
              placeholder="Add condition, what's included, and pickup details."
              {...register('description')}
            />
            {errors.description?.message ? (
              <span className="text-xs text-rose-600">{errors.description.message}</span>
            ) : null}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Price (USD)"
              type="number"
              min="1"
              step="0.01"
              placeholder="100"
              {...register('price')}
              error={errors.price?.message}
            />
            <Input
              label="Quantity In Stock"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              {...register('quantity')}
              error={errors.quantity?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              {...register('type')}
              options={[
                { value: 'NEW', label: 'New' },
                { value: 'SECOND_HAND', label: 'Second Hand' },
              ]}
              error={errors.type?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Category"
              {...register('category')}
              options={CATEGORY_OPTIONS.map((item) => ({ value: item, label: item }))}
              error={errors.category?.message}
            />
            <Select
              label="Condition"
              {...register('condition')}
              options={CONDITION_OPTIONS.map((item) => ({ value: item, label: item }))}
              error={errors.condition?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Campus"
              {...register('campus')}
              options={CAMPUS_OPTIONS.map((item) => ({ value: item, label: item }))}
              error={errors.campus?.message}
            />
            <label className="flex w-full flex-col gap-1.5 text-sm text-slate-700">
              <span className="font-medium">Listing Image</span>
              <input
                type="file"
                accept="image/*"
                className="input-base"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
              <span className="text-xs text-slate-500">
                {isUploadingImage ? 'Uploading to ImgBB...' : 'Choose an image file to upload.'}
              </span>
            </label>
          </div>

          <Input
            label="Hosted Image URL"
            placeholder="Upload an image to fill this automatically"
            {...register('imageUrl')}
            value={imageUrlValue || ''}
            readOnly
            error={errors.imageUrl?.message}
          />

          {imageUrlValue ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={imageUrlValue} alt="Listing preview" className="h-56 w-full object-cover" />
            </div>
          ) : null}
          {/* Payment/Social Links */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Payment Method Link (optional)" placeholder="e.g. PayPal, M-Pesa, etc." {...register('paymentLink')} />
            <Input label="Facebook Link (optional)" placeholder="e.g. https://facebook.com/yourprofile" {...register('facebookLink')} />
            <Input label="Instagram Link (optional)" placeholder="e.g. https://instagram.com/yourprofile" {...register('instagramLink')} />
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <div className="flex flex-wrap gap-2">
              {isEditMode ? (
                <Button variant="danger" onClick={handleDelete}>
                  Delete Listing
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={isEditMode && editingListing ? `/listings/${editingListing.id}` : '/profile'}
                className="btn-secondary"
              >
                Cancel
              </Link>
              <Button type="submit" disabled={isSubmitting || isUploadingImage}>
                {isUploadingImage ? 'Uploading image...' : isEditMode ? 'Save Changes' : 'Post Item'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateListingPage
