'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog, // ⬅️ add
} from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getUsersByNameAction, getUsersBySearch } from '@/lib/actions/users';
import { useIsMobile } from '@/hooks/use-mobile'; // ⬅️ add

type Client = { id: number; name: string };

type Props<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  name?: FieldPath<TFieldValues>;
  label?: string;
  disabled?: boolean;
  buttonClassName?: string;
  initialClient?: Client | null;
};

export function ClientComboBox<TFieldValues extends FieldValues = FieldValues>({
  form,
  name,
  label = 'Client',
  disabled,
  buttonClassName,
  initialClient,
}: Props<TFieldValues>) {
  const isMobile = useIsMobile(); // ⬅️ decide UI
  const fieldName = (name as FieldPath<TFieldValues>) || ('clientId' as FieldPath<TFieldValues>);
  const selectedId = form.watch(fieldName) as unknown as number | undefined;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Seed from initialClient (edit mode)
  React.useEffect(() => {
    if (!initialClient) return;

    setClients((prev) => {
      const without = prev.filter((c) => c.id !== initialClient.id);
      return [initialClient, ...without];
    });

    if (!selectedId) {
      form.setValue(fieldName, initialClient.id as never, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClient?.id, initialClient?.name]);

  // Debounce query
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Search
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const q = debouncedQuery.trim();

      if (q.length < 2) {
        // keep only selected/initial
        setClients((prev) => {
          const keepIds = new Set<number>();
          if (selectedId) keepIds.add(selectedId);
          if (initialClient) keepIds.add(initialClient.id);
          return prev.filter((c) => keepIds.has(c.id));
        });
        return;
      }

      setLoading(true);
      try {
        const data = await getUsersBySearch(q);
        if (!cancelled) {
          let list = data;
          const pins: Client[] = [];
          if (selectedId) {
            const sel = clients.find((c) => c.id === selectedId) || initialClient || null;
            if (sel && !list.some((c) => c.id === sel.id)) pins.push(sel);
          } else if (initialClient && !list.some((c) => c.id === initialClient.id)) {
            pins.push(initialClient);
          }
          if (pins.length) list = [...pins, ...list];
          setClients(list);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load clients');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const selectedClient =
    (selectedId && clients.find((c) => c.id === selectedId)) ||
    (initialClient && selectedId === initialClient.id ? initialClient : undefined);

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      className={cn(
        'w-full justify-between',
        buttonClassName,
        !selectedClient && 'text-muted-foreground'
      )}
      disabled={disabled}
      onClick={() => setOpen(true)}
    >
      {selectedClient ? selectedClient.name : 'Select client'}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  );

  const listContent = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search client..."
        className="h-9"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{loading ? 'Loading…' : 'No clients found.'}</CommandEmpty>
        <CommandGroup>
          {clients.map((client) => (
            <CommandItem
              key={client.id}
              value={client.name}
              onSelect={() => {
                form.setValue(fieldName, client.id as never, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                setOpen(false);
              }}
            >
              {client.name}
              <Check
                className={cn('ml-auto', client.id === selectedId ? 'opacity-100' : 'opacity-0')}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>

          {isMobile ? (
            <>
              <FormControl>{triggerButton}</FormControl>
              <CommandDialog open={open} onOpenChange={setOpen}>
                {listContent}
              </CommandDialog>
            </>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>{triggerButton}</FormControl>
              </PopoverTrigger>
              <PopoverContent className="md:min-w-[350px] p-0 min-w-[260px]">
                {listContent}
              </PopoverContent>
            </Popover>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
