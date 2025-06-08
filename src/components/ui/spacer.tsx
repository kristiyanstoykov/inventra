import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const spacerVariants = cva('', {
  variants: {
    size: {
      xs: 'h-2',
      sm: 'h-4',
      md: 'h-8',
      lg: 'h-16',
      xl: 'h-24',
      '2xl': 'h-32',
      full: 'h-full',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface SpacerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacerVariants> {
  asChild?: boolean;
}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return <Comp className={cn(spacerVariants({ size, className }))} ref={ref} {...props} />;
  }
);

Spacer.displayName = 'Spacer';

export { Spacer, spacerVariants };
