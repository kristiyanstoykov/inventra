import { cn } from '@/lib/utils';
import { CommandItem } from '../ui/command';
import { formatBadges, ProductLite } from './product-search-field';
import { Check, Plus } from 'lucide-react';

export function ProductListCommandItemMobile({
  p,
  already,
  stock,
  disabledRow,
  addProduct,
}: {
  p: ProductLite;
  already: boolean;
  stock: number;
  disabledRow: boolean;
  addProduct: (product: ProductLite) => void;
}) {
  return (
    <CommandItem
      value={`${p.name} ${p.sku ?? ''} ${p.sn ?? ''}`}
      onSelect={() => !disabledRow && addProduct(p)}
      className={cn('flex items-center gap-2 pr-2', disabledRow && 'opacity-50')}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{p.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {p.sku ? `SKU: ${p.sku}` : null}
          {p.sku && p.sn ? ' • ' : ''}
          {p.sn ? `SN: ${p.sn}` : null}
          {p.sku || p.sn ? ' • ' : ''}
          Stock: {stock}
          {p.price ? ` • Price: ${p.price}` : ''}
        </div>
        {/* show a glimpse of categories/attributes */}
        {(p.categories || p.attributes) && (
          <div className="text-[11px] text-muted-foreground truncate">
            {p.categories ? `Cat: ${formatBadges(p.categories)}` : null}
            {p.categories && p.attributes ? ' • ' : ''}
            {p.attributes ? `Attr: ${formatBadges(p.attributes)}` : null}
          </div>
        )}
      </div>
      {already ? (
        <Check className="shrink-0" />
      ) : disabledRow ? (
        <span className="text-xs">Out</span>
      ) : (
        <Plus className="shrink-0" />
      )}
    </CommandItem>
  );
}

export function ProductListCommandItem({
  p,
  already,
  stock,
  disabledRow,
  addProduct,
}: {
  p: ProductLite;
  already: boolean;
  stock: number;
  disabledRow: boolean;
  addProduct: (product: ProductLite) => void;
}) {
  return (
    <CommandItem
      value={`${p.name} ${p.sku ?? ''} ${p.sn ?? ''}`}
      onSelect={() => !disabledRow && addProduct(p)}
      className={cn('flex items-center gap-2 pr-2', disabledRow && 'opacity-50')}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{p.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {p.sku ? `SKU: ${p.sku}` : null}
          {p.sku && p.sn ? ' • ' : ''}
          {p.sn ? `SN: ${p.sn}` : null}
          {p.sku || p.sn ? ' • ' : ''}
          Stock: {stock}
          {p.price ? ` • Price: ${p.price}` : ''}
        </div>
        {/* show a glimpse of categories/attributes */}
        {(p.categories || p.attributes) && (
          <div className="text-[11px] text-muted-foreground truncate">
            {p.categories ? `Cat: ${formatBadges(p.categories)}` : null}
            {p.categories && p.attributes ? ' • ' : ''}
            {p.attributes ? `Attr: ${formatBadges(p.attributes)}` : null}
          </div>
        )}
      </div>
      {already ? (
        <Check className="shrink-0" />
      ) : disabledRow ? (
        <span className="text-xs">Out</span>
      ) : (
        <Plus className="shrink-0" />
      )}
    </CommandItem>
  );
}
