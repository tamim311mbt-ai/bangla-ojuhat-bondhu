import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.94] active:duration-100 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-gradient-cta text-white animate-glow rounded-2xl border border-white/25 font-bold shadow-glow hover:scale-[1.02] hover:brightness-105 active:scale-[0.96]",
        soft: "border border-slate-200/90 bg-white/80 text-slate-800 rounded-xl font-semibold shadow-xs hover:bg-slate-100/90 hover:border-slate-300 active:scale-[0.95] dark:border-white/12 dark:bg-white/8 dark:text-slate-100 dark:hover:bg-white/14",
        teal: "bg-teal text-white rounded-xl font-semibold shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.95] dark:text-slate-950",
        whatsapp:
          "bg-whatsapp text-white rounded-xl font-semibold shadow-xs hover:brightness-105 hover:shadow-md active:scale-[0.95]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xl: "h-16 px-8 text-lg",
        action: "h-12 px-4 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
