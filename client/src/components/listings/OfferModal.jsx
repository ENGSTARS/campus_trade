import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const offerSchema = z.object({
  amount: z.coerce.number().min(1, 'Enter a valid amount'),
  note: z.string().max(200, 'Keep your note under 200 characters').optional(),
})

export function OfferModal({ isOpen, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      amount: '',
      note: '',
    },
  })

  const submit = async (values) => {
    await onSubmit(values)
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Make an Offer">
      <form className="space-y-3" onSubmit={handleSubmit(submit)}>
        <Input
          label="Offer amount (USD)"
          type="number"
          {...register('amount')}
          error={errors.amount?.message}
          placeholder="40"
        />
        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span className="font-medium">Message (optional)</span>
          <textarea
            className="input-base min-h-24 resize-none"
            {...register('note')}
            placeholder="Add a note for the seller"
          />
          {errors.note?.message ? <span className="text-xs text-rose-600">{errors.note.message}</span> : null}
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Send Offer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
