import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const orderBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',

        // 🔹 New order status variants
        pending:
          'border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        completed:
          'border-green-600 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        cancelled:
          'border-red-600 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      },
      size: {
        sm: 'text-xs [&>svg]:size-3 px-2 py-0.5',
        md: 'text-sm [&>svg]:size-4 px-3 py-1',
        lg: 'text-base [&>svg]:size-5 px-4 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

function OrderBadge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof orderBadgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(orderBadgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { OrderBadge, orderBadgeVariants };
