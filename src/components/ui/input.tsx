import * as React from 'react';

// Utility function to combine class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

const inputBaseStyle: React.CSSProperties = {
  display: 'flex',
  height: '2.5rem',
  width: '100%',
  borderRadius: '0.375rem',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputBaseStyle,
  borderColor: '#ef4444',
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputBaseStyle,
  cursor: 'not-allowed',
  opacity: 0.5,
  backgroundColor: '#f9fafb',
};

const errorMessageStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '0.25rem',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, disabled, style, ...props }, ref) => {
    const computedStyle = disabled
      ? inputDisabledStyle
      : error
      ? inputErrorStyle
      : inputBaseStyle;

    return (
      <div style={{ width: '100%' }}>
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          style={{ ...computedStyle, ...style }}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {error && errorMessage && (
          <p style={errorMessageStyle}>{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;


// import * as React from "react"

// import { cn } from "@/lib/utils"

// function Input({ className, type, ...props }: React.ComponentProps<"input">) {
//   return (
//     <input
//       type={type}
//       data-slot="input"
//       className={cn(
//         "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//         "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
//         "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// export { Input }
