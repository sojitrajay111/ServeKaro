import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FoodTypeMark } from '@/components/FoodTypeMark';
import { FieldError } from '@/components/AuthShell';
import {
  useCreateItemMutation, useDeleteImageMutation, useSetPrimaryImageMutation, useUpdateItemMutation, useUploadItemImagesMutation,
  type ItemInput,
} from '@/store/endpoints/menu';
import { toPaise, toRupees } from '@/lib/money';
import { fieldError, isApiError, toastError } from '@/lib/apiError';
import type { FoodType, ItemTag, Menu, MenuItem } from '@/types/api';

const TAGS: { tag: ItemTag; label: string }[] = [
  { tag: 'popular', label: 'Popular' }, { tag: 'chefSpecial', label: "Chef's special" }, { tag: 'new', label: 'New' }, { tag: 'spicy', label: 'Spicy' },
];
const NONE = '__none';

interface FormState {
  name: string; shortCode: string; description: string; categoryId: string; foodType: FoodType; price: string;
  variants: { id?: string; name: string; price: string }[]; addonGroupIds: string[]; taxGroupId: string; hsn: string;
  stationId: string; prepTimeMin: string; tags: ItemTag[]; isActive: boolean; takeawayPrice: string; deliveryPrice: string;
}

const fromItem = (item: MenuItem | null, menu: Menu, defaultCategory?: string): FormState => ({
  name: item?.name ?? '',
  shortCode: item?.shortCode ?? '',
  description: item?.description ?? '',
  categoryId: item?.categoryId ?? defaultCategory ?? menu.categories[0]?.id ?? '',
  foodType: item?.foodType ?? 'veg',
  price: item ? toRupees(item.price) : '',
  variants: item?.variants.map((v) => ({ id: v.id, name: v.name, price: toRupees(v.price) })) ?? [],
  addonGroupIds: item?.addonGroupIds ?? [],
  taxGroupId: item?.taxGroupId ?? menu.taxGroups.find((t) => t.name === 'GST 5%')?.id ?? NONE,
  hsn: item?.hsn ?? '996331',
  stationId: item?.stationId ?? NONE,
  prepTimeMin: item?.prepTimeMin ? String(item.prepTimeMin) : '',
  tags: item?.tags ?? [],
  isActive: item?.isActive ?? true,
  takeawayPrice: item?.orderTypePrices?.takeaway != null ? toRupees(item.orderTypePrices.takeaway) : '',
  deliveryPrice: item?.orderTypePrices?.delivery != null ? toRupees(item.orderTypePrices.delivery) : '',
});

export function ItemFormDialog({ open, item, menu, defaultCategory, onClose }: {
  open: boolean; item: MenuItem | null; menu: Menu; defaultCategory?: string; onClose: () => void;
}) {
  const [f, setF] = useState<FormState>(() => fromItem(item, menu, defaultCategory));
  const [error, setError] = useState<unknown>(null);
  const [create, creating] = useCreateItemMutation();
  const [update, updating] = useUpdateItemMutation();
  const [upload, uploading] = useUploadItemImagesMutation();
  const [setPrimary] = useSetPrimaryImageMutation();
  const [removeImage] = useDeleteImageMutation();
  // After creating, keep the dialog open on the new item so images can be added.
  const [savedId, setSavedId] = useState<string | null>(null);
  const current = item ?? menu.items.find((i) => i.id === savedId) ?? null;

  useEffect(() => {
    if (open) { setF(fromItem(item, menu, defaultCategory)); setError(null); setSavedId(null); }
  }, [open, item]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setError(null);
    const variants = f.variants.filter((v) => v.name.trim());
    const body: ItemInput = {
      name: f.name.trim(),
      shortCode: f.shortCode.trim() || undefined,
      description: f.description.trim(),
      categoryId: f.categoryId,
      foodType: f.foodType,
      price: variants.length ? Math.min(...variants.map((v) => toPaise(v.price))) : toPaise(f.price),
      variants: variants.map((v) => ({ ...(v.id && { id: v.id }), name: v.name.trim(), price: toPaise(v.price) })),
      addonGroupIds: f.addonGroupIds,
      taxGroupId: f.taxGroupId === NONE ? null : f.taxGroupId,
      hsn: f.hsn.trim() || undefined,
      stationId: f.stationId === NONE ? null : f.stationId,
      prepTimeMin: f.prepTimeMin ? Number(f.prepTimeMin) : 0,
      tags: f.tags,
      isActive: f.isActive,
      inStock: current?.inStock ?? true,
      orderTypePrices: {
        ...(f.takeawayPrice && { takeaway: toPaise(f.takeawayPrice) }),
        ...(f.deliveryPrice && { delivery: toPaise(f.deliveryPrice) }),
      },
    };
    if ([body.price, ...body.variants!.map((v) => v.price)].some((p) => !Number.isFinite(p))) {
      return setError({ code: 'X', message: 'Check the prices', errors: { price: ['Enter a price in rupees'] } });
    }
    try {
      if (current) {
        await update({ id: current.id, ...body }).unwrap();
        toast.success('Saved');
        onClose();
      } else {
        const created = await create(body).unwrap();
        setSavedId(created.id);
        toast.success('Item added. You can add photos now.');
      }
    } catch (e) {
      setError(e);
      if (!isApiError(e) || !e.errors) toastError(e);
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!current || !files?.length) return;
    try {
      await upload({ id: current.id, files: Array.from(files).slice(0, 5) }).unwrap();
      toast.success('Photo uploaded');
    } catch (e) { toastError(e); }
  };

  const saving = creating.isLoading || updating.isLoading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{current ? `Edit ${current.name}` : 'Add item'}</DialogTitle></DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={80} autoFocus />
            <FieldError>{fieldError(error, 'name')}</FieldError>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={f.categoryId} onValueChange={(v) => set('categoryId', v)}>
              <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
              <SelectContent>{menu.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <FieldError>{fieldError(error, 'categoryId')}</FieldError>
          </div>
          <div>
            <Label>Type</Label>
            <div className="flex gap-2 mt-1">
              {(['veg', 'nonveg', 'egg'] as const).map((t) => (
                <button key={t} type="button" onClick={() => set('foodType', t)}
                  className={`flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-sm ${f.foodType === t ? 'border-accent bg-accent/10' : ''}`}>
                  <FoodTypeMark type={t} size={12} /> {t === 'nonveg' ? 'Non-veg' : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {!f.variants.length && (
            <div>
              <Label>Price ₹</Label>
              <Input inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} />
              <FieldError>{fieldError(error, 'price')}</FieldError>
            </div>
          )}
          <div>
            <Label>Short code</Label>
            <Input value={f.shortCode} onChange={(e) => set('shortCode', e.target.value.toUpperCase())} maxLength={10} placeholder="PT" />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={500} rows={2} />
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sizes / variants</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => set('variants', [...f.variants, { name: '', price: '' }])}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
          {f.variants.map((v, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Half / Full / 500ml" value={v.name} onChange={(e) => set('variants', f.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <Input placeholder="₹" inputMode="decimal" className="w-28" value={v.price} onChange={(e) => set('variants', f.variants.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
              <Button type="button" size="icon" variant="ghost" onClick={() => set('variants', f.variants.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </section>

        {menu.addonGroups.length > 0 && (
          <section>
            <Label>Add-on groups</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {menu.addonGroups.map((g) => {
                const on = f.addonGroupIds.includes(g.id);
                return (
                  <button key={g.id} type="button" onClick={() => set('addonGroupIds', on ? f.addonGroupIds.filter((x) => x !== g.id) : [...f.addonGroupIds, g.id])}
                    className={`border rounded-full px-3 py-1 text-sm ${on ? 'border-accent bg-accent/10 font-medium' : ''}`}>{g.name}</button>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>GST</Label>
            <Select value={f.taxGroupId} onValueChange={(v) => set('taxGroupId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No tax</SelectItem>
                {menu.taxGroups.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>HSN / SAC</Label>
            <Input value={f.hsn} onChange={(e) => set('hsn', e.target.value.replace(/\D/g, ''))} maxLength={8} />
            <FieldError>{fieldError(error, 'hsn')}</FieldError>
          </div>
          <div>
            <Label>Kitchen station</Label>
            <Select value={f.stationId} onValueChange={(v) => set('stationId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Main kitchen</SelectItem>
                {menu.stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Takeaway price ₹</Label>
            <Input inputMode="decimal" placeholder="same" value={f.takeawayPrice} onChange={(e) => set('takeawayPrice', e.target.value)} />
          </div>
          <div>
            <Label>Delivery price ₹</Label>
            <Input inputMode="decimal" placeholder="same" value={f.deliveryPrice} onChange={(e) => set('deliveryPrice', e.target.value)} />
          </div>
          <div>
            <Label>Prep time (min)</Label>
            <Input inputMode="numeric" value={f.prepTimeMin} onChange={(e) => set('prepTimeMin', e.target.value.replace(/\D/g, '').slice(0, 3))} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TAGS.map(({ tag, label }) => {
            const on = f.tags.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => set('tags', on ? f.tags.filter((t) => t !== tag) : [...f.tags, tag])}
                className={`border rounded-full px-3 py-1 text-sm ${on ? 'border-accent bg-accent/10 font-medium' : ''}`}>{label}</button>
            );
          })}
          <label className="flex items-center gap-2 text-sm ml-auto"><Switch checked={f.isActive} onCheckedChange={(v) => set('isActive', v)} /> Show on menu</label>
        </div>

        {current && (
          <section>
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {current.images.map((img) => (
                <div key={img.id} className={`relative h-20 w-20 rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-accent' : 'border-transparent'}`}>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-0.5">
                    <button type="button" title="Main photo" onClick={() => setPrimary({ id: current.id, imageId: img.id })}><Star className={`h-3.5 w-3.5 ${img.isPrimary ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} /></button>
                    <button type="button" title="Delete" onClick={() => removeImage({ id: current.id, imageId: img.id })}><Trash2 className="h-3.5 w-3.5 text-white" /></button>
                  </div>
                </div>
              ))}
              {current.images.length < 5 && (
                <label className="h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-accent hover:text-accent">
                  {uploading.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <span className="text-[10px]">JPG/PNG/WebP</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                </label>
              )}
            </div>
          </section>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{savedId ? 'Done' : 'Cancel'}</Button>
          <Button onClick={save} disabled={saving || !f.name.trim() || !f.categoryId}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {current ? 'Save' : 'Add item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
