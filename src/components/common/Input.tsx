import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps {
  type?: 'text' | 'number' | 'textarea';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  icon?: ReactNode;
}

export function Input({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  label,
  icon,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className={clsx('relative', type === 'textarea' && 'block')}>
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={clsx(
              'w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 resize-none',
              icon && 'pl-10',
              className
            )}
            rows={4}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={clsx(
              'w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200',
              icon && 'pl-10',
              className
            )}
          />
        )}
      </div>
    </div>
  );
}
