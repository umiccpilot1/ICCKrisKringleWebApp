import { Link } from 'react-router-dom';

const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-smooth shadow-md hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses = {
  primary: 'bg-icc-orange text-white hover:bg-icc-orange-dark focus-visible:outline-icc-orange-dark',
  secondary: 'border-2 border-icc-blue text-icc-blue hover:bg-icc-blue hover:text-white focus-visible:outline-icc-blue-dark',
  outline: 'border-2 border-white text-white hover:bg-white hover:text-icc-blue focus-visible:outline-white',
  ghost: 'text-icc-blue hover:text-icc-blue-dark hover:bg-icc-gray-100 focus-visible:outline-icc-blue'
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
