"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@lila/ui";
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
import { searchIngredients } from "@/app/admin/products/actions";
// Local debounce implementation used below

// Simple debounce hook implementation inline if not verified existing
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Ingredient {
  ingredient_slug: string;
  name: string;
}

interface MultiSelectIngredientsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelectIngredients({
  value = [],
  onChange,
}: MultiSelectIngredientsProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<Ingredient[]>([]);
  const [loading, setLoading] = React.useState(false);

  const debouncedQuery = useDebounceValue(query, 300);

  React.useEffect(() => {
    async function fetchIngredients() {
      setLoading(true);
      const results = await searchIngredients(debouncedQuery);
      setOptions(results || []);
      setLoading(false);
    }

    fetchIngredients();
  }, [debouncedQuery]);

  const handleSelect = (ingredientName: string) => {
    if (value.includes(ingredientName)) {
      onChange(value.filter((i) => i !== ingredientName));
    } else {
      onChange([...value, ingredientName]);
    }
  };

  const handleRemove = (ingredientName: string) => {
    onChange(value.filter((i) => i !== ingredientName));
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0
              ? `${value.length} selected`
              : "Select ingredients..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search ingredients..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {!loading && options.length === 0 && query.length >= 2 && (
                <CommandEmpty>No ingredients found.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((ingredient) => (
                  <CommandItem
                    key={ingredient.ingredient_slug}
                    value={ingredient.name}
                    onSelect={() => handleSelect(ingredient.name)}
                  >
                    <div
                      className={cn(
                        "mr-2 h-4 w-4 flex items-center justify-center rounded-sm border border-primary",
                        value.includes(ingredient.name)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    {ingredient.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="px-2 py-1 gap-1">
            {item}
            <button
              type="button" // Prevent form submission
              className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
              onClick={() => handleRemove(item)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {item}</span>
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
