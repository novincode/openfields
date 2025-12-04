import * as React from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface AsyncComboboxProps {
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Current value (string for single, string[] for multiple) */
  value?: string | string[];
  /** Callback when value changes */
  onChange?: (value: string | string[]) => void;
  /** Static options (used if fetchOptions is not provided) */
  options?: ComboboxOption[];
  /** Async function to fetch options based on search query */
  fetchOptions?: (search: string) => Promise<ComboboxOption[]>;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Allow clearing the selection */
  clearable?: boolean;
  /** Debounce delay for search in ms */
  debounceMs?: number;
  /** Minimum characters before searching */
  minSearchLength?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Empty state text */
  emptyText?: string;
  /** Loading text */
  loadingText?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Whether to show search input */
  searchable?: boolean;
}

/**
 * AsyncCombobox - A searchable select component with async loading support.
 * 
 * Can be used for:
 * - Static options (pass `options` prop)
 * - Async search (pass `fetchOptions` prop)
 * - Single or multiple selection
 */
export function AsyncCombobox({
  placeholder = "Select...",
  value,
  onChange,
  options: staticOptions,
  fetchOptions,
  multiple = false,
  clearable = true,
  debounceMs = 300,
  minSearchLength = 2,
  disabled = false,
  className,
  emptyText = "No results found.",
  loadingText = "Loading...",
  searchPlaceholder = "Search...",
  searchable = true,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<ComboboxOption[]>(staticOptions || []);

  // Normalize value to array for easier handling
  const selectedValues = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Debounced search handler
  const searchTimeout = React.useRef<NodeJS.Timeout>();
  
  React.useEffect(() => {
    // If using static options, filter locally
    if (staticOptions && !fetchOptions) {
      if (!search) {
        setOptions(staticOptions);
      } else {
        const filtered = staticOptions.filter(opt =>
          opt.label.toLowerCase().includes(search.toLowerCase())
        );
        setOptions(filtered);
      }
      return;
    }

    // If using async fetch
    if (fetchOptions) {
      if (search.length < minSearchLength) {
        setOptions([]);
        return;
      }

      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await fetchOptions(search);
          setOptions(results);
        } catch (error) {
          console.error("Failed to fetch options:", error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    }

    return () => clearTimeout(searchTimeout.current);
  }, [search, staticOptions, fetchOptions, minSearchLength, debounceMs]);

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setOpen(false);
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : "");
  };

  // Handle remove single item in multiple mode
  const handleRemove = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    if (multiple) {
      onChange?.(selectedValues.filter(v => v !== optionValue));
    }
  };

  // Get label for a value
  const getLabel = (val: string): string => {
    const allOptions = [...options, ...(staticOptions || [])];
    const option = allOptions.find(o => o.value === val);
    return option?.label || val;
  };

  // Render trigger content
  const renderTriggerContent = () => {
    if (selectedValues.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    if (multiple) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map(val => (
            <Badge key={val} variant="secondary" className="pr-1">
              {getLabel(val)}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted"
                onClick={(e) => handleRemove(e, val)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      );
    }

    return <span>{getLabel(selectedValues[0]!)}</span>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            multiple && selectedValues.length > 0 && "h-auto min-h-10",
            className
          )}
        >
          {renderTriggerContent()}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {clearable && selectedValues.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          {searchable && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
          )}
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {loadingText}
              </div>
            )}
            {!loading && options.length === 0 && (
              <CommandEmpty>
                {fetchOptions && search.length < minSearchLength
                  ? `Type at least ${minSearchLength} characters to search...`
                  : emptyText}
              </CommandEmpty>
            )}
            {!loading && options.length > 0 && (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value || '')}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
