import React from 'react';
import BoxCard from './BoxCard';

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export default function StatBox({ icon, label, value, className = '' }: StatBoxProps) {
  return (
    <BoxCard
      leftContent={<div className="w-10 h-10 flex items-center justify-center">{icon}</div>}
      mainContent={
        <div>
          <div className="text-base text-slate-600 font-medium mb-1">{label}</div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
      }
      className={`min-w-[260px] max-w-xs ${className}`}
    />
  );
} 