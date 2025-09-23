'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';

export type OptionType = {
  id: number | string;
  name: string;
};

interface FancyMultiSelectProps {
  options: OptionType[];
  value: Array<OptionType['id']>; // selected IDs
  onChange: (value: Array<OptionType['id']>) => void;
  placeholder?: string;
}

export function FancyMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
}: FancyMultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const selectedOptions = options.filter((opt) => value.includes(opt.id));

  const handleUnselect = (id: OptionType['id']) => {
    onChange(value.filter((v) => v !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (!input) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') && input.value === '') {
      onChange(value.slice(0, -1)); // remove last selected
    }

    if (e.key === 'Escape') input.blur();
  };

  const selectables = options.filter((opt) => !value.includes(opt.id));

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.id} variant="secondary">
              {option.name}
              <button
                type="button"
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(option.id)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}

          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="relative mt-2">
        <CommandList>
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((option) => (
                  <CommandItem
                    key={option.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue('');
                      onChange([...value, option.id]);
                    }}
                    className="cursor-pointer"
                  >
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
