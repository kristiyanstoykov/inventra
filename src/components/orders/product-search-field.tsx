'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';
import debounce from 'lodash/debounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandDialog,
} from '@/components/ui/command';
import { FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { ChevronsUpDown, Trash2, Minus, Plus } from 'lucide-react';
import { searchProductsAction } from '@/lib/actions/products';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingSpinner } from '../LoadingSpinner';
import { ProductListCommandItem, ProductListCommandItemMobile } from './product-result-list';
import { Badge } from '../ui/badge';

// ----- Server return type -----
export type ProductFromServer = {
  id: number;
  name: string;
  sku: string | null;
  sn: string | null;
  price: string;
  salePrice: string | null;
  deliveryPrice: string | null;
  quantity: number | null;
  brandId: number | null;
  createdAt: Date | null;
  updatedAt: Date;
  categories: Record<number, string>;
  attributes: Record<number, string>;
};

// ----- Value stored in the form -----
export type OrderItem = { productId: number; quantity: number };

// ----- Internal render type -----
export type ProductLite = {
  id: number;
  name: string;
  sku?: string | null;
  sn?: string | null;
  price?: string | null;
  availableQty: number; // derived from quantity (null -> 0)
  categories?: Record<number, string>;
  attributes?: Record<number, string>;
};

function toLite(p: ProductFromServer): ProductLite {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    sn: p.sn,
    price: p.price ?? null,
    availableQty: Math.max(0, Number(p.quantity ?? 0)),
    categories: p.categories,
    attributes: p.attributes,
  };
}

type Props<TFieldValues extends FieldValues = FieldValues> = {
  control: Control<TFieldValues>;
  name?: FieldPath<TFieldValues>;
  label?: string;
  disabled?: boolean;
  className?: string;
  // Optional: if we need to override resolving prefilled ids, pass a function.
  // resolveProductsByIds?: (ids: number[]) => Promise<ProductFromServer[]>;
};

export const formatBadges = (rec?: Record<number, string>) =>
  rec ? Object.values(rec).slice(0, 3).join(' • ') : '';

export function SelectProductsField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label = 'Products',
  disabled,
  className,
}: // resolveProductsByIds = getProductsByIdsAction, // default to provided action
Props<TFieldValues>) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const fieldName = (name as FieldPath<TFieldValues>) || ('items' as FieldPath<TFieldValues>);

  const { field, fieldState } = useController<TFieldValues, any>({
    control,
    name: fieldName as any,
  });

  const value: OrderItem[] = Array.isArray(field.value) ? field.value : [];

  // cache: id -> ProductLite (for rendering)
  const [cache, setCache] = useState<Record<number, ProductLite>>({});
  const [results, setResults] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);

  // ---------- Search (Server Action) ----------
  const runSearch = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data: ProductFromServer[] = await searchProductsAction(query);
      const lite = (data ?? []).map(toLite);
      setResults(lite);
      // merge into cache
      setCache((prev) => {
        const next = { ...prev };
        for (const p of lite) next[p.id] = p;
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce(runSearch, 300), [runSearch]);
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // Resolve labels/stock for prefilled items (edit mode)
  useEffect(() => {
    (async () => {
      const missingIds = value.map((i) => i.productId).filter((id) => !cache[id]);
      if (!missingIds.length) return;
      const fresh = null;
      // const fresh = await resolveProductsByIds(missingIds);
      const lite = (fresh ?? []).map(toLite);
      setCache((prev) => {
        const next = { ...prev };
        for (const p of lite) next[p.id] = p;
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  // ---------- Helpers ----------
  const setItems = (next: OrderItem[]) => field.onChange(next);

  const clampQty = (pid: number, qty: number) => {
    const stock = cache[pid]?.availableQty ?? 0;
    if (stock <= 0) return 0;
    if (qty < 1) return 1;
    if (qty > stock) return stock;
    return qty;
  };

  const addProduct = (p: ProductLite) => {
    if ((p.availableQty ?? 0) <= 0) return; // block out-of-stock
    const idx = value.findIndex((i) => i.productId === p.id);
    if (idx >= 0) {
      const next = [...value];
      next[idx] = { ...next[idx], quantity: clampQty(p.id, next[idx].quantity + 1) };
      setItems(next);
    } else {
      setItems([...value, { productId: p.id, quantity: clampQty(p.id, 1) }]);
    }
    setCache((prev) => ({ ...prev, [p.id]: p }));
  };

  const removeProduct = (pid: number) => {
    setItems(value.filter((i) => i.productId !== pid));
  };

  const setQuantity = (pid: number, qty: number) => {
    const idx = value.findIndex((i) => i.productId === pid);
    if (idx < 0) return;
    const next = [...value];
    next[idx] = { ...next[idx], quantity: clampQty(pid, qty) };
    setItems(next);
  };

  const inc = (pid: number) => {
    const item = value.find((i) => i.productId === pid);
    if (!item) return;
    setQuantity(pid, item.quantity + 1);
  };

  const dec = (pid: number) => {
    const item = value.find((i) => i.productId === pid);
    if (!item) return;
    setQuantity(pid, item.quantity - 1);
  };

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className={cn('flex flex-col gap-2', className)}>
          <FormLabel>{label}</FormLabel>

          {/* Search + Selector */}
          {isMobile ? (
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setOpen(true)}
              >
                Search & add products
                <ChevronsUpDown className="opacity-50" />
              </Button>
              <CommandDialog open={open} onOpenChange={setOpen}>
                <Command>
                  <CommandInput
                    placeholder="Search by name, SKU, SN…"
                    onValueChange={(v) => debouncedSearch(v)}
                  />
                  <CommandList className="max-h-[70vh] overflow-auto">
                    {loading && (
                      <CommandEmpty>
                        <LoadingSpinner className="h-4 w-4 animate-spin" />
                      </CommandEmpty>
                    )}
                    {!loading && results.length === 0 && (
                      <CommandEmpty>No products found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {results.map((p) => {
                        const already = value.some((i) => i.productId === p.id);
                        const stock = p.availableQty;
                        const disabledRow = stock <= 0;
                        return (
                          <ProductListCommandItemMobile
                            key={p.id}
                            p={p}
                            already={already}
                            stock={stock}
                            disabledRow={disabledRow}
                            addProduct={addProduct}
                          />
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </CommandDialog>
            </div>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-[360px] justify-between"
                  >
                    Search & add products
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                className="w-[min(92vw,520px)] p-0 max-h-[70vh] overflow-auto"
              >
                <Command>
                  <CommandInput
                    placeholder="Search by name, SKU, SN…"
                    className="h-9"
                    onValueChange={(v) => debouncedSearch(v)}
                  />
                  <CommandList>
                    {loading && <CommandEmpty>Searching...</CommandEmpty>}
                    {!loading && results.length === 0 && (
                      <CommandEmpty>No products found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {results.map((p) => {
                        const already = value.some((i) => i.productId === p.id);
                        const stock = p.availableQty;
                        const disabledRow = stock <= 0;
                        return (
                          <ProductListCommandItem
                            key={p.id}
                            p={p}
                            already={already}
                            stock={stock}
                            disabledRow={disabledRow}
                            addProduct={addProduct}
                          />
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Selected list */}
          <div className="space-y-2">
            {value.length === 0 ? (
              <div className="text-sm text-muted-foreground">No products selected.</div>
            ) : (
              <>
                {value.map((item) => {
                  const p = cache[item.productId];
                  const stock = p?.availableQty ?? 0;

                  return (
                    <div
                      key={item.productId}
                      className="grid gap-2 rounded-md border p-2
             grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                    >
                      {/* Info */}
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {p?.name ?? `#${item.productId}`}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p?.sku ? `SKU: ${p.sku}` : null}
                          {p?.sku && p?.sn ? ' • ' : ''}
                          {p?.sn ? `SN: ${p.sn}` : null}
                          {p?.sku || p?.sn ? ' • ' : ''}Stock: {stock}
                          {p?.price ? ` • Price: ${p.price}` : ''}
                        </div>
                        {(p?.categories || p?.attributes) && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {p?.categories ? `Cat: ${formatBadges(p.categories)}` : null}
                            {p?.categories && p?.attributes ? ' • ' : ''}
                            {p?.attributes ? `Attr: ${formatBadges(p.attributes)}` : null}
                          </div>
                        )}
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 sm:justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => dec(item.productId)}
                          disabled={stock <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="w-16 text-center h-8"
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.productId, Number(e.target.value || 0))}
                          min={1}
                          max={stock > 0 ? stock : 1}
                          disabled={stock <= 0}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => inc(item.productId)}
                          disabled={stock <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* per-item total */}
                      <div className="text-sm font-medium sm:text-right">
                        {(Number(p?.price ?? 0) * item.quantity).toFixed(2)}
                      </div>

                      {/* remove */}
                      <div className="sm:text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeProduct(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* total for all items */}
                <div className="flex justify-end border-t pt-2 mt-2 font-semibold">
                  <Badge variant="outline" className="text-md">
                    Total:{' '}
                    {value
                      .reduce((sum, item) => {
                        const price = Number(cache[item.productId]?.price ?? 0);
                        return sum + price * item.quantity;
                      }, 0)
                      .toFixed(2)}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {fieldState.error && <FormMessage>{fieldState.error.message as any}</FormMessage>}
        </FormItem>
      )}
    />
  );
}
