import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RateScaleProps {
  value?: number
  onValueChange?: (value: number) => void
  max?: number
  min?: number
  disabled?: boolean
  name?: string
  required?: boolean
  className?: string
  showNumbers?: boolean
  variant?: "stars" | "numbers" | "faces"
}

const RateScale = React.forwardRef<HTMLDivElement, RateScaleProps>(
  ({ 
    value,
    onValueChange,
    max = 10,
    min = 1,
    disabled = false,
    name,
    required = false,
    className,
    showNumbers = true,
    variant = "numbers",
    ...props 
  }, ref) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null)
    const [selectedValue, setSelectedValue] = React.useState(value || 0)

    React.useEffect(() => {
      setSelectedValue(value || 0)
    }, [value])

    const handleClick = (rating: number) => {
      if (disabled) return
      setSelectedValue(rating)
      onValueChange?.(rating)
    }

    const handleMouseEnter = (rating: number) => {
      if (disabled) return
      setHoverValue(rating)
    }

    const handleMouseLeave = () => {
      setHoverValue(null)
    }

    const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min)

    // Face emoji mapping for different rating values
    const getFaceEmoji = (rating: number, isActive: boolean, isHovered: boolean) => {
      // Comprehensive 1-10 emoji mapping for more accurate representation
      const emojiMap: { [key: number]: { base: string; active: string } } = {
        1: { base: "😭", active: "💔" },
        2: { base: "😢", active: "😰" },
        3: { base: "😟", active: "😔" },
        4: { base: "😕", active: "😒" },
        5: { base: "😐", active: "😑" },
        6: { base: "🙂", active: "😊" },
        7: { base: "😊", active: "😄" },
        8: { base: "😃", active: "🤗" },
        9: { base: "😍", active: "🤩" },
        10: { base: "🤩", active: "🎉" }
      }
      
      // For ratings outside 1-10, calculate position-based emoji
      if (rating < 1 || rating > 10 || !emojiMap[rating]) {
        const totalRange = max - min + 1
        const position = (rating - min) / (totalRange - 1)
        
        let baseEmoji = "😐"
        if (position <= 0.1) baseEmoji = "😭"
        else if (position <= 0.2) baseEmoji = "😢"
        else if (position <= 0.3) baseEmoji = "😟"
        else if (position <= 0.4) baseEmoji = "😕"
        else if (position <= 0.5) baseEmoji = "😐"
        else if (position <= 0.6) baseEmoji = "🙂"
        else if (position <= 0.7) baseEmoji = "😊"
        else if (position <= 0.8) baseEmoji = "😃"
        else if (position <= 0.9) baseEmoji = "😍"
        else baseEmoji = "🤩"
        
        // Show alternate emoji on hover or active
        if (isActive || isHovered) {
          if (position <= 0.1) return "💔"
          else if (position <= 0.2) return "😰"
          else if (position <= 0.3) return "😔"
          else if (position <= 0.4) return "😒"
          else if (position <= 0.5) return "😑"
          else if (position <= 0.6) return "😊"
          else if (position <= 0.7) return "😄"
          else if (position <= 0.8) return "🤗"
          else if (position <= 0.9) return "🤩"
          else return "🎉"
        }
        
        return baseEmoji
      }
      
      // Use specific emoji for 1-10 ratings
      const emoji = emojiMap[rating]
      return (isActive || isHovered) ? emoji.active : emoji.base
    }

    if (variant === "stars") {
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-center gap-1", className)}
          {...props}
        >
          {numbers.slice(0, Math.min(10, numbers.length)).map((rating) => {
            const isActive = (hoverValue ?? selectedValue) >= rating
            return (
              <button
                key={rating}
                type="button"
                disabled={disabled}
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "p-1 rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:scale-110 active:scale-95"
                )}
                aria-label={`Rate ${rating} out of ${max}`}
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isActive
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-400"
                  )}
                />
              </button>
            )
          })}
          {showNumbers && (
            <span className="ml-2 text-sm text-muted-foreground">
              {selectedValue > 0 ? `${selectedValue}/${max}` : `0/${max}`}
            </span>
          )}
          {name && (
            <input
              type="hidden"
              name={name}
              value={selectedValue}
              required={required}
            />
          )}
        </div>
      )
    }

    if (variant === "faces") {
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-center gap-2 flex-wrap", className)}
          {...props}
        >
          {numbers.map((rating) => {
            const isActive = selectedValue === rating
            const isHovered = hoverValue === rating
            return (
              <button
                key={rating}
                type="button"
                disabled={disabled}
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "w-12 h-12 rounded-full border-2 text-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center",
                  isActive
                    ? "bg-primary/10 border-primary shadow-md scale-110"
                    : isHovered
                    ? "bg-primary/5 border-primary/50 scale-105"
                    : "border-muted-foreground/20 hover:border-primary/30",
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer active:scale-95"
                )}
                aria-label={`Rate ${rating} out of ${max}`}
              >
                <span className="select-none">
                  {getFaceEmoji(rating, isActive, isHovered)}
                </span>
              </button>
            )
          })}
          {showNumbers && (
            <span className="ml-2 text-sm text-muted-foreground">
              {selectedValue > 0 ? `${selectedValue}/${max}` : `0/${max}`}
            </span>
          )}
          {name && (
            <input
              type="hidden"
              name={name}
              value={selectedValue}
              required={required}
            />
          )}
        </div>
      )
    }

    // Default numbers variant
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2 flex-wrap", className)}
        {...props}
      >
        {numbers.map((rating) => {
          const isActive = selectedValue === rating
          const isHovered = hoverValue === rating
          return (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : isHovered
                  ? "bg-primary/10 border-primary text-primary scale-110"
                  : "border-muted-foreground/20 text-muted-foreground hover:border-primary/50 hover:text-primary hover:scale-105",
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer active:scale-95"
              )}
              aria-label={`Rate ${rating} out of ${max}`}
            >
              {rating}
            </button>
          )
        })}
        {name && (
          <input
            type="hidden"
            name={name}
            value={selectedValue}
            required={required}
          />
        )}
      </div>
    )
  }
)

RateScale.displayName = "RateScale"

export { RateScale }