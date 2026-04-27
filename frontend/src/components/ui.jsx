import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = ({ className, variant = 'primary', size = 'md', ...props }) => {
  const variants = {
    primary: 'premium-gradient text-white hover:opacity-90 shadow-lg',
    secondary: 'glass text-white hover:bg-white/10',
    outline: 'border border-white/20 text-white hover:bg-white/5',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

export const Input = ({ className, label, error, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-300 ml-1">{label}</label>}
      <input
        className={cn(
          'w-full glass border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all',
          error && 'border-red-500 focus:ring-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
    </div>
  );
};

export const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('glass-card rounded-3xl p-6 overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  );
};
