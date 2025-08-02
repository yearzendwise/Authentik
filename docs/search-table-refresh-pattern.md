# Search and Table Refresh Pattern Guide

## Problem Statement
When implementing search functionality with React Query, the entire page may refresh during searches if the query key includes search parameters. This creates a poor user experience with visible flashing and loss of UI state.

## Solution Overview
Use a **stable query key** pattern with React Query, storing search parameters in a ref and manually triggering refetch with debouncing.

## Implementation Pattern

### ❌ Wrong Approach - Causes Full Page Refresh
```typescript
// DON'T DO THIS - Query key changes trigger full re-render
const { data } = useQuery({
  queryKey: ['/api/contacts', { search: searchQuery, status: statusFilter }], // ❌ Dynamic key
  queryFn: async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    return apiRequest('GET', `/api/contacts?${params}`);
  }
});
```

### ✅ Correct Approach - Table-Only Refresh
```typescript
// 1. Import useRef
import { useState, useEffect, useRef } from "react";

// 2. Create refs to store search parameters
const searchParamsRef = useRef({
  search: "",
  status: "all",
  // other filters...
});

// 3. Use stable query key (no search params in key)
const { data, isFetching, refetch } = useQuery({
  queryKey: ['/api/contacts'], // ✅ Stable key
  queryFn: async () => {
    const params = new URLSearchParams();
    const currentParams = searchParamsRef.current;
    
    if (currentParams.search) params.append('search', currentParams.search);
    if (currentParams.status !== 'all') params.append('status', currentParams.status);
    
    return apiRequest('GET', `/api/contacts?${params}`);
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchInterval: false,
});

// 4. Debounced search effect
useEffect(() => {
  const timer = setTimeout(() => {
    searchParamsRef.current = {
      search: searchQuery,
      status: statusFilter,
      // update other filters...
    };
    refetch(); // Manually trigger refetch
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [searchQuery, statusFilter, refetch]);
```

## Key Components

### 1. Controlled Search Input Component
```typescript
interface SearchProps {
  value: string;
  onSearchChange: (search: string) => void;
  placeholder?: string;
}

const SearchComponent = ({ value, onSearchChange, placeholder }: SearchProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};
```

### 2. Parent Component State Management
```typescript
const [searchQuery, setSearchQuery] = useState("");

const handleSearchChange = useCallback((search: string) => {
  setSearchQuery(search);
}, []);

// Usage
<SearchComponent 
  value={searchQuery}
  onSearchChange={handleSearchChange}
  placeholder="Search..."
/>
```

## Visual Loading States
Show loading indicator without blocking the UI:
```typescript
{isFetching && (
  <div className="absolute right-4 top-4 z-10">
    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
      <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
      Searching...
    </div>
  </div>
)}

{/* Table with smooth transition */}
<div className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
  <Table>
    {/* Table content */}
  </Table>
</div>
```

## Benefits of This Pattern

1. **No Full Page Refresh**: Only the table data updates
2. **Preserved UI State**: Search input, filters, and scroll position remain intact
3. **Better Performance**: React Query cache is maintained with stable key
4. **Smooth UX**: Visual feedback during search without blocking interaction
5. **Debounced Requests**: Reduces API calls while typing

## Common Pitfalls to Avoid

1. **Don't include dynamic values in query keys** - This causes React Query to treat it as a new query
2. **Don't forget to initialize the ref** - Set initial values to prevent undefined errors
3. **Don't use controlled components without value prop** - This can cause input to lose focus
4. **Don't forget debouncing** - Without it, you'll make too many API calls

## When to Use This Pattern

Use this pattern when you need:
- Real-time search without page refresh
- Multiple filters that update table data
- Smooth user experience with loading states
- Preserved UI state during data fetching

## Reference Implementation
See `client/src/pages/users.tsx` for a complete working example of this pattern.