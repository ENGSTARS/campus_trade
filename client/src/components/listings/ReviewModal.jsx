import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { reviewSchema } from '@/utils/validators'

export function ReviewModal({ isOpen, onClose, onSubmit }) {
  const [hovered, setHovered] = useState(0)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  })

  const rating = watch('rating')

  const submit = async (values) => {
    await onSubmit(values)
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate this transaction">
      <form className="space-y-3" onSubmit={handleSubmit(submit)}>
        <div>
          <p className="text-sm font-medium text-slate-700">Rating</p>
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={`text-2xl ${star <= (hovered || rating) ? 'text-amber-400' : 'text-slate-300'}`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setValue('rating', star, { shouldValidate: true })}
              >
                *
              </button>
            ))}
          </div>
          {errors.rating?.message ? <span className="text-xs text-rose-600">{errors.rating.message}</span> : null}
        </div>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span className="font-medium">Comment</span>
          <textarea
            className="input-base min-h-24 resize-none"
            placeholder="Share your experience with this seller"
            {...register('comment')}
          />
          {errors.comment?.message ? (
            <span className="text-xs text-rose-600">{errors.comment.message}</span>
          ) : null}
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  )
}
