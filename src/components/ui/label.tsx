import * as React from 'react';

// Utility function to combine class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children?: React.ReactNode;
  required?: boolean;
}

const labelBaseStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: '1rem',
  color: '#374151',
};

const requiredStyle: React.CSSProperties = {
  color: '#ef4444',
  marginLeft: '0.25rem',
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, style, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        style={{ ...labelBaseStyle, ...style }}
        {...props}
      >
        {children}
        {required && <span style={requiredStyle}>*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;



// "use client"

// import * as React from "react"
// import * as LabelPrimitive from "@radix-ui/react-label"

// import { cn } from "@/lib/utils"

// function Label({
//   className,
//   ...props
// }: React.ComponentProps<typeof LabelPrimitive.Root>) {
//   return (
//     <LabelPrimitive.Root
//       data-slot="label"
//       className={cn(
//         "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// export { Label }
