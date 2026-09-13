import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-[var(--accent)] bg-[var(--accent)] px-4 text-white hover:opacity-90",
        outline: "border border-[var(--line)] bg-transparent px-4 text-[var(--foreground)] hover:border-[var(--foreground)]",
        ghost: "px-3 text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--foreground)]",
        destructive: "border border-red-700 bg-red-700 px-4 text-white hover:bg-red-800"
      },
      size: {
        default: "h-10",
        sm: "h-9 min-h-9 px-3",
        lg: "h-11 min-h-11 px-5",
        icon: "h-10 w-10 min-h-10 px-0"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
