import type { Bill, Kot, Outlet } from '@/types/api';
import { formatMoney } from './money';

// Browser printing for 80mm thermal printers until the local print agent
// exists. Opens a small window with plain HTML and prints it.

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const page = (title: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  body { font: 12px/1.35 ui-monospace, Menlo, Consolas, monospace; width: 74mm; margin: 0 auto; color: #000; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; }
  .big { font-size: 15px; } hr { border: 0; border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; } td { vertical-align: top; padding: 1px 0; }
  .muted { color: #333; font-size: 11px; }
</style></head><body>${body}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script></body></html>`;

function open(html: string) {
  const w = window.open('', '_blank', 'width=360,height=640');
  if (!w) {
    alert('Allow pop-ups for this site to print.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

const ORDER_TYPE = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' } as const;

export function printBill(bill: Bill, outlet: Outlet | undefined, { duplicate = false } = {}) {
  const a = bill.amounts;
  const rows = bill.lines.map((l) => `<tr><td>${esc(l.name)}<div class="muted">${l.qty} × ${formatMoney(l.unitPrice)}</div></td><td class="r">${formatMoney(l.amount)}</td></tr>`).join('');
  const taxes = a.taxes.map((t) => `<tr><td>${esc(t.name)} @${t.rate}%</td><td class="r">${formatMoney(t.amount)}</td></tr>`).join('');
  const payments = bill.payments.map((p) => `<tr><td>Paid (${esc(p.mode.toUpperCase())})</td><td class="r">${formatMoney(p.amount)}</td></tr>`).join('');

  open(page(bill.billNo, `
    <h1>${esc(outlet?.name)}</h1>
    ${outlet?.address ? `<div class="c muted">${esc(outlet.address)}</div>` : ''}
    ${outlet?.phone ? `<div class="c muted">Ph: ${esc(outlet.phone)}</div>` : ''}
    ${outlet?.gstin ? `<div class="c muted">GSTIN: ${esc(outlet.gstin)}</div>` : ''}
    ${outlet?.fssai ? `<div class="c muted">FSSAI: ${esc(outlet.fssai)}</div>` : ''}
    ${outlet?.bill.header ? `<div class="c">${esc(outlet.bill.header)}</div>` : ''}
    <hr><div class="c b">${duplicate ? 'DUPLICATE ' : ''}TAX INVOICE</div><hr>
    <table>
      <tr><td>Bill: <span class="b">${esc(bill.billNo)}</span></td><td class="r">${new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>
      <tr><td>${ORDER_TYPE[bill.orderType]}${bill.tableName ? ` · ${esc(bill.tableName)}` : ''}</td><td class="r">Order #${bill.orderNo}</td></tr>
      ${bill.customer?.name ? `<tr><td colspan="2">Customer: ${esc(bill.customer.name)}${bill.customer.phone ? ` (${esc(bill.customer.phone)})` : ''}</td></tr>` : ''}
      ${bill.customer?.gstin ? `<tr><td colspan="2">Customer GSTIN: ${esc(bill.customer.gstin)}</td></tr>` : ''}
    </table><hr>
    <table>${rows}</table><hr>
    <table>
      <tr><td>Subtotal</td><td class="r">${formatMoney(a.subtotal)}</td></tr>
      ${a.discount ? `<tr><td>Discount${bill.discounts[0]?.reason ? ` (${esc(bill.discounts[0].reason)})` : ''}</td><td class="r">-${formatMoney(a.discount)}</td></tr>` : ''}
      ${a.serviceCharge ? `<tr><td>Service charge</td><td class="r">${formatMoney(a.serviceCharge)}</td></tr>` : ''}
      ${taxes}
      ${a.roundOff ? `<tr><td>Round off</td><td class="r">${formatMoney(a.roundOff)}</td></tr>` : ''}
      <tr class="b big"><td>TOTAL</td><td class="r">${formatMoney(a.total)}</td></tr>
      ${payments}
      ${bill.due > 0 && bill.status !== 'void' ? `<tr class="b"><td>Due</td><td class="r">${formatMoney(bill.due)}</td></tr>` : ''}
    </table>
    ${bill.isComplimentary ? '<hr><div class="c b">COMPLIMENTARY</div>' : ''}
    ${bill.status === 'void' ? '<hr><div class="c b">VOID</div>' : ''}
    <hr><div class="c">${esc(outlet?.bill.footer || 'Thank you!')}</div>
  `));
}

export function printKot(kot: Kot, stationName?: string) {
  const rows = kot.items.map((i) => `
    <tr><td class="b big">${i.qty} ×</td><td class="big">${esc(i.name)}${i.variantName ? ` (${esc(i.variantName)})` : ''}
      ${i.addons.length ? `<div class="muted">+ ${i.addons.map(esc).join(', ')}</div>` : ''}
      ${i.note ? `<div class="b">» ${esc(i.note)}</div>` : ''}</td></tr>`).join('');
  open(page(`KOT ${kot.kotNo}`, `
    <h1>${kot.type === 'cancel' ? '*** CANCEL ***' : 'KOT'} #${kot.kotNo}</h1>
    <div class="c">${stationName ? esc(stationName) + ' · ' : ''}${ORDER_TYPE[kot.orderType]}${kot.tableName ? ` · <span class="b big">${esc(kot.tableName)}</span>` : ''}</div>
    <div class="c muted">Order #${kot.orderNo} · ${new Date(kot.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}${kot.printCount ? ' · REPRINT' : ''}</div>
    <hr><table>${rows}</table><hr>
  `));
}
