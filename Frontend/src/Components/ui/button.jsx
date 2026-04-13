import React from 'react';

export const Button = ({ children, className, variant = 'default', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 focus-visible:ring-gray-400',
    link: 'bg-transparent underline-offset-4 hover:underline text-blue-600 hover:bg-transparent focus-visible:ring-blue-500',
  };

  const variantStyle = variants[variant] || variants.default;

  return (
    <button
      className={`${baseStyles} ${variantStyle} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};