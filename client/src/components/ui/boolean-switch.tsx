import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BooleanSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function BooleanSwitch({
  checked = false,
  onCheckedChange,
  label,
  description,
  className,
  disabled = false
}: BooleanSwitchProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        id="boolean-switch"
      />
      <div className="grid gap-1.5 leading-none">
        {label && (
          <Label
            htmlFor="boolean-switch"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </Label>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default BooleanSwitch;