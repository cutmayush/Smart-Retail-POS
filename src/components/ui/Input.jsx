import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(function Input(
  { label, error, className, icon: Icon, rightElement, ...props },
  ref,
) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <span className="relative block">
        {Icon ? <Icon aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /> : null}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100',
            Icon && 'pl-10',
            rightElement && 'pr-10',
            error && 'border-rose-300 focus:border-rose-300 focus:ring-rose-100',
            className,
          )}
          {...props}
        />
        {rightElement ? <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span> : null}
      </span>
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </label>
  );
});

export default Input;
