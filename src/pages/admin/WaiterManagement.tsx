import React, { useState } from 'react';
import { KeyRound, Loader2, Mail, Plus, Shield, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldError } from '@/components/AuthShell';
import {
  useCreateRoleMutation, useCreateStaffMutation, useDeleteRoleMutation, useResendInviteMutation, useResetPinMutation,
  useRolesQuery, useStaffQuery, useUpdateRoleMutation, useUpdateStaffMutation,
} from '@/store/endpoints/admin';
import { useAppSelector } from '@/store/hooks';
import { fieldError, isApiError, toastError } from '@/lib/apiError';
import type { Permission, Role, User } from '@/types/api';

// Grouped and named for people, not for the API.
const PERMISSION_GROUPS: { title: string; items: [Permission, string][] }[] = [
  { title: 'Orders', items: [['orders.create', 'Take orders'], ['orders.accept', 'Accept QR orders'], ['orders.cancelItem', 'Cancel items'], ['kot.update', 'Kitchen display'], ['tables.manage', 'Manage tables']] },
  { title: 'Billing', items: [['bills.create', 'Make bills'], ['bills.discount', 'Give discounts'], ['payments.collect', 'Take payments'], ['bills.reprint', 'Reprint bills'], ['shift.manage', 'Open/close shift'], ['payments.refund', 'Refunds'], ['bills.void', 'Void bills'], ['bills.complimentary', 'Complimentary (NC)']] },
  { title: 'Menu', items: [['menu.view', 'See menu, mark sold out'], ['menu.edit', 'Edit menu & prices']] },
  { title: 'Customers & stock', items: [['customers.view', 'See customers'], ['customers.edit', 'Edit customers'], ['inventory.view', 'See stock'], ['inventory.edit', 'Edit stock'], ['expenses.edit', 'Expenses']] },
  { title: 'Admin', items: [['reports.view', 'Reports & dashboard'], ['staff.manage', 'Staff & roles'], ['settings.edit', 'Outlet settings']] },
];

function StaffTab() {
  const me = useAppSelector((s) => s.session.profile);
  const { data: staff = [], isLoading } = useStaffQuery();
  const { data: roleData } = useRolesQuery();
  const [create, creating] = useCreateStaffMutation();
  const [update] = useUpdateStaffMutation();
  const [resetPin] = useResetPinMutation();
  const [resend] = useResendInviteMutation();
  const [form, setForm] = useState<{ id?: string; name: string; phone: string; email: string; roleId: string; pin: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pinFor, setPinFor] = useState<User | null>(null);
  const [pin, setPin] = useState('');

  const roles = roleData?.roles ?? [];
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? '—';
  const outletIds = me?.outlets.map((o) => o.id) ?? [];

  const save = async () => {
    if (!form) return;
    setError(null);
    try {
      if (form.id) {
        await update({ id: form.id, name: form.name, phone: form.phone, ...(form.email && { email: form.email }), roleId: form.roleId }).unwrap();
      } else {
        await create({
          name: form.name, phone: form.phone, roleId: form.roleId, outletIds,
          ...(form.email && { email: form.email }), ...(form.pin && { pin: form.pin }),
        }).unwrap();
        toast.success(form.email ? 'Added. They got an email to set a password.' : 'Added. They can log in on a POS terminal with their PIN.');
      }
      setForm(null);
    } catch (e) {
      setError(e);
      if (!isApiError(e) || !e.errors) toastError(e);
    }
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-10 text-gray-400" />;

  return (
    <div className="space-y-3">
      <Button onClick={() => { setError(null); setForm({ name: '', phone: '', email: '', roleId: roles.find((r) => r.name === 'Captain')?.id ?? roles[0]?.id ?? '', pin: '' }); }}>
        <Plus className="h-4 w-4 mr-1" /> Add staff
      </Button>
      <Card>
        <CardContent className="p-0 divide-y">
          {staff.map((u) => (
            <div key={u.id} className={`flex flex-wrap items-center gap-3 p-3 ${!u.isActive ? 'opacity-50' : ''}`}>
              <div className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center font-semibold">{u.name[0]}</div>
              <div className="flex-1 min-w-[160px]">
                <p className="font-medium">{u.name} {u.id === me?.user.id && <span className="text-xs text-gray-500">(you)</span>}</p>
                <p className="text-xs text-gray-500">{u.phone} {u.email && `· ${u.email}`}</p>
              </div>
              <Badge variant="secondary">{roleName(u.roleId)}</Badge>
              {u.hasPin ? <Badge variant="outline" className="text-xs">PIN set</Badge> : <Badge variant="outline" className="text-xs text-gray-400">No PIN</Badge>}
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" title="Edit" onClick={() => { setError(null); setForm({ id: u.id, name: u.name, phone: u.phone ?? '', email: u.email ?? '', roleId: u.roleId, pin: '' }); }}><UserCog className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" title="Set PIN" onClick={() => { setPinFor(u); setPin(''); }}><KeyRound className="h-4 w-4" /></Button>
                {u.email && !u.lastLoginAt && (
                  <Button size="icon" variant="ghost" title="Resend invite" onClick={() => resend(u.id).unwrap().then(() => toast.success('Invite sent')).catch(toastError)}><Mail className="h-4 w-4" /></Button>
                )}
                {u.id !== me?.user.id && (
                  <Switch checked={u.isActive} title={u.isActive ? 'Active' : 'Disabled'} onCheckedChange={(v) => update({ id: u.id, isActive: v }).unwrap().then(() => toast.success(v ? 'Enabled' : 'Disabled and signed out')).catch(toastError)} />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form?.id ? 'Edit staff' : 'Add staff'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><FieldError>{fieldError(error, 'name')}</FieldError></div>
              <div><Label>Mobile</Label><Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><FieldError>{fieldError(error, 'phone')}</FieldError></div>
              <div><Label>Email <span className="text-gray-400 font-normal">(for login on their own phone/laptop)</span></Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><FieldError>{fieldError(error, 'email')}</FieldError></div>
              <div>
                <Label>Role</Label>
                <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.filter((r) => !r.isOwner || me?.role.isOwner).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!form.id && (
                <div><Label>POS PIN <span className="text-gray-400 font-normal">(4–6 digits, optional)</span></Label><Input inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} /><FieldError>{fieldError(error, 'pin')}</FieldError></div>
              )}
            </div>
          )}
          <DialogFooter><Button onClick={save} disabled={creating.isLoading || !form?.name.trim() || !form?.phone.trim()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pinFor)} onOpenChange={(o) => !o && setPinFor(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>PIN for {pinFor?.name}</DialogTitle>
            <DialogDescription>Used to log in on POS terminals and to approve voids/discounts (managers).</DialogDescription>
          </DialogHeader>
          <Input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-[0.5em]" />
          <DialogFooter>
            <Button disabled={!/^\d{4,6}$/.test(pin)} onClick={() => pinFor && resetPin({ id: pinFor.id, pin }).unwrap().then(() => { toast.success('PIN set'); setPinFor(null); }).catch(toastError)}>Save PIN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RolesTab() {
  const { data, isLoading } = useRolesQuery();
  const [create] = useCreateRoleMutation();
  const [update] = useUpdateRoleMutation();
  const [del] = useDeleteRoleMutation();
  const [editing, setEditing] = useState<{ id?: string; name: string; permissions: Permission[]; maxDiscountPercent: string } | null>(null);

  if (isLoading || !data) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-10 text-gray-400" />;

  const open = (r?: Role) => setEditing(r
    ? { id: r.id, name: r.name, permissions: r.permissions, maxDiscountPercent: String(r.maxDiscountPercent) }
    : { name: '', permissions: ['menu.view', 'orders.create'], maxDiscountPercent: '0' });

  const save = async () => {
    if (!editing) return;
    const body = { name: editing.name.trim(), permissions: editing.permissions, maxDiscountPercent: Math.min(100, Number(editing.maxDiscountPercent) || 0) };
    try {
      if (editing.id) await update({ id: editing.id, ...body }).unwrap();
      else await create(body).unwrap();
      setEditing(null);
      toast.success('Role saved. Changes apply on their next action.');
    } catch (e) { toastError(e); }
  };

  const toggle = (p: Permission) => editing && setEditing({
    ...editing, permissions: editing.permissions.includes(p) ? editing.permissions.filter((x) => x !== p) : [...editing.permissions, p],
  });

  return (
    <div className="space-y-3">
      <Button onClick={() => open()}><Plus className="h-4 w-4 mr-1" /> New role</Button>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.roles.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> {r.name}</p>
                {!r.isOwner && (
                  <div className="flex">
                    <Button size="sm" variant="ghost" onClick={() => open(r)}>Edit</Button>
                    <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => del(r.id).unwrap().catch(toastError)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">{r.isOwner ? 'Everything' : `${r.permissions.length} permissions · discount up to ${r.maxDiscountPercent}%`}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? `Edit ${editing.name}` : 'New role'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Max discount %</Label><Input inputMode="numeric" value={editing.maxDiscountPercent} onChange={(e) => setEditing({ ...editing, maxDiscountPercent: e.target.value.replace(/\D/g, '') })} /></div>
              </div>
              {PERMISSION_GROUPS.map((g) => (
                <section key={g.title}>
                  <h4 className="text-sm font-semibold mb-1">{g.title}</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {g.items.map(([p, label]) => (
                      <label key={p} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                        <Checkbox checked={editing.permissions.includes(p)} onCheckedChange={() => toggle(p)} /> {label}
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          <DialogFooter><Button onClick={save} disabled={!editing?.name.trim()}>Save role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const WaiterManagement: React.FC = () => (
  <Tabs defaultValue="staff">
    <TabsList className="mb-4">
      <TabsTrigger value="staff">Staff</TabsTrigger>
      <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
    </TabsList>
    <TabsContent value="staff"><StaffTab /></TabsContent>
    <TabsContent value="roles"><RolesTab /></TabsContent>
  </Tabs>
);
