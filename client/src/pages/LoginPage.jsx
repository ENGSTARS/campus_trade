import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { loginSchema } from '@/utils/validators'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { addToast } = useNotifications()
  const redirectTo = location.state?.from || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values) => {
    await login(values)
    addToast({ type: 'success', message: 'Logged in successfully' })
    navigate(redirectTo, { replace: true })
  }

  return (
    <Card className="p-6 sm:p-7">
      <div className="mb-4 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to continue trading on campus</p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="University Email"
          type="email"
          placeholder="student@university.edu"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Log In
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Create account
        </Link>
      </p>
    </Card>
  )
}

export default LoginPage
