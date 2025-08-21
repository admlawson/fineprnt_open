import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-medium focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover hover:shadow-medium active:bg-primary-active hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive-hover hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
        outline: "border border-input-border bg-surface-glass backdrop-blur-glass text-foreground shadow-soft hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-secondary-glass backdrop-blur-sm text-secondary-foreground shadow-soft hover:bg-secondary-hover hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-soft hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover transition-colors",
        glass: "bg-glass backdrop-blur-glass border border-glass-border text-foreground shadow-glass hover:bg-glass-hover hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
