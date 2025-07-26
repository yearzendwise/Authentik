import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ThemedFullNameProps {
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  onChange?: (value: { firstName: string; lastName: string }) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ThemedFullName({
  firstNamePlaceholder = "First Name",
  lastNamePlaceholder = "Last Name",
  onChange,
  className,
  required = false,
  disabled = false
}: ThemedFullNameProps) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  const handleChange = (field: 'firstName' | 'lastName', value: string) => {
    if (field === 'firstName') {
      setFirstName(value);
      onChange?.({ firstName: value, lastName });
    } else {
      setLastName(value);
      onChange?.({ firstName, lastName: value });
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <Input
        placeholder={firstNamePlaceholder}
        value={firstName}
        onChange={(e) => handleChange('firstName', e.target.value)}
        required={required}
        disabled={disabled}
      />
      <Input
        placeholder={lastNamePlaceholder}
        value={lastName}
        onChange={(e) => handleChange('lastName', e.target.value)}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

export default ThemedFullName;