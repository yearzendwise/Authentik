import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ContactSearchProps {
  onSearchChange: (search: string) => void;
  placeholder?: string;
}

const ContactSearchComponent = ({ onSearchChange, placeholder = "Search contacts..." }: ContactSearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  const onSearchChangeRef = useRef(onSearchChange);
  const searchValueRef = useRef(searchValue);
  
  console.log('ContactSearch rendered, searchValue:', searchValue); // Debug log

  // Update refs when values change
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    searchValueRef.current = searchValue;
  }, [searchValue]);

  // Debounce and notify parent component
  useEffect(() => {
    const timer = setTimeout(() => {
      // Use ref to get the latest value to avoid stale closures
      onSearchChangeRef.current(searchValueRef.current);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Search input change:', value); // Debug log
    setSearchValue(value);
  }, []);

  // Handle key down to prevent form submission on Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
      <Input
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-10"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
};

export const ContactSearch = memo(ContactSearchComponent);