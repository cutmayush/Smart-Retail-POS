import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowDown,
  FiArrowUpRight,
  FiBarChart2,
  FiCheck,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiGrid,
  FiLock,
  FiMail,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const features = [
  { title: 'Sales & checkout', description: 'A smoother checkout from cart to receipt.', icon: FiCreditCard },
  { title: 'Inventory control', description: 'Keep products and stock in one place.', icon: FiPackage },
  { title: 'Insights that help', description: 'Understand activity across your store.', icon: FiBarChart2 },
];

const loginRoles = [
  { name: 'Admin', icon: FiShield, active: 'border-cyan-300 bg-cyan-50 text-cyan-800' },
  { name: 'Manager', icon: FiBarChart2, active: 'border-violet-300 bg-violet-50 text-violet-800' },
  { name: 'Cashier', icon: FiCreditCard, active: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
];

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const reduceMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const [selectedRole, setSelectedRole] = useState('Admin');

  const onSubmit = async (values) => {
    try {
      await login(values, selectedRole);
      setStatus('success');
      toast.success('Welcome back to Smart Retail POS');
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (error) {
      toast.error(error?.message || 'Invalid credentials');
    }
  };

  const busy = isSubmitting || status === 'success';

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-[#071617] font-sans text-white antialiased">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-48 h-[38rem] w-[38rem] rounded-full bg-cyan-500/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 35, 0], y: [0, 22, 0], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 top-[28rem] h-[42rem] w-[42rem] rounded-full bg-emerald-500/[0.08] blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -28, 0], y: [0, -18, 0], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(16,117,112,0.2),transparent_58%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8 lg:px-12">
        <a href="#home" className="flex items-center gap-2.5" aria-label="Smart Retail home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-950/30">
            <FiShoppingBag className="h-[18px] w-[18px] text-slate-950" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-white">Smart<span className="text-cyan-300">Retail</span></span>
        </a>

        <nav className="hidden items-center gap-8 text-xs font-medium text-slate-400 md:flex" aria-label="Main navigation">
          <a href="#home" className="transition hover:text-white">Home</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#workspace" className="transition hover:text-white">How it works</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/register"
            aria-label="Create New Store Account"
            className="rounded-full border border-white/15 px-3 py-2.5 text-[10px] font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08] sm:px-4 sm:text-xs"
          >
            <span className="sm:hidden">Register store</span>
            <span className="hidden sm:inline">Create New Store Account</span>
          </Link>
          <a
            href="#sign-in"
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-3 py-2.5 text-[10px] font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-400 sm:px-5 sm:text-xs"
          >
            Sign in <FiArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main id="home" className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-4xl pb-[clamp(1.5rem,4vh,3rem)] pt-[clamp(1.5rem,6.5vh,5rem)] text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-300 shadow-sm sm:text-[11px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Your complete retail workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:mt-6 sm:text-5xl lg:text-[clamp(2.6rem,3.8vw,3.5rem)]"
          >
            Manage your sales and
            <span className="block text-cyan-300"> inventory in one place.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7"
          >
            A clearer way to run your store, serve your customers, and keep your
            team moving—all from one simple point-of-sale platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href="#sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400"
            >
              Sign in to your workspace <FiArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              Explore features <FiArrowDown className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </section>

        <section id="workspace" className="relative mx-auto max-w-6xl scroll-mt-8">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 top-8 h-64 rounded-[50%] bg-cyan-500/10 blur-3xl"
            animate={reduceMotion ? undefined : { opacity: [0.45, 0.8, 0.45], scale: [0.98, 1.04, 0.98] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="relative overflow-hidden rounded-t-[1.5rem] border border-white/15 bg-[#111c1e] shadow-[0_35px_100px_-35px_rgba(0,0,0,0.8)] sm:rounded-t-[1.8rem]"
            aria-label="Illustration preview of the Smart Retail POS workspace"
          >
            <div className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#0b1214] px-4 sm:h-14 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
                  <FiGrid className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-semibold text-slate-200 sm:text-xs">Store overview</span>
                <span className="hidden rounded-full border border-white/10 px-2 py-1 text-[9px] text-slate-500 sm:inline-flex">Workspace preview</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="hidden items-center gap-1.5 text-[10px] text-slate-500 sm:flex">
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                    animate={reduceMotion ? undefined : { opacity: [1, 0.45, 1], scale: [1, 1.25, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  Connected
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-[10px] font-bold text-slate-950">S</span>
              </div>
            </div>

            <div className="grid min-h-[280px] grid-cols-1 sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr]">
              <aside className="hidden border-r border-white/[0.07] bg-[#0e1719] p-4 sm:block">
                <p className="mb-4 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Dashboard', icon: FiGrid, selected: true },
                    { label: 'Products', icon: FiPackage },
                    { label: 'POS billing', icon: FiCreditCard },
                    { label: 'Inventory', icon: FiShoppingBag },
                    { label: 'Team', icon: FiUsers },
                  ].map(({ label, icon: Icon, selected }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[10px] font-medium ${
                        selected ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="min-w-0 p-4 sm:p-5 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white sm:text-base">Good to see you</p>
                    <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Your store activity, all together.</p>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[9px] text-slate-400 sm:text-[10px]">Overview</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 sm:gap-3">
                  {[
                    { label: 'Sales', icon: FiCreditCard, tone: 'text-emerald-300 bg-emerald-400/10' },
                    { label: 'Orders', icon: FiPackage, tone: 'text-blue-300 bg-blue-400/10' },
                    { label: 'Products', icon: FiShoppingBag, tone: 'text-violet-300 bg-violet-400/10' },
                    { label: 'Team', icon: FiUsers, tone: 'text-amber-300 bg-amber-400/10' },
                  ].map(({ label, icon: Icon, tone }) => (
                    <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 sm:p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 sm:text-[10px]">{label}</span>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${tone}`}><Icon className="h-3 w-3" /></span>
                      </div>
                      <div className="mt-3 h-3 w-12 rounded bg-white/10" />
                      <div className="mt-2 h-1.5 w-16 rounded bg-white/[0.06]" />
                    </div>
                  ))}
                </div>

                <div className="mt-2 grid gap-3 md:grid-cols-[1.45fr_0.8fr]">
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-300 sm:text-xs">Sales activity</p>
                        <p className="mt-1 text-[9px] text-slate-600">A visual snapshot of your store</p>
                      </div>
                      <FiBarChart2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="mt-3 flex h-16 items-end gap-1.5 border-b border-l border-white/[0.08] px-2 sm:h-20 sm:gap-2">
                      {[34, 48, 40, 62, 54, 74, 58, 84, 68, 92, 75, 100].map((height, index) => (
                        <motion.span
                          key={index}
                          className={`flex-1 rounded-t-sm ${index === 9 ? 'bg-cyan-300' : 'bg-gradient-to-t from-teal-700/70 to-cyan-400/80'}`}
                          initial={{ height: reduceMotion ? `${height}%` : 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.7,
                            delay: reduceMotion ? 0 : 0.35 + index * 0.045,
                            ease: 'easeOut',
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between px-1 text-[8px] text-slate-600">
                      <span>Store activity</span><span>Updated from your data</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 sm:p-4">
                    <p className="text-[10px] font-semibold text-slate-300 sm:text-xs">Built for your team</p>
                    <p className="mt-1 text-[9px] text-slate-600">A shared view of everyday work</p>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: 'Checkout', icon: FiCreditCard, tone: 'bg-emerald-400/10 text-emerald-300' },
                        { label: 'Stock control', icon: FiPackage, tone: 'bg-blue-400/10 text-blue-300' },
                        { label: 'Team access', icon: FiUsers, tone: 'bg-violet-400/10 text-violet-300' },
                      ].map(({ label, icon: Icon, tone }) => (
                        <div key={label} className="flex items-center gap-2.5">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}><Icon className="h-3.5 w-3.5" /></span>
                          <span className="text-[9px] font-medium text-slate-400">{label}</span>
                          <FiCheck className="ml-auto h-3.5 w-3.5 text-emerald-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto grid max-w-5xl scroll-mt-10 gap-4 py-14 sm:grid-cols-3 sm:py-16">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition hover:border-white/15 hover:bg-white/[0.055]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
            </article>
          ))}
        </section>

        <section id="sign-in" className="mx-auto grid max-w-5xl scroll-mt-8 gap-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d1d1e] p-5 shadow-2xl shadow-black/20 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:p-10">
          <div className="flex flex-col justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><FiLock className="h-5 w-5" /></span>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Staff portal</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Welcome back.</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Sign in with your account to open your workspace. Your access is based on your assigned role.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <FiShield className="h-4 w-4 text-emerald-300" />
              Secure sign-in for your retail team
            </div>
          </div>

          <div className="rounded-2xl bg-[#f8fafc] p-5 text-slate-900 sm:p-7">
            <div className="mb-5">
              <h3 className="text-lg font-semibold tracking-tight">Sign in to your account</h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">Choose your role, then enter your account details.</p>
            </div>

            <div className="mb-5">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Workspace role</p>
                <span className="text-[10px] text-slate-400">Select your role</span>
              </div>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose your account role">
                {loginRoles.map(({ name, icon: Icon, active }) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selectedRole === name}
                    onClick={() => setSelectedRole(name)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition focus:outline-none focus:ring-4 focus:ring-cyan-100 sm:gap-2 sm:text-xs ${
                      selectedRole === name ? `${active} shadow-sm` : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                autoComplete="username"
                icon={FiMail}
                placeholder="you@yourstore.com"
                className="rounded-xl py-3"
                {...register('email', { required: 'Email address is required' })}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                icon={FiLock}
                placeholder="Enter your password"
                className="rounded-xl py-3"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                }
                {...register('password', { required: 'Password is required' })}
                error={errors.password?.message}
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-semibold text-cyan-700 transition hover:text-cyan-800">
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-sm font-semibold shadow-lg shadow-cyan-900/10 transition hover:-translate-y-0.5 disabled:translate-y-0"
                disabled={busy}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {status === 'success' ? (
                    <motion.span key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                      <FiCheck className="h-4 w-4" /> Signed in successfully
                    </motion.span>
                  ) : isSubmitting ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Signing in…
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Sign in to your workspace
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-500">
              New to Smart Retail?{' '}
              <Link to="/register" className="font-semibold text-cyan-700 transition hover:text-cyan-800">
                Register your store
              </Link>
            </p>
          </div>
        </section>

        <footer className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 py-8 text-[10px] text-slate-600 sm:flex-row">
          <p>© Smart Retail POS · Built for better retail days</p>
          <a href="#home" className="transition hover:text-slate-300">Back to top ↑</a>
        </footer>
      </main>
    </div>
  );
}

export default LoginPage;
