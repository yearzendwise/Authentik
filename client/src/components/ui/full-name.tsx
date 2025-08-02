import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FullNameProps {
  name?: string;
  firstNameValue?: string;
  lastNameValue?: string;
  onFirstNameChange?: (value: string) => void;
  onLastNameChange?: (value: string) => void;
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  showLabels?: boolean;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function FullName({
  name,
  firstNameValue = '',
  lastNameValue = '',
  onFirstNameChange,
  onLastNameChange,
  firstNamePlaceholder = "First Name",
  lastNamePlaceholder = "Last Name",
  showLabels = false,
  className,
  required = false,
  disabled = false,
  readonly = false,
  size = 'medium'
}: FullNameProps) {
  // Size-based styling
  const sizeClasses = {
    small: 'gap-2 text-sm',
    medium: 'gap-3',
    large: 'gap-4 text-lg'
  };

  const inputSizeClasses = {
    small: 'h-8 px-2 py-1',
    medium: 'h-10 px-3 py-2', 
    large: 'h-12 px-4 py-3'
  };

  return (
    <div className={cn("grid grid-cols-2", sizeClasses[size], className)}>
      <div>
        {showLabels && (
          <Label htmlFor={name ? `${name}_first` : "first-name"} className="text-sm font-medium">
            First Name {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Input
          id={name ? `${name}_first` : "first-name"}
          name={name ? `${name}_first` : "firstName"}
          placeholder={firstNamePlaceholder}
          value={firstNameValue}
          onChange={(e) => onFirstNameChange?.(e.target.value)}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          className={cn("focus:ring-2 focus:ring-blue-500 focus:border-transparent", inputSizeClasses[size])}
        />
      </div>
      <div>
        {showLabels && (
          <Label htmlFor={name ? `${name}_last` : "last-name"} className="text-sm font-medium">
            Last Name {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Input
          id={name ? `${name}_last` : "last-name"}
          name={name ? `${name}_last` : "lastName"}
          placeholder={lastNamePlaceholder}
          value={lastNameValue}
          onChange={(e) => onLastNameChange?.(e.target.value)}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          className={cn("focus:ring-2 focus:ring-blue-500 focus:border-transparent", inputSizeClasses[size])}
        />
      </div>
    </div>
  );
}

export default FullName;