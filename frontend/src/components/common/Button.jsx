import { Link } from 'react-router-dom';

const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-smooth shadow-md hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses = {
  primary: 'bg-infosoft-red-500 text-white hover:bg-infosoft-red-600 focus-visible:outline-infosoft-red-600',
  secondary: 'border-2 border-infosoft-red-500 text-infosoft-red-500 bg-white hover:bg-infosoft-red-500 hover:text-white focus-visible:outline-infosoft-red-600',
  outline: 'border-2 border-white text-white hover:bg-white hover:text-infosoft-red-500 focus-visible:outline-white',
  ghost: 'text-infosoft-red-500 hover:text-infosoft-red-600 hover:bg-gray-100 focus-visible:outline-infosoft-red-500'
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
