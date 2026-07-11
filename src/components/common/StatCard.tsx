import { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
}

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <Card className="flex flex-col items-center text-center py-6">
      <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-4 text-orange-500">
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      <div className="text-sm text-gray-500 mb-2">{label}</div>
      {trend && (
        <div className={`text-sm font-medium ${trend.isUp ? 'text-green-500' : 'text-red-500'}`}>
          {trend.isUp ? '↑' : '↓'} {trend.value}%
        </div>
      )}
    </Card>
  );
}
