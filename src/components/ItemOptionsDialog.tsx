import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FoodTypeMark } from '@/components/FoodTypeMark';
import { formatMoney } from '@/lib/money';
import type { AddonGroup, Id, MenuItem, OrderType } from '@/types/api';

export interface ChosenLine {
  itemId: Id;
  variantId?: Id;
  addonIds: Id[];
  qty: number;
  note?: string;
  // display only
  name: string;
  variantName?: string;
  addons: { id: Id; name: string; price: number }[];
  unitPrice: number;
}

export const priceFor = (item: MenuItem, orderType: OrderType = 'dine_in') =>
  item.orderTypePrices?.[orderType] ?? item.price;

// True when tapping the item can add it straight away (no choices to make).
export const needsOptions = (item: MenuItem, groups: AddonGroup[]) =>
  item.variants.length > 0 || groups.some((g) => item.addonGroupIds.includes(g.id) && g.addons.some((a) => a.isActive));

export const simpleLine = (item: MenuItem, orderType?: OrderType): ChosenLine => ({
  itemId: item.id, addonIds: [], qty: 1, name: item.name, addons: [], unitPrice: priceFor(item, orderType),
});

interface Props {
  item: MenuItem | null;
  addonGroups: AddonGroup[];
  orderType?: OrderType;
  showNote?: boolean;
  onClose: () => void;
  onAdd: (line: ChosenLine) => void;
}

export function ItemOptionsDialog({ item, addonGroups, orderType, showNote = true, onClose, onAdd }: Props) {
  const [variantId, setVariantId] = useState<Id | undefined>();
  const [picked, setPicked] = useState<Id[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    setVariantId(item?.variants[0]?.id);
    setPicked([]);
    setQty(1);
    setNote('');
  }, [item]);

  const groups = useMemo(
    () => (item ? addonGroups.filter((g) => item.addonGroupIds.includes(g.id)) : []),
    [item, addonGroups],
  );

  if (!item) return null;

  const variant = item.variants.find((v) => v.id === variantId);
  const unitPrice = variant ? variant.price : priceFor(item, orderType);
  const chosenAddons = groups.flatMap((g) => g.addons.filter((a) => picked.includes(a.id)));
  const total = (unitPrice + chosenAddons.reduce((s, a) => s + a.price, 0)) * qty;

  const groupError = (g: AddonGroup) => {
    const n = g.addons.filter((a) => picked.includes(a.id)).length;
    return n < g.min ? `Choose at least ${g.min}` : null;
  };
  const valid = (!item.variants.length || variant) && groups.every((g) => !groupError(g));

  const toggle = (g: AddonGroup, id: Id) => {
    const inGroup = g.addons.map((a) => a.id);
    const current = picked.filter((p) => inGroup.includes(p));
    if (picked.includes(id)) return setPicked(picked.filter((p) => p !== id));
    // Single-choice groups behave like radio buttons.
    if (g.max === 1) return setPicked([...picked.filter((p) => !inGroup.includes(p)), id]);
    if (current.length < g.max) setPicked([...picked, id]);
  };

  const add = () => {
    onAdd({
      itemId: item.id,
      variantId: variant?.id,
      addonIds: chosenAddons.map((a) => a.id),
      qty,
      note: note.trim() || undefined,
      name: item.name,
      variantName: variant?.name,
      addons: chosenAddons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      unitPrice,
    });
    onClose();
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FoodTypeMark type={item.foodType} /> {item.name}</DialogTitle>
          {item.description && <DialogDescription>{item.description}</DialogDescription>}
        </DialogHeader>

        {item.variants.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Size</h4>
            <div className="grid grid-cols-2 gap-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`border rounded-lg px-3 py-2 text-left transition ${variantId === v.id ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'hover:bg-gray-50'}`}
                >
                  <div className="font-medium">{v.name}</div>
                  <div className="text-sm text-gray-600">{formatMoney(v.price)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {groups.map((g) => (
          <section key={g.id}>
            <div className="flex items-baseline justify-between mb-2">
              <h4 className="text-sm font-semibold">{g.name}</h4>
              <span className={`text-xs ${groupError(g) ? 'text-red-600' : 'text-gray-500'}`}>
                {g.min > 0 ? `Pick ${g.min === g.max ? g.min : `${g.min}–${g.max}`}` : `Optional, up to ${g.max}`}
              </span>
            </div>
            <div className="space-y-1">
              {g.addons.filter((a) => a.isActive).map((a) => (
                <label key={a.id} className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <span className="flex items-center gap-2">
                    <input
                      type={g.max === 1 ? 'radio' : 'checkbox'}
                      name={g.id}
                      checked={picked.includes(a.id)}
                      onChange={() => toggle(g, a.id)}
                      className="accent-current"
                    />
                    <FoodTypeMark type={a.foodType} size={12} /> {a.name}
                  </span>
                  <span className="text-sm text-gray-600">{a.price ? `+${formatMoney(a.price)}` : 'Free'}</span>
                </label>
              ))}
            </div>
          </section>
        ))}

        {showNote && (
          <Input placeholder="Cooking note (e.g. less spicy)" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
        )}

        <DialogFooter className="flex-row items-center gap-3 sm:justify-between">
          <div className="flex items-center border rounded-lg">
            <Button type="button" variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Less"><Minus className="h-4 w-4" /></Button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => setQty(Math.min(50, qty + 1))} aria-label="More"><Plus className="h-4 w-4" /></Button>
          </div>
          <Button className="flex-1" disabled={!valid} onClick={add}>Add · {formatMoney(total)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
