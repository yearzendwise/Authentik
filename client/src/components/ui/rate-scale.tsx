import React from 'react';
import { cn } from '@/lib/utils';

interface RateScaleProps {
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
  disabled?: boolean;
  labels?: string[];
}

export function RateScale({
  min = 1,
  max = 5,
  value = 1,
  onChange,
  className,
  disabled = false,
  labels = []
}: RateScaleProps) {
  const handleRating = (rating: number) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {Array.from({ length: max - min + 1 }, (_, i) => {
        const rating = min + i;
        return (
          <div key={rating} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => handleRating(rating)}
              disabled={disabled}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-colors",
                "hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
                rating <= value
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-300 text-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {rating}
            </button>
            {labels[i] && (
              <span className="text-xs text-gray-500 mt-1">{labels[i]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RateScale;