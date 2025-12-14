import * as React from 'react';

// Utility function to combine class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Card component
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cardBaseStyle: React.CSSProperties = {
  borderRadius: '0.5rem',
  border: '1px solid #e5e7eb',
  backgroundColor: 'white',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
        style={{ ...cardBaseStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// CardHeader component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
  padding: '1.5rem',
};

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        style={{ ...cardHeaderStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

// CardTitle component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: '-0.025em',
  margin: 0,
};

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
        style={{ ...cardTitleStyle, ...style }}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

// CardDescription component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const cardDescriptionStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: 0,
};

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        style={{ ...cardDescriptionStyle, ...style }}
        {...props}
      >
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';

// CardContent component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cardContentStyle: React.CSSProperties = {
  padding: '1.5rem',
  paddingTop: 0,
};

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 pt-0', className)}
        style={{ ...cardContentStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

// CardFooter component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '1.5rem',
  paddingTop: 0,
};

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        style={{ ...cardFooterStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

export default Card;

// import * as React from "react"

// import { cn } from "@/lib/utils"

// function Card({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card"
//       className={cn(
//         "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-header"
//       className={cn(
//         "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-title"
//       className={cn("leading-none font-semibold", className)}
//       {...props}
//     />
//   )
// }

// function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-description"
//       className={cn("text-muted-foreground text-sm", className)}
//       {...props}
//     />
//   )
// }

// function CardAction({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-action"
//       className={cn(
//         "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// function CardContent({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-content"
//       className={cn("px-6", className)}
//       {...props}
//     />
//   )
// }

// function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="card-footer"
//       className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
//       {...props}
//     />
//   )
// }

// export {
//   Card,
//   CardHeader,
//   CardFooter,
//   CardTitle,
//   CardAction,
//   CardDescription,
//   CardContent,
// }
