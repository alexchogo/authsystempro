import * as React from 'react';

// Utility function to combine class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

type AlertVariant = 'default' | 'destructive' | 'success';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  children: React.ReactNode;
}

const alertBaseStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  borderRadius: '0.5rem',
  border: '1px solid',
  padding: '1rem',
  fontSize: '0.875rem',
};

const alertVariantStyles: Record<AlertVariant, React.CSSProperties> = {
  default: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    color: '#374151',
  },
  destructive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#991b1b',
  },
  success: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534',
  },
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          variant === 'destructive' && 'border-red-200 bg-red-50 text-red-800',
          variant === 'success' && 'border-green-200 bg-green-50 text-green-800',
          className
        )}
        style={{ ...alertBaseStyle, ...alertVariantStyles[variant], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const alertTitleStyle: React.CSSProperties = {
  marginBottom: '0.25rem',
  fontWeight: 500,
  lineHeight: '1.25rem',
  letterSpacing: '-0.025em',
};

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <h5
        ref={ref}
        className={cn('mb-1 font-medium leading-none tracking-tight', className)}
        style={{ ...alertTitleStyle, ...style }}
        {...props}
      >
        {children}
      </h5>
    );
  }
);
AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const alertDescriptionStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  opacity: 0.9,
  margin: 0,
};

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm [&_p]:leading-relaxed', className)}
        style={{ ...alertDescriptionStyle, ...style }}
        {...props}
      >
        {children}
      </p>
    );
  }
);
AlertDescription.displayName = 'AlertDescription';

export default Alert;

// import * as React from "react"
// import { cva, type VariantProps } from "class-variance-authority"

// import { cn } from "@/lib/utils"

// const alertVariants = cva(
//   "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
//   {
//     variants: {
//       variant: {
//         default: "bg-card text-card-foreground",
//         destructive:
//           "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// )

// function Alert({
//   className,
//   variant,
//   ...props
// }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
//   return (
//     <div
//       data-slot="alert"
//       role="alert"
//       className={cn(alertVariants({ variant }), className)}
//       {...props}
//     />
//   )
// }

// function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="alert-title"
//       className={cn(
//         "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// function AlertDescription({
//   className,
//   ...props
// }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="alert-description"
//       className={cn(
//         "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// export { Alert, AlertTitle, AlertDescription }
