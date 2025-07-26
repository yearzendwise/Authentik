interface ThemedFullNameProps {
  name: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  className?: string;
  themeStyles: {
    input: string;
    label: string;
  };
  onChange?: (firstName: string, lastName: string) => void;
}

export function ThemedFullName({
  name,
  required = false,
  disabled = false,
  readonly = false,
  firstNamePlaceholder = "First Name",
  lastNamePlaceholder = "Last Name",
  className = "",
  themeStyles,
  onChange
}: ThemedFullNameProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <input
          id={`${name}-first`}
          name={`${name}-first`}
          type="text"
          placeholder={firstNamePlaceholder}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          className={`${themeStyles.input} ${className}`}
          onChange={(e) => onChange?.(e.target.value, (document.getElementById(`${name}-last`) as HTMLInputElement)?.value || '')}
        />
      </div>
      <div>
        <input
          id={`${name}-last`}
          name={`${name}-last`}
          type="text"
          placeholder={lastNamePlaceholder}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          className={`${themeStyles.input} ${className}`}
          onChange={(e) => onChange?.((document.getElementById(`${name}-first`) as HTMLInputElement)?.value || '', e.target.value)}
        />
      </div>
    </div>
  );
}