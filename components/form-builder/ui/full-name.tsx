import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FullNameProps {
  name: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function FullName({
  name,
  required = false,
  disabled = false,
  readonly = false,
  firstNamePlaceholder = "First Name",
  lastNamePlaceholder = "Last Name",
  className = "",
  size = 'medium'
}: FullNameProps) {
  const sizeClasses = {
    small: 'text-sm py-1.5',
    medium: 'text-sm py-2',
    large: 'text-base py-3'
  };

  const inputClasses = `${sizeClasses[size]} ${className}`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor={`${name}-first`} className="sr-only">
          First Name {required && '*'}
        </Label>
        <Input
          id={`${name}-first`}
          name={`${name}-first`}
          type="text"
          placeholder={firstNamePlaceholder}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          className={inputClasses}
        />
      </div>
      <div>
        <Label htmlFor={`${name}-last`} className="sr-only">
          Last Name {required && '*'}
        </Label>
        <Input
          id={`${name}-last`}
          name={`${name}-last`}
          type="text"
          placeholder={lastNamePlaceholder}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          className={inputClasses}
        />
      </div>
    </div>
  );
}