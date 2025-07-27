import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface BooleanSwitchProps {
  value?: boolean
  onValueChange?: (value: boolean) => void
  disabled?: boolean
  name?: string
  required?: boolean
  className?: string
  variant?: "yes-no" | "true-false" | "on-off"
  showLabels?: boolean
}

const BooleanSwitch = React.forwardRef<HTMLDivElement, BooleanSwitchProps>(
  ({ 
    value = false,
    onValueChange,
    disabled = false,
    name,
    required = false,
    className,
    variant = "yes-no",
    showLabels = true,
    ...props 
  }, ref) => {
    const [checked, setChecked] = React.useState(value)

    React.useEffect(() => {
      setChecked(value)
    }, [value])

    const handleChange = (newValue: boolean) => {
      if (disabled) return
      setChecked(newValue)
      onValueChange?.(newValue)
    }

    const getLabels = () => {
      switch (variant) {
        case "true-false":
          return { positive: "True", negative: "False" }
        case "on-off":
          return { positive: "On", negative: "Off" }
        case "yes-no":
        default:
          return { positive: "Yes", negative: "No" }
      }
    }

    const labels = getLabels()

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-3", className)}
        {...props}
      >
        {showLabels && (
          <Label 
            className={cn(
              "text-sm font-medium transition-colors cursor-pointer select-none boolean-switch-label",
              "hover:text-foreground dark:hover:text-white",
              checked 
                ? "text-muted-foreground dark:text-slate-400 inactive" 
                : "text-foreground dark:text-white font-semibold"
            )}
            onClick={() => handleChange(false)}
          >
            {labels.negative}
          </Label>
        )}
        
        <Switch
          checked={checked}
          onCheckedChange={handleChange}
          disabled={disabled}
          aria-label={`Toggle between ${labels.negative} and ${labels.positive}`}
        />
        
        {showLabels && (
          <Label 
            className={cn(
              "text-sm font-medium transition-colors cursor-pointer select-none boolean-switch-label",
              "hover:text-foreground dark:hover:text-white",
              checked 
                ? "text-foreground dark:text-white font-semibold" 
                : "text-muted-foreground dark:text-slate-400 inactive"
            )}
            onClick={() => handleChange(true)}
          >
            {labels.positive}
          </Label>
        )}

        {name && (
          <input
            type="hidden"
            name={name}
            value={checked ? "true" : "false"}
            required={required}
          />
        )}
      </div>
    )
  }
)

BooleanSwitch.displayName = "BooleanSwitch"

export { BooleanSwitch }