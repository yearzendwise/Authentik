import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface NumberInputProps {
  value?: string | number
  onChange?: (value: string) => void
  variant?: "number" | "phone" | "currency"
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  min?: number
  max?: number
  className?: string
  tabIndex?: number
  readOnly?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    value,
    onChange,
    variant = "number",
    placeholder,
    disabled = false,
    required = false,
    name,
    min,
    max,
    className,
    tabIndex,
    readOnly,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value?.toString() || "")

    React.useEffect(() => {
      setDisplayValue(value?.toString() || "")
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
          // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true)) {
        return
      }
      
      // For phone numbers, limit to 10 digits
      if (variant === 'phone') {
        const currentDigits = displayValue.replace(/\D/g, '')
        if (currentDigits.length >= 10 && e.key.match(/[0-9]/)) {
          e.preventDefault()
        }
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      let processedValue = inputValue

      if (variant === 'phone') {
        // Extract only digits for phone
        const digitsOnly = inputValue.replace(/\D/g, '')
        processedValue = formatPhoneNumber(digitsOnly)
      } else if (variant === 'currency') {
        // Extract digits and decimal for currency
        const numericOnly = inputValue.replace(/[^0-9\.]/g, '')
        processedValue = formatCurrency(numericOnly)
      } else {
        // Default number input - allow digits, decimal point, and negative sign
        processedValue = inputValue.replace(/[^0-9\.\-]/g, '')
      }

      setDisplayValue(processedValue)
      onChange?.(processedValue)
    }

    const formatPhoneNumber = (digits: string) => {
      if (digits.length === 0) return ''
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }

    const formatCurrency = (value: string) => {
      if (!value) return ''
      // Remove existing $ and format
      const numValue = value.replace(/\$/g, '')
      if (numValue === '') return '$'
      
      // Handle decimal places
      const parts = numValue.split('.')
      if (parts.length > 2) {
        // More than one decimal point, keep only first
        return `$${parts[0]}.${parts[1]}`
      }
      
      if (parts.length === 2 && parts[1].length > 2) {
        // Limit to 2 decimal places
        return `$${parts[0]}.${parts[1].slice(0, 2)}`
      }
      
      return `$${numValue}`
    }

    const handleBlur = () => {
      if (variant === 'currency' && displayValue && !displayValue.includes('.')) {
        // Add .00 to currency if no decimal
        const formatted = displayValue + '.00'
        setDisplayValue(formatted)
        onChange?.(formatted)
      }
    }

    const getInputType = () => {
      switch (variant) {
        case 'phone':
          return 'tel'
        case 'currency':
        case 'number':
        default:
          return 'text' // Use text to allow custom formatting
      }
    }

    const getPlaceholder = () => {
      if (placeholder) return placeholder
      
      switch (variant) {
        case 'phone':
          return '(123) 456-7890'
        case 'currency':
          return '$0.00'
        case 'number':
        default:
          return 'Enter number...'
      }
    }

    return (
      <Input
        ref={ref}
        type={getInputType()}
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        disabled={disabled}
        required={required}
        name={name}
        min={variant === 'number' ? min : undefined}
        max={variant === 'number' ? max : undefined}
        className={cn(className)}
        tabIndex={tabIndex}
        readOnly={readOnly}
        {...props}
      />
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }