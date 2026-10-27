import React, { useEffect, useState } from 'react';
import { Clock, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKotsQuery, useReprintKotMutation, useUpdateKotMutation } from '@/store/endpoints/orders';
import { useMenuQuery } from '@/store/endpoints/menu';
import { useStationRoom } from '@/hooks/useRealtime';
import { toastError } from '@/lib/apiError';
import { printKot } from '@/lib/print';
import type { Kot, KotStatus } from '@/types/api';

const NEXT: Partial<Record<KotStatus, { to: KotStatus; label: string }>> = {
  pending: { to: 'preparing', label: 'Start' },
  preparing: { to: 'ready', label: 'Ready' },
  ready: { to: 'served', label: 'Served' },
};

const COLUMNS: { status: KotStatus; title: string; tone: string }[] = [
  { status: 'pending', title: 'New', tone: 'border-t-red-500' },
  { status: 'preparing', title: 'Cooking', tone: 'border-t-amber-500' },
  { status: 'ready', title: 'Ready to serve', tone: 'border-t-green-500' },
];

const STATION_KEY = 'sk.kitchenStation';

// Re-render every 30s so the "x min" timers stay current.
function useTick(ms = 30_000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

const age = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / 60000);

export const KitchenDisplay: React.FC = () => {
  useTick();
  const [station, setStation] = useState<string>(() => {
    try { return localStorage.getItem(STATION_KEY) || 'all'; } catch { return 'all'; }
  });
  const { data: menu } = useMenuQuery();
  const { data: kots = [], isLoading } = useKotsQuery(
    { status: ['pending', 'preparing', 'ready'], ...(station !== 'all' && { stationId: station }) },
    { pollingInterval: 30_000 }, // fallback if the socket drops
  );
  const [update] = useUpdateKotMutation();
  const [reprint] = useReprintKotMutation();
  useStationRoom(station === 'all' ? null : station);

  const stations = menu?.stations ?? [];
  const stationName = (id: string | null) => stations.find((s) => s.id === id)?.name;

  const pickStation = (v: string) => {
    setStation(v);
    try { localStorage.setItem(STATION_KEY, v); } catch { /* ignore */ }
  };

  const advance = (k: Kot) => {
    const next = NEXT[k.status];
    if (next) update({ id: k.id, status: next.to }).unwrap().catch(toastError);
  };

  const doPrint = async (k: Kot) => {
    try {
      const fresh = await reprint(k.id).unwrap();
      printKot(fresh, stationName(fresh.stationId));
    } catch (e) { toastError(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Select value={station} onValueChange={pickStation}>
          <SelectTrigger className="w-56 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stations</SelectItem>
            {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">{kots.length} open KOTs</span>
      </div>

      {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16 text-gray-400" /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const list = kots.filter((k) => k.status === col.status);
            return (
              <div key={col.status} className="space-y-3">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">{col.title} <Badge variant="secondary">{list.length}</Badge></h3>
                {list.map((k) => {
                  const mins = age(k.createdAt);
                  const late = k.status !== 'ready' && mins >= 20;
                  return (
                    <Card key={k.id} className={`border-t-4 ${col.tone} ${k.type === 'cancel' ? 'bg-red-50 border-red-300' : ''}`}>
                      <div className="p-3 border-b flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg leading-none">
                            {k.tableName || (k.orderType === 'takeaway' ? 'Takeaway' : 'Delivery')}
                            {k.type === 'cancel' && <span className="ml-2 text-red-600 text-sm">CANCEL</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">KOT {k.kotNo} · Order #{k.orderNo}{station === 'all' && stationName(k.stationId) ? ` · ${stationName(k.stationId)}` : ''}</p>
                        </div>
                        <span className={`text-sm flex items-center gap-1 ${late ? 'text-red-600 font-bold' : 'text-gray-500'}`}><Clock className="h-3.5 w-3.5" />{mins}m</span>
                      </div>
                      <ul className="p-3 space-y-1.5">
                        {k.items.map((i) => (
                          <li key={i.orderItemId} className={k.type === 'cancel' ? 'line-through text-red-700' : ''}>
                            <span className="font-bold mr-1">{i.qty}×</span>{i.name}{i.variantName && ` (${i.variantName})`}
                            {i.addons.length > 0 && <div className="text-xs text-gray-500 ml-5">+ {i.addons.join(', ')}</div>}
                            {i.note && <div className="text-xs text-amber-700 font-semibold ml-5">» {i.note}</div>}
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 pt-0 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => doPrint(k)} title="Print"><Printer className="h-4 w-4" /></Button>
                        {k.type === 'cancel' ? (
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => update({ id: k.id, status: 'served' }).unwrap().catch(toastError)}>Seen</Button>
                        ) : NEXT[k.status] && (
                          <Button size="sm" className="flex-1" onClick={() => advance(k)}>{NEXT[k.status]!.label}</Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {!list.length && <p className="text-sm text-gray-400 text-center py-6">Nothing here</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
