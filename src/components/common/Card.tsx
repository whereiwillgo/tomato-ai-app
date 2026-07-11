import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-100 p-6',
        hoverable && 'cursor-pointer hover:shadow-md hover:border-orange-200 transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
