import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-200 ${onClick ? 'active:scale-98 active:shadow-inner cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};