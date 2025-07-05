import React from 'react';

interface BoxCardProps {
  leftContent: React.ReactNode;
  mainContent: React.ReactNode;
  rightButton?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export default function BoxCard({
  leftContent,
  mainContent,
  rightButton,
  className = '',
  children,
}: BoxCardProps) {
  return (
    <div
      className={`flex items-center justify-between bg-[#F3F3F3] rounded-[64px] shadow-sm px-8 py-8 my-4 min-h-[120px] border border-[#23232B] border-opacity-10 relative ${className}`}
      style={{ boxShadow: '0 4px 0 #23232B' }}
    >
      <div className="flex items-center space-x-6">
        <div className="text-5xl font-light select-none">{leftContent}</div>
        <div className="text-lg font-medium text-[#23232B]">{mainContent}</div>
      </div>
      {children && <div className="flex-1 mx-8">{children}</div>}
      {rightButton && (
        <div className="flex items-center justify-center">
          {rightButton}
        </div>
      )}
    </div>
  );
} 