import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, ChefHat, Droplets, Leaf, Loader2, Minus, Plus, Receipt, Search, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FoodTypeMark } from '@/components/FoodTypeMark';
import { ItemOptionsDialog, needsOptions, simpleLine, type ChosenLine } from '@/components/ItemOptionsDialog';
import { useCallWaiterMutation, usePlaceOrderMutation, usePublicMenuQuery, useQrContextQuery } from '@/store/endpoints/public';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { added, cartCount, cartSubtotal, customerSaved, lineKey, orderPlaced, qtyChanged, tableScanned } from '@/store/cart';
import { useMenuStock } from '@/hooks/useRealtime';
import { formatMoney, unitWithAddons } from '@/lib/money';
import { errorMessage, isApiError } from '@/lib/apiError';
import type { MenuItem, PublicMenu, PublicOutlet } from '@/types/api';

const TAG_LABEL = { popular: 'Popular', chefSpecial: "Chef's special", new: 'New', spicy: 'Spicy' } as const;

function MenuView({ outlet, menu, tableName, qrToken }: { outlet: PublicOutlet; menu: PublicMenu; tableName?: string; qrToken?: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cart = useAppSelector((s) => s.cart);
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [popularOnly, setPopularOnly] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [optionsFor, setOptionsFor] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customer, setCustomer] = useState(cart.customer);
  const [placeOrder, placing] = usePlaceOrderMutation();
  const [callWaiter] = useCallWaiterMutation();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  useMenuStock(outlet.slug);

  const canOrder = Boolean(qrToken) && outlet.isOpen && outlet.qrOrdering.enabled;
  const lines = qrToken && cart.qrToken === qrToken ? cart.lines : [];

  const sections = useMemo(() => {
    const term = q.trim().toLowerCase();
    return menu.categories.map((c) => ({
      ...c,
      items: menu.items.filter((i) => i.categoryId === c.id
        && (!vegOnly || i.foodType === 'veg')
        && (!popularOnly || i.tags.includes('popular') || i.tags.includes('chefSpecial'))
        && (!term || i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term))),
    })).filter((s) => s.items.length);
  }, [menu, q, vegOnly, popularOnly]);

  const qtyInCart = (itemId: string) => lines.filter((l) => l.itemId === itemId).reduce((s, l) => s + l.qty, 0);

  const add = (line: ChosenLine) => {
    const { addonIds, ...rest } = line;
    dispatch(added({ ...rest, addonIds, addons: line.addons }));
  };

  const tap = (item: MenuItem) => {
    if (!canOrder || !item.inStock) return;
    if (needsOptions(item, menu.addonGroups)) setOptionsFor(item);
    else add(simpleLine(item, 'dine_in'));
  };

  const decrement = (item: MenuItem) => {
    const line = [...lines].reverse().find((l) => l.itemId === item.id);
    if (line) dispatch(qtyChanged({ key: line.key, qty: line.qty - 1 }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(customerSaved(customer));
    try {
      const placed = await placeOrder({
        qrToken: qrToken!,
        customer: { name: customer.name.trim(), phone: customer.phone.trim() },
        items: lines.map(({ itemId, variantId, addonIds, qty, note }) => ({ itemId, variantId, addonIds, qty, note })),
      }).unwrap();
      dispatch(orderPlaced({ trackingToken: placed.trackingToken, orderNo: placed.orderNo, tableName, at: new Date().toISOString() }));
      setCartOpen(false);
      navigate(`/order/${placed.trackingToken}`);
    } catch (err) {
      toast.error(isApiError(err) && err.code === 'VALIDATION_ERROR' && err.errors
        ? Object.values(err.errors)[0][0]
        : errorMessage(err, 'Could not place the order'));
    }
  };

  const ring = (reason: 'waiter' | 'bill' | 'water') =>
    callWaiter({ qrToken: qrToken!, reason }).unwrap()
      .then(() => toast.success(reason === 'bill' ? 'The bill is on its way' : 'A waiter is coming'))
      .catch((e) => toast.error(isApiError(e) && e.code === 'RATE_LIMITED' ? 'Already called, please wait a moment' : errorMessage(e)));

  const scrollTo = (id: string) => {
    setActiveCat(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <SEO title={`${outlet.name} – Menu`} description={`Menu of ${outlet.name}${outlet.address ? `, ${outlet.address}` : ''}`} />
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{outlet.name}</h1>
              <p className="text-xs text-muted-foreground">
                {tableName ? `Table ${tableName}` : outlet.address}
                {!outlet.isOpen && <span className="text-red-600 font-semibold"> · Not taking orders now</span>}
              </p>
            </div>
            {cart.placed.length > 0 && <Button asChild variant="outline" size="sm"><Link to="/my-orders">My orders</Link></Button>}
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 rounded-2xl" placeholder="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            <button onClick={() => setVegOnly(!vegOnly)} className={`pill-button whitespace-nowrap flex items-center gap-1 ${vegOnly ? 'pill-button-active' : ''}`}><Leaf className="h-3 w-3" /> Veg only</button>
            <button onClick={() => setPopularOnly(!popularOnly)} className={`pill-button whitespace-nowrap flex items-center gap-1 ${popularOnly ? 'pill-button-active' : ''}`}><Star className="h-3 w-3" /> Popular</button>
            {menu.categories.filter((c) => sections.some((s) => s.id === c.id)).map((c) => (
              <button key={c.id} onClick={() => scrollTo(c.id)} className={`pill-button whitespace-nowrap ${activeCat === c.id ? 'pill-button-active' : ''}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {sections.map((s) => (
          <section key={s.id} ref={(el) => { sectionRefs.current[s.id] = el; }} className="pt-6 scroll-mt-40">
            <h2 className="text-lg font-bold mb-3">{s.name}</h2>
            <div className="divide-y divide-border/60">
              {s.items.map((item) => {
                const img = item.images.find((i) => i.isPrimary) ?? item.images[0];
                const inCart = qtyInCart(item.id);
                return (
                  <motion.div key={item.id} layout className={`flex gap-3 py-4 ${!item.inStock ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><FoodTypeMark type={item.foodType} />
                        {item.tags.slice(0, 2).map((t) => <span key={t} className="text-[10px] font-semibold uppercase text-accent">{TAG_LABEL[t]}</span>)}
                      </div>
                      <h3 className="font-semibold mt-1">{item.name}</h3>
                      <p className="text-sm font-medium mt-0.5">
                        {item.variants.length ? `${formatMoney(Math.min(...item.variants.map((v) => v.price)))} onwards` : formatMoney(item.price)}
                      </p>
                      {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="relative w-28 flex-shrink-0 flex flex-col items-center">
                      {img ? <img src={img.url} alt={item.name} loading="lazy" className="h-24 w-28 rounded-xl object-cover" /> : <div className="h-16" />}
                      {canOrder && (
                        !item.inStock ? (
                          <span className="-mt-3 bg-white border rounded-lg px-3 py-1 text-xs font-semibold text-red-600 shadow">Sold out</span>
                        ) : inCart && !needsOptions(item, menu.addonGroups) ? (
                          <div className="-mt-3 flex items-center bg-white border border-accent rounded-lg shadow">
                            <button className="px-2 py-1 text-accent" onClick={() => decrement(item)} aria-label="Less"><Minus className="h-4 w-4" /></button>
                            <span className="px-1 font-semibold text-accent">{inCart}</span>
                            <button className="px-2 py-1 text-accent" onClick={() => tap(item)} aria-label="More"><Plus className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => tap(item)} className="-mt-3 bg-white border border-accent text-accent font-bold text-sm rounded-lg px-5 py-1 shadow hover:bg-accent hover:text-accent-foreground transition">
                            ADD{inCart ? ` (${inCart})` : ''}
                          </button>
                        )
                      )}
                      {canOrder && needsOptions(item, menu.addonGroups) && item.inStock && <span className="text-[10px] text-muted-foreground mt-1">customisable</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
        {!sections.length && <p className="text-center text-muted-foreground py-16">No dishes match.</p>}
      </main>

      {qrToken && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-3xl mx-auto space-y-2">
            {canOrder && lines.length > 0 ? (
              <Button className="w-full h-14 text-base rounded-xl shadow-xl flex justify-between" onClick={() => setCartOpen(true)}>
                <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> {cartCount(lines)} item(s)</span>
                <span>{formatMoney(cartSubtotal(lines))} · View cart</span>
              </Button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="bg-background" onClick={() => ring('waiter')}><Bell className="h-4 w-4 mr-1" /> Waiter</Button>
                <Button variant="outline" className="bg-background" onClick={() => ring('water')}><Droplets className="h-4 w-4 mr-1" /> Water</Button>
                <Button variant="outline" className="bg-background" onClick={() => ring('bill')}><Receipt className="h-4 w-4 mr-1" /> Bill</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ItemOptionsDialog item={optionsFor} addonGroups={menu.addonGroups} orderType="dine_in" onClose={() => setOptionsFor(null)} onAdd={add} />

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your order{tableName && ` · Table ${tableName}`}</DialogTitle>
            <DialogDescription>Taxes are added on the bill.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y">
            {lines.map((l) => (
              <li key={l.key} className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{l.name}{l.variantName && ` (${l.variantName})`}</p>
                  {l.addons.length > 0 && <p className="text-xs text-muted-foreground">+ {l.addons.map((a) => a.name).join(', ')}</p>}
                  {l.note && <p className="text-xs text-amber-700">» {l.note}</p>}
                  <p className="text-sm">{formatMoney(unitWithAddons(l.unitPrice, l.addons) * l.qty)}</p>
                </div>
                <div className="flex items-center border border-accent rounded-lg">
                  <button className="px-2 py-1 text-accent" onClick={() => dispatch(qtyChanged({ key: l.key, qty: l.qty - 1 }))}><Minus className="h-4 w-4" /></button>
                  <span className="px-1 font-semibold">{l.qty}</span>
                  <button className="px-2 py-1 text-accent" onClick={() => dispatch(qtyChanged({ key: l.key, qty: l.qty + 1 }))}><Plus className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={submit} className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Your name</Label><Input required minLength={2} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} autoComplete="name" /></div>
              <div><Label className="text-xs">Mobile</Label><Input required inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} autoComplete="tel" /></div>
            </div>
            <Button type="submit" className="w-full h-12" disabled={placing.isLoading || !lines.length}>
              {placing.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Place order · {formatMoney(cartSubtotal(lines))}
            </Button>
            {outlet.qrOrdering.requireAcceptance && <p className="text-xs text-center text-muted-foreground">The staff will confirm your order in a moment.</p>}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center bg-background">{children}</div>
);

const NotFoundMenu = () => (
  <Centered>
    <ChefHat className="h-12 w-12 text-muted-foreground" />
    <h1 className="text-xl font-bold">Menu not found</h1>
    <p className="text-muted-foreground">This QR code may be old. Please ask the staff for help.</p>
  </Centered>
);

// /t/:qrToken: scanned at a table, can order.
export function TableMenuPage() {
  const { qrToken = '' } = useParams();
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useQrContextQuery(qrToken);
  useEffect(() => { if (qrToken) dispatch(tableScanned(qrToken)); }, [qrToken, dispatch]);

  if (isLoading) return <Centered><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></Centered>;
  if (isError || !data) return <NotFoundMenu />;
  return <MenuView outlet={data.outlet} menu={data.menu} tableName={data.table.name} qrToken={qrToken} />;
}

// /menu/:slug: browse only (shared link, website).
export default function RestaurantMenu() {
  const { restaurantId: slug = '' } = useParams();
  const { data, isLoading, isError } = usePublicMenuQuery(slug);
  if (isLoading) return <Centered><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></Centered>;
  if (isError || !data) return <NotFoundMenu />;
  return <MenuView outlet={data.outlet} menu={data.menu} />;
}
