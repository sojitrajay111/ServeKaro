import React, { useEffect, useState } from 'react';
import { Copy, Loader2, Monitor, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldError } from '@/components/AuthShell';
import {
  useCreateTaxGroupMutation, useDeleteTaxGroupMutation, useOutletQuery, useTaxGroupsQuery, useUpdateOutletMutation, useUpdateTaxGroupMutation,
} from '@/store/endpoints/admin';
import { useDevicesQuery, useRegisterDeviceMutation, useRemoveDeviceMutation } from '@/store/endpoints/auth';
import { useAppSelector } from '@/store/hooks';
import { fieldError, isApiError, toastError } from '@/lib/apiError';
import { DEVICE_KEY } from '@/pages/admin/PinLoginPage';
import type { OrderType, Outlet, TaxGroup } from '@/types/api';

const ORDER_TYPES: [OrderType, string][] = [['dine_in', 'Dine-in'], ['takeaway', 'Takeaway'], ['delivery', 'Delivery']];

const Toggle = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
    <span><span className="font-medium text-sm">{label}</span>{hint && <span className="block text-xs text-gray-500">{hint}</span>}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

function OutletForm({ outlet }: { outlet: Outlet }) {
  const [o, setO] = useState(outlet);
  const [error, setError] = useState<unknown>(null);
  const [save, saving] = useUpdateOutletMutation();
  useEffect(() => setO(outlet), [outlet]);

  const set = <K extends keyof Outlet>(k: K, v: Outlet[K]) => setO((s) => ({ ...s, [k]: v }));
  const text = (k: keyof Outlet, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div>
      <Label>{label}</Label>
      <Input value={String(o[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} {...props} />
      <FieldError>{fieldError(error, k)}</FieldError>
    </div>
  );

  const submit = async () => {
    setError(null);
    const { id, ...body } = o;
    try {
      await save({ id, ...body }).unwrap();
      toast.success('Settings saved');
    } catch (e) {
      setError(e);
      toastError(e, isApiError(e) && e.errors ? 'Check the highlighted fields' : undefined);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Outlet</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {text('name', 'Name')}
          {text('slug', 'Menu link', { placeholder: 'spice-route-ahmedabad' })}
          {text('phone', 'Phone')}
          {text('email', 'Email')}
          {text('city', 'City')}
          <div className="sm:col-span-2">
            <Label>Address (printed on bills)</Label>
            <Textarea rows={2} value={o.address} onChange={(e) => set('address', e.target.value)} maxLength={300} />
          </div>
          <div className="sm:col-span-2">
            <Toggle label="Open for orders" hint="When off, customers can browse the QR menu but can't order" checked={o.isOpen} onChange={(v) => set('isOpen', v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">GST & billing</CardTitle><CardDescription>Changes apply to new bills only.</CardDescription></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {text('gstin', 'GSTIN', { placeholder: '24AAACS1234A1Z5', maxLength: 15, onChange: (e) => set('gstin', e.target.value.toUpperCase()) })}
          {text('fssai', 'FSSAI licence no.', { maxLength: 14 })}
          {text('billPrefix', 'Bill number prefix', { maxLength: 6, onChange: (e) => set('billPrefix', e.target.value.toUpperCase()) })}
          <div>
            <Label>Round off total</Label>
            <div className="flex gap-2 mt-1">
              {(['nearest_rupee', 'none'] as const).map((r) => (
                <Button key={r} type="button" size="sm" variant={o.roundOff === r ? 'default' : 'outline'} onClick={() => set('roundOff', r)}>{r === 'none' ? 'No' : 'To nearest ₹'}</Button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 divide-y">
            <Toggle label="Menu prices include GST" hint="Off: GST is added on top of menu prices" checked={o.pricesIncludeTax} onChange={(v) => set('pricesIncludeTax', v)} />
            <Toggle label="Service charge" checked={o.serviceCharge.enabled} onChange={(v) => set('serviceCharge', { ...o.serviceCharge, enabled: v })} />
          </div>
          {o.serviceCharge.enabled && (
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <Input className="w-24" inputMode="decimal" value={o.serviceCharge.percent} onChange={(e) => set('serviceCharge', { ...o.serviceCharge, percent: Number(e.target.value) || 0 })} />
              <span className="text-sm">% on</span>
              {ORDER_TYPES.map(([t, label]) => (
                <label key={t} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={o.serviceCharge.orderTypes.includes(t)}
                    onChange={(e) => set('serviceCharge', { ...o.serviceCharge, orderTypes: e.target.checked ? [...o.serviceCharge.orderTypes, t] : o.serviceCharge.orderTypes.filter((x) => x !== t) })} />
                  {label}
                </label>
              ))}
            </div>
          )}
          <div><Label>Bill header</Label><Textarea rows={2} value={o.bill.header} onChange={(e) => set('bill', { ...o.bill, header: e.target.value })} maxLength={300} /></div>
          <div><Label>Bill footer</Label><Textarea rows={2} value={o.bill.footer} onChange={(e) => set('bill', { ...o.bill, footer: e.target.value })} maxLength={300} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ordering</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {ORDER_TYPES.map(([t, label]) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={o.orderTypes.includes(t)}
                  onChange={(e) => set('orderTypes', e.target.checked ? [...o.orderTypes, t] : o.orderTypes.filter((x) => x !== t))} />
                {label}
              </label>
            ))}
          </div>
          <div className="divide-y">
            <Toggle label="Customers can order from the table QR" checked={o.qrOrdering.enabled} onChange={(v) => set('qrOrdering', { ...o.qrOrdering, enabled: v })} />
            <Toggle label="Staff must accept QR orders" hint="Stops prank orders. When off, QR orders go straight to the kitchen." checked={o.qrOrdering.requireAcceptance} onChange={(v) => set('qrOrdering', { ...o.qrOrdering, requireAcceptance: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Menu colours</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          {(['primaryColor', 'accentColor'] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="color" value={o.theme[k]} onChange={(e) => set('theme', { ...o.theme, [k]: e.target.value })} className="h-9 w-12 rounded border" />
              {k === 'primaryColor' ? 'Primary' : 'Accent'}
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-gray-50 py-3">
        <Button onClick={submit} disabled={saving.isLoading}>{saving.isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save settings</Button>
      </div>
    </div>
  );
}

function TaxGroups() {
  const { data = [] } = useTaxGroupsQuery();
  const [create] = useCreateTaxGroupMutation();
  const [update] = useUpdateTaxGroupMutation();
  const [del] = useDeleteTaxGroupMutation();
  const [editing, setEditing] = useState<(Omit<TaxGroup, 'id'> & { id?: string }) | null>(null);

  const save = async () => {
    if (!editing) return;
    try {
      if (editing.id) await update(editing as TaxGroup).unwrap();
      else await create(editing).unwrap();
      setEditing(null);
    } catch (e) { toastError(e); }
  };

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-sm text-gray-500">Restaurant food is usually GST 5% (2.5% CGST + 2.5% SGST). Changing a rate only affects new orders.</p>
      <Button onClick={() => setEditing({ name: '', components: [{ name: 'CGST', rate: 2.5 }, { name: 'SGST', rate: 2.5 }] })}><Plus className="h-4 w-4 mr-1" /> Tax group</Button>
      <Card>
        <CardContent className="p-0 divide-y">
          {data.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3">
              <div><p className="font-medium">{t.name}</p><p className="text-xs text-gray-500">{t.components.map((c) => `${c.name} ${c.rate}%`).join(' + ') || 'No tax'}</p></div>
              <div className="flex">
                <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => del(t.id).unwrap().catch(toastError)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit tax group' : 'New tax group'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-2">
              <Input placeholder="GST 18%" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              {editing.components.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={c.name} onChange={(e) => setEditing({ ...editing, components: editing.components.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                  <Input className="w-24" inputMode="decimal" value={c.rate} onChange={(e) => setEditing({ ...editing, components: editing.components.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) || 0 } : x)) })} />
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...editing, components: editing.components.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, components: [...editing.components, { name: 'CESS', rate: 0 }] })}><Plus className="h-4 w-4 mr-1" /> Component</Button>
            </div>
          )}
          <DialogFooter><Button onClick={save} disabled={!editing?.name.trim()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Devices() {
  const { data = [] } = useDevicesQuery();
  const [register, registering] = useRegisterDeviceMutation();
  const [remove] = useRemoveDeviceMutation();
  const [name, setName] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const add = async () => {
    try {
      const r = await register({ name: name.trim() }).unwrap();
      setToken(r.deviceToken);
      setName('');
    } catch (e) { toastError(e); }
  };

  const useHere = () => {
    try { localStorage.setItem(DEVICE_KEY, token!); } catch { /* ignore */ }
    toast.success('This browser is now a POS terminal. Staff can use PIN login at /admin/pin');
    setToken(null);
  };

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-sm text-gray-500">A registered terminal (counter PC, tablet) lets staff switch users with a 4–6 digit PIN instead of a password.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) add(); }}>
        <Input placeholder="Counter 1" value={name} onChange={(e) => setName(e.target.value)} className="bg-white" maxLength={60} />
        <Button type="submit" disabled={registering.isLoading}><Monitor className="h-4 w-4 mr-1" /> Register</Button>
      </form>
      <Card>
        <CardContent className="p-0 divide-y">
          {data.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3">
              <div><p className="font-medium">{d.name}</p><p className="text-xs text-gray-500">{d.lastUsedAt ? `Last used ${new Date(d.lastUsedAt).toLocaleString('en-IN')}` : 'Never used'}</p></div>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => remove(d.id).unwrap().catch(toastError)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {!data.length && <p className="p-4 text-sm text-gray-500">No terminals yet</p>}
        </CardContent>
      </Card>
      <Dialog open={Boolean(token)} onOpenChange={(o) => !o && setToken(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terminal registered</DialogTitle>
            <DialogDescription>This key is shown once. Use it on this browser now, or copy it to the terminal.</DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded bg-gray-100 p-3 text-xs">{token}</code>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(token!).then(() => toast.success('Copied'))}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
            <Button onClick={useHere}>Use this browser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const AdminSettings: React.FC = () => {
  const outletId = useAppSelector((s) => s.session.outletId);
  const { data: outlet, isLoading } = useOutletQuery(outletId!, { skip: !outletId });
  if (isLoading || !outlet) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-gray-400" />;
  return (
    <Tabs defaultValue="outlet">
      <TabsList className="mb-4">
        <TabsTrigger value="outlet">Outlet</TabsTrigger>
        <TabsTrigger value="taxes">Taxes</TabsTrigger>
        <TabsTrigger value="devices">POS terminals</TabsTrigger>
      </TabsList>
      <TabsContent value="outlet"><OutletForm outlet={outlet} /></TabsContent>
      <TabsContent value="taxes"><TaxGroups /></TabsContent>
      <TabsContent value="devices"><Devices /></TabsContent>
    </Tabs>
  );
};
