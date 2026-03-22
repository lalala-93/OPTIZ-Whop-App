import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E80000]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-gray-3 border border-gray-5/40 text-gray-12 hover:bg-gray-4 hover:border-gray-5/60",
        brand: "optiz-gradient-bg text-white shadow-lg shadow-[#E80000]/20 hover:shadow-[#E80000]/30 hover:brightness-110 border-0",
        destructive: "bg-[#E80000] text-white shadow-sm hover:bg-[#E80000]/90",
        outline: "border border-gray-5/40 bg-transparent text-gray-11 hover:bg-gray-3/50 hover:text-gray-12",
        secondary: "bg-gray-3/60 border border-gray-5/30 text-gray-11 shadow-sm hover:bg-gray-4/60",
        ghost: "text-gray-11 hover:bg-gray-3/50 hover:text-gray-12",
        link: "text-[#E80000] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-[15px] font-semibold",
        icon: "h-9 w-9 rounded-full",
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
