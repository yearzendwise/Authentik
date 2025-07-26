import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      "data-[state=checked]:border-primary data-[state=unchecked]:border-border",
      // Enhanced dark mode styling for better visibility
      "dark:data-[state=unchecked]:bg-slate-700 dark:data-[state=unchecked]:border-slate-600",
      "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 sm:h-5 sm:w-5 rounded-full shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-4 sm:data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        // Enhanced thumb styling for better contrast
        "bg-white data-[state=checked]:bg-white",
        "dark:bg-white dark:data-[state=checked]:bg-white",
        "shadow-md dark:shadow-lg"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
