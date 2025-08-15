import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm border",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:from-primary hover:to-primary/90 border-primary/20 hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-destructive/90 to-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 hover:from-destructive hover:to-destructive/90 border-destructive/20 hover:border-destructive/40 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-gradient-to-r from-secondary/60 to-secondary/40 text-secondary-foreground shadow-md hover:shadow-lg hover:from-secondary/70 hover:to-secondary/50 border-secondary/30 hover:border-secondary/50 hover:scale-[1.02] active:scale-[0.98]",
        ghost: 
          "hover:bg-accent/30 hover:text-accent-foreground backdrop-blur-sm border-transparent hover:border-accent/30 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline border-transparent hover:text-primary/80 transition-colors duration-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
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
