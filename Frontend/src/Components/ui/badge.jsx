import React from 'react';

export const Badge = ({ children, className, variant = 'default', ...props }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    default: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
    destructive: 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500',
    outline: 'text-gray-900 border border-gray-200 hover:bg-gray-100 focus:ring-gray-500',
  };

  const variantStyle = variants[variant] || variants.default;

  return (
    <div
      className={`${baseStyles} ${variantStyle} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};