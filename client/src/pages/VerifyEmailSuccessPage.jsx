import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function VerifyEmailSuccessPage() {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
        OK
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Email Verified</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your account has been verified successfully. You can now log in and start trading.
      </p>
      <Link to="/login">
        <Button className="mt-4 w-full">Go to Login</Button>
      </Link>
    </Card>
  )
}

export default VerifyEmailSuccessPage
