import * as React from 'react';

// Button variants and sizes
type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Utility function to combine class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Base styles
const baseStyles = `
  inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium
  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
`;

// Variant styles
const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

// Size styles
const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

// Fallback inline styles for when Tailwind isn't configured
const fallbackStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: '#3b82f6',
  color: 'white',
};

const fallbackDisabledStyles: React.CSSProperties = {
  ...fallbackStyles,
  opacity: 0.5,
  cursor: 'not-allowed',
};

const fallbackVariantStyles: Record<ButtonVariant, React.CSSProperties> = {
  default: { backgroundColor: '#3b82f6', color: 'white' },
  destructive: { backgroundColor: '#ef4444', color: 'white' },
  outline: { backgroundColor: 'transparent', border: '1px solid #d1d5db', color: '#374151' },
  secondary: { backgroundColor: '#e5e7eb', color: '#374151' },
  ghost: { backgroundColor: 'transparent', color: '#374151' },
  link: { backgroundColor: 'transparent', color: '#3b82f6', textDecoration: 'underline' },
};

// Create buttonVariants as a function for compatibility
export const buttonVariants = (props?: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) => {
  const variant = props?.variant || 'default';
  const size = props?.size || 'default';
  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    props?.className
  );
  return classes;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, disabled, children, style, ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    // Combine Tailwind classes
    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    // Combine inline styles (fallback + variant + custom)
    const combinedStyle: React.CSSProperties = {
      ...(isDisabled ? fallbackDisabledStyles : fallbackStyles),
      ...fallbackVariantStyles[variant],
      ...style,
    };

    return (
      <button
        className={combinedClassName}
        style={combinedStyle}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <svg
            style={{ 
              marginRight: '0.5rem', 
              animation: 'spin 1s linear infinite',
              width: '1rem',
              height: '1rem'
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;


// import * as React from "react"
// import { Slot } from "@radix-ui/react-slot"
// import { cva, type VariantProps } from "class-variance-authority"

// import { cn } from "@/lib/utils"

// const buttonVariants = cva(
//   "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
//   {
//     variants: {
//       variant: {
//         default: "bg-primary text-primary-foreground hover:bg-primary/90",
//         destructive:
//           "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
//         outline:
//           "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
//         secondary:
//           "bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         ghost:
//           "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default: "h-9 px-4 py-2 has-[>svg]:px-3",
//         sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
//         lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
//         icon: "size-9",
//         "icon-sm": "size-8",
//         "icon-lg": "size-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )

// function Button({
//   className,
//   variant,
//   size,
//   asChild = false,
//   ...props
// }: React.ComponentProps<"button"> &
//   VariantProps<typeof buttonVariants> & {
//     asChild?: boolean
//   }) {
//   const Comp = asChild ? Slot : "button"

//   return (
//     <Comp
//       data-slot="button"
//       className={cn(buttonVariants({ variant, size, className }))}
//       {...props}
//     />
//   )
// }

// export { Button, buttonVariants }
