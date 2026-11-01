import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Users, ShoppingBag, BarChart3, Settings, Activity } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password)
    if (result.success) {
      navigate('/')
    } else {
      setError('root', { message: result.error || 'Login failed' })
    }
  }

  const adminFeatures = [
    { icon: <Users size={22} />, title: 'User Management', desc: 'Manage all platform users and roles' },
    { icon: <ShoppingBag size={22} />, title: 'Order Oversight', desc: 'Track and manage orders across all stores' },
    { icon: <BarChart3 size={22} />, title: 'Analytics & Reports', desc: 'Platform-wide insights and performance' },
    { icon: <Settings size={22} />, title: 'Platform Settings', desc: 'Configure global platform settings' },
    { icon: <Activity size={22} />, title: 'Vendor Management', desc: 'Approve, monitor, and support vendors' },
  ]

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 to-purple-500" />
        <div className="w-full max-w-md relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Store size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">MyMart</h1>
              <p className="text-sm text-gray-500">Admin Portal</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-gray-500 mb-6">Sign in to manage your platform</p>

            {(errors.root || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700"
                role="alert"
              >
                <AlertCircle size={20} />
                <span>{errors.root?.message || error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="admin@mymart.com"
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-white/50 text-sm ${
                      errors.email
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent'
                    }`}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-500 mt-1.5" role="alert">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className={`w-full pl-12 pr-12 py-3.5 border rounded-xl outline-none transition-all bg-white/50 text-sm ${
                      errors.password
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent'
                    }`}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-red-500 mt-1.5" role="alert">{errors.password.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-500 to-purple-700 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-900 opacity-10 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="max-w-md relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold text-white mb-3">Platform Admin</h2>
            <p className="text-violet-100 mb-8">Full control over your marketplace. Manage users, vendors, orders, and platform settings from one place.</p>
            <div className="space-y-4">
              {adminFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-violet-100">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
