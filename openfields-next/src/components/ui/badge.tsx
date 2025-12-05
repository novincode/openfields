import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0969da] text-white [a&]:hover:bg-[#0969da]/80",
        secondary: "border-transparent bg-[#ddf4ff] text-[#0969da] [a&]:hover:bg-[#b6e3ff] dark:bg-[#0969da]/20 dark:text-[#58a6ff]",
        destructive: "border-transparent bg-[#cf222e] text-white [a&]:hover:bg-[#cf222e]/80",
        outline: "text-foreground border-border",
        success: "border-transparent bg-[#1a7f37] text-white",
        warning: "border-transparent bg-[#bf8700] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
