import React from 'react';

const PLATFORM_CONFIG = {
  shopee: {
    name: 'Shopee',
    colors: {
      bg: 'bg-orange-500',
      text: 'text-white',
      border: 'border-orange-600'
    },
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v9.22c0 4.36-3.12 8.44-8 9.8-4.88-1.36-8-5.44-8-9.8V7.78l8-3.6z"/>
      </svg>
    )
  },
  lazada: {
    name: 'Lazada',
    colors: {
      bg: 'bg-blue-600',
      text: 'text-white',
      border: 'border-blue-700'
    },
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v9.22c0 4.36-3.12 8.44-8 9.8-4.88-1.36-8-5.44-8-9.8V7.78l8-3.6z"/>
      </svg>
    )
  },
  amazon: {
    name: 'Amazon',
    colors: {
      bg: 'bg-yellow-500',
      text: 'text-gray-900',
      border: 'border-yellow-600'
    },
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v9.22c0 4.36-3.12 8.44-8 9.8-4.88-1.36-8-5.44-8-9.8V7.78l8-3.6z"/>
      </svg>
    )
  },
  unknown: {
    name: 'Product',
    colors: {
      bg: 'bg-gray-500',
      text: 'text-white',
      border: 'border-gray-600'
    },
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v9.22c0 4.36-3.12 8.44-8 9.8-4.88-1.36-8-5.44-8-9.8V7.78l8-3.6z"/>
      </svg>
    )
  }
};

/**
 * Platform badge component for displaying e-commerce platform branding
 * @param {string} platform - Platform identifier (shopee, lazada, amazon, unknown)
 * @param {string} size - Badge size (sm, md, lg)
 * @param {boolean} showIcon - Whether to show platform icon
 */
const PlatformBadge = ({ platform = 'unknown', size = 'md', showIcon = true }) => {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.unknown;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        border ${config.colors.bg} ${config.colors.text} ${config.colors.border}
        ${sizeClasses[size]}
        shadow-sm
      `}
    >
      {showIcon && config.icon}
      <span>{config.name}</span>
    </div>
  );
};

export default PlatformBadge;
