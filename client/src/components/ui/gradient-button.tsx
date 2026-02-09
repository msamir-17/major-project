import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gradientButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105",
  {
    variants: {
      variant: {
        primary: "gradient-primary text-primary-foreground shadow-medium hover:shadow-strong",
        hero: "gradient-hero text-primary-foreground shadow-medium hover:shadow-strong",
        outline: "border-2 border-primary bg-transparent text-primary hover:gradient-primary hover:text-primary-foreground",
        ghost: "text-primary hover:bg-primary/10 hover:text-primary",
        accent: "bg-accent text-accent-foreground shadow-soft hover:bg-accent-soft hover:shadow-medium"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-8 py-2",
        lg: "h-14 px-12 py-3 text-base",
        xl: "h-16 px-16 py-4 text-lg"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };