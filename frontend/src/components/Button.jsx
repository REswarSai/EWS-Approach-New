import React from 'react';

const baseClasses = `font-sans font-semibold uppercase tracking-widest px-5 py-2 border-none outline-none transition-all duration-200 shadow-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background select-none text-sm`;

const variantClasses = {
  primary: 'bg-primary text-background hover:shadow-neon hover:bg-primary/90',
  secondary: 'bg-secondary text-background hover:bg-secondary/90',
  danger: 'bg-danger text-background hover:bg-danger/90',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
  disabled: 'bg-border text-textSecondary cursor-not-allowed opacity-60',
};

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}) {
  const classes = [
    baseClasses,
    disabled ? variantClasses.disabled : variantClasses[variant] || variantClasses.primary,
    'rounded-none',
    className,
  ].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button; 