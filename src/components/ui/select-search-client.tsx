'use client';

import * as React from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Control, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import debounce from 'lodash/debounce';
import { getUsersByNameAction } from '@/lib/actions/users';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ClientLite = { id: number; name: string };

type ResolveLabelFn = (id: number) => Promise<string | null>;

type Props<TFieldValues extends FieldValues = FieldValues> = {
  control: Control<TFieldValues>;
  name?: FieldPath<TFieldValues>; // defaults to "clientId"
  label?: string; // defaults to "Client"
  disabled?: boolean;
  buttonClassName?: string;
  // Optional: provide a resolver to show the label when editing with a prefilled id
  resolveLabel?: ResolveLabelFn;
};

export function SelectSearchClient<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label = 'Client',
  disabled,
  buttonClassName,
  resolveLabel,
}: Props<TFieldValues>) {
  const fieldName = (name as string) || ('clientId' as FieldPath<TFieldValues>);

  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');

  // Watch current field value so the trigger can reflect the picked item
  const currentId = useWatch({ control, name: fieldName }) as unknown as number | undefined;

  const runSearch = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) {
      setClients([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getUsersByNameAction(q); // returns [{ id, name }]
      setClients(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce(runSearch, 300), [runSearch]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Resolve label for prefilled value in edit mode (optional)
  useEffect(() => {
    (async () => {
      if (!currentId || selectedName) return;

      // Try to get from the current list first
      const inList = clients.find((c) => c.id === currentId)?.name;
      if (inList) {
        setSelectedName(inList);
        return;
      }

      if (resolveLabel) {
        const name = await resolveLabel(currentId);
        if (name) setSelectedName(name);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, clients, resolveLabel]);

  const triggerLabel =
    selectedName ||
    (currentId ? clients.find((c) => c.id === currentId)?.name : '') ||
    'Select client';

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    'w-[250px] justify-between',
                    !field.value && 'text-muted-foreground',
                    buttonClassName
                  )}
                >
                  {triggerLabel}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>

            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search client..."
                  className="h-9"
                  onValueChange={(value) => debouncedSearch(value)}
                />
                <CommandList>
                  {loading && <CommandEmpty>Searching...</CommandEmpty>}
                  {!loading && clients.length === 0 && (
                    <CommandEmpty>No client found.</CommandEmpty>
                  )}
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.name}
                        onSelect={() => {
                          // react-hook-form expects to set the raw value
                          field.onChange(client.id);
                          setSelectedName(client.name);
                        }}
                      >
                        {client.name}
                        <Check
                          className={cn(
                            'ml-auto',
                            client.id === currentId ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
