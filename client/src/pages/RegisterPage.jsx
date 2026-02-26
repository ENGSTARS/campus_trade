import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { registerSchema } from '@/utils/validators'
import { CAMPUS_OPTIONS } from '@/utils/constants'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'

function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      campus: CAMPUS_OPTIONS[0],
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await registerUser(values)
      navigate('/verify-success')
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  // Reusable toggle button component to keep the JSX clean
  const ToggleIcon = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
      tabIndex="-1" // Prevents tabbing into the button for better keyboard flow
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )

  return (
    <Card className="p-6 sm:p-7">
      <div className="mb-4 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="mt-1 text-sm text-slate-600">Use your university email to join CampusTrade</p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} />
        
        <Input
          label="University Email"
          type="email"
          placeholder="student@university.edu"
          {...register('email')}
          error={errors.email?.message}
        />

        <Select
          label="Campus"
          {...register('campus')}
          options={CAMPUS_OPTIONS.map((campus) => ({ value: campus, label: campus }))}
          error={errors.campus?.message}
        />

        {/* Password Field */}
        <div className="relative">
          <Input 
            label="Password" 
            type={showPassword ? "text" : "password"} 
            className="pr-10" // Prevents text from overlapping the icon
            {...register('password')} 
            error={errors.password?.message} 
          />
          <ToggleIcon />
        </div>

        {/* Confirm Password Field */}
        <div className="relative">
          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            className="pr-10"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <ToggleIcon />
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Register'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Log in
        </Link>
      </p>
    </Card>
  )
}

export default RegisterPage