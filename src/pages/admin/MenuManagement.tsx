import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FoodTypeMark } from '@/components/FoodTypeMark';
import { ItemFormDialog } from '@/components/admin/ItemFormDialog';
import {
  useCreateAddonGroupMutation, useCreateCategoryMutation, useCreateStationMutation, useDeleteAddonGroupMutation,
  useDeleteCategoryMutation, useDeleteItemMutation, useDeleteStationMutation, useMenuQuery, useReorderCategoriesMutation,
  useSetStockMutation, useUpdateAddonGroupMutation, useUpdateCategoryMutation, useUpdateStationMutation, type AddonGroupInput,
} from '@/store/endpoints/menu';
import { useCan } from '@/hooks/useCan';
import { formatMoney, toPaise, toRupees } from '@/lib/money';
import { toastError } from '@/lib/apiError';
import type { AddonGroup, MenuItem } from '@/types/api';

// Small confirm helper so deletes always ask first.
function useConfirm() {
  const [state, setState] = useState<{ title: string; body: string; run: () => Promise<unknown> } | null>(null);
  const dialog = (
    <AlertDialog open={Boolean(state)} onOpenChange={(o) => !o && setState(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title}</AlertDialogTitle>
          <AlertDialogDescription>{state?.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => state?.run().catch(toastError)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return [dialog, setState] as const;
}

function ItemsTab() {
  const can = useCan();
  const { data: menu } = useMenuQuery();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<MenuItem | null | 'new'>(null);
  const [setStock] = useSetStockMutation();
  const [del] = useDeleteItemMutation();
  const [confirm, ask] = useConfirm();

  const sections = useMemo(() => {
    if (!menu) return [];
    const term = q.trim().toLowerCase();
    return menu.categories.map((c) => ({
      ...c,
      items: menu.items.filter((i) => i.categoryId === c.id && (!term || i.name.toLowerCase().includes(term))),
    })).filter((s) => s.items.length || !term);
  }, [menu, q]);

  if (!menu) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search items" className="pl-10 bg-white" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {can('menu.edit') && <Button onClick={() => setEditing('new')} disabled={!menu.categories.length}><Plus className="h-4 w-4 mr-1" /> Item</Button>}
      </div>
      {!menu.categories.length && <Card className="p-6 text-center text-gray-600">Add a category first (Categories tab).</Card>}

      {sections.map((s) => (
        <section key={s.id}>
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">{s.name} <Badge variant="secondary">{s.items.length}</Badge>{!s.isActive && <Badge variant="outline">Hidden</Badge>}</h3>
          <Card>
            <CardContent className="p-0 divide-y">
              {s.items.map((i) => (
                <div key={i.id} className={`flex items-center gap-3 p-3 ${!i.isActive ? 'opacity-50' : ''}`}>
                  {i.images.find((x) => x.isPrimary) ? (
                    <img src={i.images.find((x) => x.isPrimary)!.url} alt="" className="h-12 w-12 rounded-md object-cover" />
                  ) : <div className="h-12 w-12 rounded-md bg-gray-100" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium flex items-center gap-2"><FoodTypeMark type={i.foodType} size={12} /> <span className="truncate">{i.name}</span></p>
                    <p className="text-sm text-gray-600">
                      {i.variants.length ? i.variants.map((v) => `${v.name} ${formatMoney(v.price)}`).join(' · ') : formatMoney(i.price)}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600" title="In stock">
                    <Switch checked={i.inStock} onCheckedChange={(v) => setStock({ id: i.id, inStock: v })} />
                    <span className="hidden sm:inline">{i.inStock ? 'In stock' : 'Sold out'}</span>
                  </label>
                  {can('menu.edit') && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(i)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600"
                        onClick={() => ask({ title: `Delete ${i.name}?`, body: 'It disappears from the menu. Past bills keep it.', run: () => del(i.id).unwrap() })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {!s.items.length && <p className="p-3 text-sm text-gray-500">No items</p>}
            </CardContent>
          </Card>
        </section>
      ))}

      <ItemFormDialog open={editing !== null} item={editing === 'new' ? null : editing} menu={menu} onClose={() => setEditing(null)} />
      {confirm}
    </div>
  );
}

function CategoriesTab() {
  const can = useCan();
  const { data: menu } = useMenuQuery();
  const [name, setName] = useState('');
  const [create] = useCreateCategoryMutation();
  const [update] = useUpdateCategoryMutation();
  const [del] = useDeleteCategoryMutation();
  const [reorder] = useReorderCategoriesMutation();
  const [confirm, ask] = useConfirm();
  if (!menu) return null;
  const cats = menu.categories;

  const move = (i: number, d: -1 | 1) => {
    const ids = cats.map((c) => c.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    reorder(ids).unwrap().catch(toastError);
  };

  return (
    <div className="space-y-3 max-w-2xl">
      {can('menu.edit') && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) create({ name: name.trim(), sortOrder: cats.length }).unwrap().then(() => setName('')).catch(toastError); }}>
          <Input placeholder="New category (e.g. Starters)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="bg-white" />
          <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </form>
      )}
      <Card>
        <CardContent className="p-0 divide-y">
          {cats.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 p-3">
              <Input
                defaultValue={c.name}
                disabled={!can('menu.edit')}
                className="border-transparent shadow-none focus-visible:border-input"
                onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && update({ id: c.id, name: e.target.value.trim() }).unwrap().catch(toastError)}
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">{menu.items.filter((x) => x.categoryId === c.id).length} items</span>
              {can('menu.edit') && (
                <>
                  <Switch checked={c.isActive} onCheckedChange={(v) => update({ id: c.id, isActive: v })} title="Show on menu" />
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={i === cats.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600"
                    onClick={() => ask({ title: `Delete ${c.name}?`, body: 'Only empty categories can be deleted.', run: () => del(c.id).unwrap() })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
          {!cats.length && <p className="p-4 text-sm text-gray-500">No categories yet</p>}
        </CardContent>
      </Card>
      {confirm}
    </div>
  );
}

type AddonDraft = { id?: string; name: string; price: string };

function AddonsTab() {
  const can = useCan();
  const { data: menu } = useMenuQuery();
  const [editing, setEditing] = useState<AddonGroup | 'new' | null>(null);
  const [form, setForm] = useState<{ name: string; min: string; max: string; addons: AddonDraft[] }>({ name: '', min: '0', max: '1', addons: [] });
  const [create] = useCreateAddonGroupMutation();
  const [update] = useUpdateAddonGroupMutation();
  const [del] = useDeleteAddonGroupMutation();
  const [confirm, ask] = useConfirm();

  const open = (g: AddonGroup | 'new') => {
    setEditing(g);
    setForm(g === 'new'
      ? { name: '', min: '0', max: '1', addons: [{ name: '', price: '' }] }
      : { name: g.name, min: String(g.min), max: String(g.max), addons: g.addons.map((a) => ({ id: a.id, name: a.name, price: toRupees(a.price) })) });
  };

  const save = async () => {
    const body: AddonGroupInput = {
      name: form.name.trim(),
      min: Number(form.min) || 0,
      max: Math.max(1, Number(form.max) || 1),
      addons: form.addons.filter((a) => a.name.trim()).map((a) => ({ ...(a.id && { id: a.id }), name: a.name.trim(), price: toPaise(a.price || '0') })),
    };
    try {
      if (editing === 'new') await create(body).unwrap();
      else if (editing) await update({ id: editing.id, ...body }).unwrap();
      setEditing(null);
      toast.success('Saved');
    } catch (e) { toastError(e); }
  };

  if (!menu) return null;
  return (
    <div className="space-y-3 max-w-2xl">
      {can('menu.edit') && <Button onClick={() => open('new')}><Plus className="h-4 w-4 mr-1" /> Add-on group</Button>}
      <p className="text-sm text-gray-500">Groups like "Extra toppings" or "Spice level". Attach them to items from the item form.</p>
      {menu.addonGroups.map((g) => (
        <Card key={g.id}>
          <CardContent className="p-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{g.name} <span className="text-xs text-gray-500">({g.min === 0 ? 'optional' : `min ${g.min}`}, max {g.max})</span></p>
              <p className="text-sm text-gray-600">{g.addons.map((a) => `${a.name}${a.price ? ` +${formatMoney(a.price)}` : ''}`).join(' · ')}</p>
            </div>
            {can('menu.edit') && (
              <div className="flex">
                <Button size="icon" variant="ghost" onClick={() => open(g)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => ask({ title: `Delete ${g.name}?`, body: 'It is removed from every item.', run: () => del(g.id).unwrap() })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing === 'new' ? 'New add-on group' : 'Edit add-on group'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Extra toppings" /></div>
            <div><Label>Min pick</Label><Input inputMode="numeric" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value.replace(/\D/g, '') })} /></div>
            <div><Label>Max pick</Label><Input inputMode="numeric" value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value.replace(/\D/g, '') })} /></div>
          </div>
          <div className="space-y-2">
            {form.addons.map((a, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Cheese" value={a.name} onChange={(e) => setForm({ ...form, addons: form.addons.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input placeholder="₹" inputMode="decimal" className="w-24" value={a.price} onChange={(e) => setForm({ ...form, addons: form.addons.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })} />
                <Button size="icon" variant="ghost" onClick={() => setForm({ ...form, addons: form.addons.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, addons: [...form.addons, { name: '', price: '' }] })}><Plus className="h-4 w-4 mr-1" /> Option</Button>
          </div>
          <DialogFooter><Button onClick={save} disabled={!form.name.trim() || !form.addons.some((a) => a.name.trim())}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {confirm}
    </div>
  );
}

function StationsTab() {
  const can = useCan();
  const { data: menu } = useMenuQuery();
  const [name, setName] = useState('');
  const [create] = useCreateStationMutation();
  const [update] = useUpdateStationMutation();
  const [del] = useDeleteStationMutation();
  if (!menu) return null;
  const edit = can('settings.edit');
  return (
    <div className="space-y-3 max-w-xl">
      <p className="text-sm text-gray-500">Each station gets its own KOT, so the tandoor only sees tandoor items. Items without a station go to the main kitchen.</p>
      {edit && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) create({ name: name.trim() }).unwrap().then(() => setName('')).catch(toastError); }}>
          <Input placeholder="Tandoor, Bar, Chinese…" value={name} onChange={(e) => setName(e.target.value)} className="bg-white" />
          <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </form>
      )}
      <Card>
        <CardContent className="p-0 divide-y">
          {menu.stations.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-3">
              <Input defaultValue={s.name} disabled={!edit} className="border-transparent shadow-none"
                onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && update({ id: s.id, name: e.target.value.trim() }).unwrap().catch(toastError)} />
              <span className="text-xs text-gray-500 whitespace-nowrap">{menu.items.filter((i) => i.stationId === s.id).length} items</span>
              {edit && <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => del(s.id).unwrap().catch(toastError)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
          {!menu.stations.length && <p className="p-4 text-sm text-gray-500">No stations: everything goes to one kitchen.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export const MenuManagement: React.FC = () => {
  const { isLoading } = useMenuQuery();
  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-gray-400" />;
  return (
    <Tabs defaultValue="items">
      <TabsList className="mb-4">
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="addons">Add-ons</TabsTrigger>
        <TabsTrigger value="stations">Kitchen stations</TabsTrigger>
      </TabsList>
      <TabsContent value="items"><ItemsTab /></TabsContent>
      <TabsContent value="categories"><CategoriesTab /></TabsContent>
      <TabsContent value="addons"><AddonsTab /></TabsContent>
      <TabsContent value="stations"><StationsTab /></TabsContent>
    </Tabs>
  );
};
