import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download, Edit, Loader2, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAreasQuery, useCreateAreaMutation, useCreateTableMutation, useDeleteAreaMutation, useDeleteTableMutation,
  useRotateQrMutation, useTablesQuery, useUpdateTableMutation,
} from '@/store/endpoints/floor';
import { useAppSelector } from '@/store/hooks';
import { toastError } from '@/lib/apiError';
import type { Table } from '@/types/api';

const NONE = '__none';

function downloadQr(table: Table) {
  const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement | null;
  if (!canvas) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `table-${table.name}.png`;
  a.click();
}

// Printable sheet: one tent card per table, drawn from the on-page canvases.
function printAll(tables: Table[], outletName: string) {
  const cards = tables.map((t) => {
    const canvas = document.getElementById(`qr-${t.id}`) as HTMLCanvasElement | null;
    return canvas ? `<div class="card"><h2>${outletName.replace(/</g, '&lt;')}</h2><img src="${canvas.toDataURL()}"/><p class="t">Table ${t.name.replace(/</g, '&lt;')}</p><p>Scan to see the menu & order</p></div>` : '';
  }).join('');
  const w = window.open('', '_blank');
  if (!w) return toast.error('Allow pop-ups to print');
  w.document.write(`<!doctype html><html><head><title>Table QR codes</title><style>
    body{font-family:system-ui,sans-serif;margin:0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12mm;padding:10mm}
    .card{border:1px dashed #999;border-radius:8px;padding:8mm;text-align:center;page-break-inside:avoid}
    img{width:55mm;height:55mm}h2{margin:0 0 4mm;font-size:16pt}.t{font-size:20pt;font-weight:700;margin:3mm 0 1mm}p{margin:0;color:#444}
  </style></head><body><div class="grid">${cards}</div><script>onload=()=>print()</script></body></html>`);
  w.document.close();
}

export const QRCodesPage: React.FC = () => {
  const outletName = useAppSelector((s) => s.session.profile?.outlets.find((o) => o.id === s.session.outletId)?.name ?? '');
  const { data: tables = [], isLoading } = useTablesQuery();
  const { data: areas = [] } = useAreasQuery();
  const [createArea] = useCreateAreaMutation();
  const [deleteArea] = useDeleteAreaMutation();
  const [createTable, creatingTable] = useCreateTableMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable] = useDeleteTableMutation();
  const [rotate] = useRotateQrMutation();

  const [areaName, setAreaName] = useState('');
  const [form, setForm] = useState<{ id?: string; name: string; areaId: string; capacity: string } | null>(null);
  const [bulk, setBulk] = useState({ prefix: 'T', from: '1', to: '10', areaId: NONE, capacity: '4' });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => Promise<unknown>; action: string } | null>(null);
  const [filterArea, setFilterArea] = useState('all');

  const shown = tables.filter((t) => filterArea === 'all' || (t.areaId || NONE) === filterArea);
  const areaName_ = (id?: string | null) => areas.find((a) => a.id === id)?.name;

  const saveTable = async () => {
    if (!form) return;
    const body = { name: form.name.trim(), areaId: form.areaId === NONE ? null : form.areaId, capacity: Number(form.capacity) || 4 };
    try {
      if (form.id) await updateTable({ id: form.id, ...body }).unwrap();
      else await createTable(body).unwrap();
      setForm(null);
    } catch (e) { toastError(e); }
  };

  const createBulk = async () => {
    const from = Number(bulk.from);
    const to = Number(bulk.to);
    if (!(from >= 0 && to >= from && to - from < 100)) return toast.error('Pick a range of up to 100 tables');
    let made = 0;
    for (let n = from; n <= to; n++) {
      try {
        await createTable({ name: `${bulk.prefix}${n}`, areaId: bulk.areaId === NONE ? null : bulk.areaId, capacity: Number(bulk.capacity) || 4 }).unwrap();
        made++;
      } catch { /* duplicates are skipped */ }
    }
    toast.success(`${made} table(s) added`);
    setBulkOpen(false);
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-gray-400" />;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Areas</h3>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <Badge key={a.id} variant="secondary" className="text-sm py-1 pl-3 pr-1 gap-1">
                {a.name}
                <button className="hover:text-red-600 p-0.5" onClick={() => setConfirm({ title: `Delete ${a.name}?`, body: 'Only empty areas can be deleted.', action: 'Delete', run: () => deleteArea(a.id).unwrap() })}><Trash2 className="h-3 w-3" /></button>
              </Badge>
            ))}
            <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); if (areaName.trim()) createArea({ name: areaName.trim(), sortOrder: areas.length }).unwrap().then(() => setAreaName('')).catch(toastError); }}>
              <Input className="h-8 w-40" placeholder="Indoor, Terrace…" value={areaName} onChange={(e) => setAreaName(e.target.value)} />
              <Button size="sm" type="submit" variant="outline"><Plus className="h-4 w-4" /></Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            <SelectItem value={NONE}>No area</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => printAll(shown, outletName)} disabled={!shown.length}><Printer className="h-4 w-4 mr-1" /> Print QR sheet</Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>Add many</Button>
          <Button onClick={() => setForm({ name: '', areaId: filterArea !== 'all' ? filterArea : NONE, capacity: '4' })}><Plus className="h-4 w-4 mr-1" /> Table</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {shown.map((t) => (
          <Card key={t.id} className={!t.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-3 text-center space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{t.name}</span>
                <span className="text-xs text-gray-500">{areaName_(t.areaId) ?? ''} · {t.capacity} seats</span>
              </div>
              <QRCodeCanvas id={`qr-${t.id}`} value={t.qrUrl} size={512} level="M" marginSize={2} style={{ width: '100%', height: 'auto' }} />
              <div className="flex justify-center gap-1">
                <Button size="icon" variant="ghost" title="Download PNG" onClick={() => downloadQr(t)}><Download className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" title="Copy link" onClick={() => navigator.clipboard.writeText(t.qrUrl).then(() => toast.success('Link copied'))}><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" title="Edit" onClick={() => setForm({ id: t.id, name: t.name, areaId: t.areaId || NONE, capacity: String(t.capacity) })}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" title="New QR (old one stops working)"
                  onClick={() => setConfirm({ title: `New QR for ${t.name}?`, body: 'The printed QR for this table stops working. Print and replace it.', action: 'Make new QR', run: () => rotate(t.id).unwrap() })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" title="Delete" className="hover:text-red-600"
                  onClick={() => setConfirm({ title: `Delete ${t.name}?`, body: 'Its QR code stops working.', action: 'Delete', run: () => deleteTable(t.id).unwrap() })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!shown.length && <p className="col-span-full text-center text-gray-500 py-10">No tables yet</p>}
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form?.id ? 'Edit table' : 'Add table'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={20} placeholder="T1" /></div>
              <div>
                <Label>Area</Label>
                <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>No area</SelectItem>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Seats</Label><Input inputMode="numeric" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value.replace(/\D/g, '') })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveTable} disabled={!form?.name.trim() || creatingTable.isLoading}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add many tables</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Prefix</Label><Input value={bulk.prefix} onChange={(e) => setBulk({ ...bulk, prefix: e.target.value.slice(0, 5) })} /></div>
            <div><Label>From</Label><Input inputMode="numeric" value={bulk.from} onChange={(e) => setBulk({ ...bulk, from: e.target.value.replace(/\D/g, '') })} /></div>
            <div><Label>To</Label><Input inputMode="numeric" value={bulk.to} onChange={(e) => setBulk({ ...bulk, to: e.target.value.replace(/\D/g, '') })} /></div>
            <div className="col-span-2">
              <Label>Area</Label>
              <Select value={bulk.areaId} onValueChange={(v) => setBulk({ ...bulk, areaId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>No area</SelectItem>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Seats</Label><Input inputMode="numeric" value={bulk.capacity} onChange={(e) => setBulk({ ...bulk, capacity: e.target.value.replace(/\D/g, '') })} /></div>
          </div>
          <p className="text-sm text-gray-500">Creates {bulk.prefix}{bulk.from} … {bulk.prefix}{bulk.to}. Names that already exist are skipped.</p>
          <DialogFooter><Button onClick={createBulk} disabled={creatingTable.isLoading}>{creatingTable.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirm?.title}</AlertDialogTitle><AlertDialogDescription>{confirm?.body}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm?.run().catch(toastError)}>{confirm?.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
