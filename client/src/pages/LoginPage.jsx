import { useState } from 'react' // 1. Import useState
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { loginSchema } from '@/utils/validators'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react' // 2. Import icons

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { addToast } = useNotifications()
  const redirectTo = location.state?.from || '/'
  
  // 3. State for password visibility
  const [showPassword, setShowPassword] = useState(false)

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
    try {
      await login(values)
      addToast({ type: 'success', message: 'Logged in successfully' })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // Error handling is usually handled within the login context, 
      // but you can add local error handling here if needed.
    }
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

        {/* 4. Password field with toggle button */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            className="pr-10"
            {...register('password')}
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex="-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log In'}
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