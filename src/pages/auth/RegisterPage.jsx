import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Could not create account');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-grid bg-[size:24px_24px] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-10"
      >
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 text-sm font-bold text-white">SR</div>
          <span className="text-sm font-semibold text-slate-600">Smart Retail POS</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Register your store</h2>
        <p className="mt-2 text-sm text-slate-500">
          Create a store workspace and become its Admin. You can add Managers and Cashiers from Team Management.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 space-y-4 sm:space-y-0">
            <Input
              label="Owner/Admin name"
              placeholder="Aarav Sharma"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message}
            />
            <Input
              label="Store/business name"
              placeholder="Aarav's Market"
              {...register('storeName', { required: 'Store name is required' })}
              error={errors.storeName?.message}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Email"
              type="email"
              placeholder="aarav@smartretail.com"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
              error={errors.password?.message}
            />
          </div>

          <div>
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...register('passwordConfirm', {
                required: 'Please confirm your password',
                validate: (value) => value === getValues('password') || 'Passwords do not match',
              })}
              error={errors.passwordConfirm?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? 'Creating store…' : 'Create store account'}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">Go to login</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
