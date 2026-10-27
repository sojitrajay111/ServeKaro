import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Clock, Combine, Loader2, Plus, ShoppingBag, Smartphone, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAreasQuery, useMergeTablesMutation, useTablesQuery, useTransferTableMutation } from '@/store/endpoints/floor';
import { useOrdersQuery } from '@/store/endpoints/orders';
import { formatMoneyShort } from '@/lib/money';
import { toastError } from '@/lib/apiError';
import type { Table } from '@/types/api';

const STATUS_STYLE: Record<Table['status'], string> = {
  free: 'bg-white border-gray-200 hover:border-green-400',
  occupied: 'bg-orange-50 border-orange-300',
  billed: 'bg-blue-50 border-blue-300',
};

const minutesSince = (iso?: string | null) => (iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : 0);

export const LiveTableView: React.FC = () => {
  const navigate = useNavigate();
  const { data: tables = [], isLoading } = useTablesQuery(undefined, { pollingInterval: 60_000 });
  const { data: areas = [] } = useAreasQuery();
  const { data: openOrders } = useOrdersQuery({ status: ['awaiting_acceptance', 'open', 'billed'], limit: 200 });
  const [transfer] = useTransferTableMutation();
  const [merge] = useMergeTablesMutation();
  const [mode, setMode] = useState<'normal' | 'transfer' | 'merge'>('normal');
  const [picked, setPicked] = useState<string[]>([]);

  const orders = openOrders?.data ?? [];
  const pendingQr = orders.filter((o) => o.status === 'awaiting_acceptance' || o.items.some((i) => i.status === 'awaiting_acceptance'));
  const nonDineIn = orders.filter((o) => o.type !== 'dine_in');

  const grouped = useMemo(() => {
    const byArea = new Map<string, Table[]>();
    for (const t of tables.filter((x) => x.isActive)) {
      const key = t.areaId || '';
      byArea.set(key, [...(byArea.get(key) || []), t]);
    }
    return [...areas.map((a) => ({ id: a.id, name: a.name })), { id: '', name: areas.length ? 'Other' : 'Tables' }]
      .map((a) => ({ ...a, tables: byArea.get(a.id) || [] }))
      .filter((a) => a.tables.length);
  }, [tables, areas]);

  const counts = {
    free: tables.filter((t) => t.status === 'free').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    billed: tables.filter((t) => t.status === 'billed').length,
  };

  const reset = () => { setMode('normal'); setPicked([]); };

  const click = async (t: Table) => {
    if (mode === 'normal') {
      return navigate(t.orderId ? `/admin/orders?order=${t.orderId}` : `/admin/orders?table=${t.id}`);
    }
    if (mode === 'transfer') {
      if (!picked.length) {
        if (t.status === 'free') return toast.error('Pick a table that has an order');
        return setPicked([t.id]);
      }
      if (t.status !== 'free') return toast.error('Move to a free table');
      try {
        await transfer({ id: picked[0], toTableId: t.id }).unwrap();
        toast.success(`Moved to ${t.name}`);
        reset();
      } catch (e) { toastError(e); }
      return;
    }
    if (t.status !== 'occupied') return toast.error('Only occupied, unbilled tables can be merged');
    setPicked((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]));
  };

  const doMerge = async () => {
    try {
      await merge(picked).unwrap();
      toast.success('Tables merged');
      reset();
    } catch (e) { toastError(e); }
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20 text-gray-400" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="bg-white">{counts.free} free</Badge>
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{counts.occupied} running</Badge>
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{counts.billed} billed</Badge>
        </div>
        <div className="flex gap-2">
          {mode === 'normal' ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setMode('transfer')}><ArrowRightLeft className="h-4 w-4 mr-1" /> Move</Button>
              <Button variant="outline" size="sm" onClick={() => setMode('merge')}><Combine className="h-4 w-4 mr-1" /> Merge</Button>
              <Button size="sm" onClick={() => navigate('/admin/orders')}><Plus className="h-4 w-4 mr-1" /> New order</Button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600 self-center">
                {mode === 'transfer' ? (picked.length ? 'Now tap a free table' : 'Tap the table to move') : `Tap tables to merge (${picked.length} picked)`}
              </span>
              {mode === 'merge' && <Button size="sm" disabled={picked.length < 2} onClick={doMerge}>Merge</Button>}
              <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {pendingQr.length > 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2"><Smartphone className="h-4 w-4" /> QR orders waiting</h3>
          <div className="flex flex-wrap gap-2">
            {pendingQr.map((o) => (
              <Button key={o.id} size="sm" variant="outline" className="bg-white" onClick={() => navigate(`/admin/orders?order=${o.id}`)}>
                {o.tableName || `#${o.orderNo}`} · {o.items.filter((i) => i.status === 'awaiting_acceptance').length} items
              </Button>
            ))}
          </div>
        </Card>
      )}

      {grouped.map((area) => (
        <section key={area.id || 'none'}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">{area.name}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
            {area.tables.map((t) => (
              <button
                key={t.id}
                onClick={() => click(t)}
                className={`relative aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition shadow-sm
                  ${STATUS_STYLE[t.status]} ${picked.includes(t.id) ? 'ring-4 ring-accent' : ''}`}
              >
                <span className="text-lg font-bold">{t.name}</span>
                {t.status === 'free' ? (
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" />{t.capacity}</span>
                ) : (
                  <>
                    <span className="text-sm font-semibold tabular-nums">{formatMoneyShort(t.amount)}</span>
                    <span className="text-[11px] text-gray-600 flex items-center gap-1"><Clock className="h-3 w-3" />{minutesSince(t.since)}m</span>
                  </>
                )}
                {t.status === 'billed' && <span className="absolute top-1 right-1 text-[9px] font-bold text-blue-700">BILLED</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      {!tables.length && (
        <Card className="p-8 text-center text-gray-600">
          No tables yet. <Button variant="link" onClick={() => navigate('/admin/qr-codes')}>Add tables</Button>
        </Card>
      )}

      {nonDineIn.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Takeaway & delivery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {nonDineIn.map((o) => (
              <Card key={o.id} className="p-3 cursor-pointer hover:shadow-md" onClick={() => navigate(`/admin/orders?order=${o.id}`)}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1"><ShoppingBag className="h-4 w-4" /> #{o.orderNo}</span>
                  <Badge variant="secondary" className="capitalize text-[10px]">{o.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{o.customer?.name || o.type.replace('_', ' ')}</p>
                <p className="text-sm font-semibold tabular-nums">{formatMoneyShort(o.amounts.total)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
