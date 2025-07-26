import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FullNameProps {
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
}

export function FullName({
  firstNameValue = '',
  lastNameValue = '',
  onFirstNameChange,
  onLastNameChange,
  firstNamePlaceholder = "First Name",
  lastNamePlaceholder = "Last Name",
  showLabels = false,
  className,
  required = false,
  disabled = false
}: FullNameProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <div>
        {showLabels && (
          <Label htmlFor="first-name" className="text-sm font-medium">
            First Name {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Input
          id="first-name"
          placeholder={firstNamePlaceholder}
          value={firstNameValue}
          onChange={(e) => onFirstNameChange?.(e.target.value)}
          required={required}
          disabled={disabled}
        />
      </div>
      <div>
        {showLabels && (
          <Label htmlFor="last-name" className="text-sm font-medium">
            Last Name {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Input
          id="last-name"
          placeholder={lastNamePlaceholder}
          value={lastNameValue}
          onChange={(e) => onLastNameChange?.(e.target.value)}
          required={required}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default FullName;