import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const headingVariants = cva('font-bold tracking-tight text-foreground', {
  variants: {
    size: {
      h1: 'text-3xl md:text-4xl lg:text-5xl',
      h2: 'text-2xl md:text-3xl lg:text-4xl',
      h3: 'text-xl md:text-2xl',
      h4: 'text-lg md:text-xl',
      h5: 'text-md md:text-lg',
      h6: 'text-base sm:text-md',
    },
  },
  defaultVariants: {
    size: 'h2',
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  asChild?: boolean;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size = 'h2', asChild = false, ...props }, ref) => {
    const semanticTag = size; // e.g. 'h1', 'h2', ...
    const Comp = asChild ? Slot : semanticTag;

    return <Comp className={cn(headingVariants({ size, className }))} ref={ref} {...props} />;
  }
);

Heading.displayName = 'Heading';

export { Heading, headingVariants };
