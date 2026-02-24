import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { REPORT_REASONS } from '@/utils/constants'
import { reportSchema } from '@/utils/validators'

export function ReportModal({ isOpen, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: '', details: '' },
  })

  const submit = async (values) => {
    await onSubmit(values)
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Listing">
      <form className="space-y-3" onSubmit={handleSubmit(submit)}>
        <Select
          label="Reason"
          {...register('reason')}
          options={[
            { value: '', label: 'Select reason' },
            ...REPORT_REASONS.map((reason) => ({ value: reason, label: reason })),
          ]}
          error={errors.reason?.message}
        />
        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span className="font-medium">Additional details</span>
          <textarea
            className="input-base min-h-24 resize-none"
            {...register('details')}
            placeholder="Optional details to support your report"
          />
          {errors.details?.message ? (
            <span className="text-xs text-rose-600">{errors.details.message}</span>
          ) : null}
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  )
}
