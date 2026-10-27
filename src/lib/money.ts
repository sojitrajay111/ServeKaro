// The API sends money as integer paise. Convert only at the edges: when showing
// a number and when reading what a person typed.

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatMoney = (paise: number | undefined | null) => inr.format((paise ?? 0) / 100);

// For dashboards and table tiles where paise are noise.
export const formatMoneyShort = (paise: number | undefined | null) => inrWhole.format(Math.round((paise ?? 0) / 100));

// "249.5" -> 24950. Returns NaN for junk so forms can show an error.
export const toPaise = (rupees: string | number) => {
  const n = typeof rupees === 'number' ? rupees : Number(String(rupees).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export const toRupees = (paise: number) => (paise / 100).toFixed(2).replace(/\.00$/, '');

export const unitWithAddons = (unitPrice: number, addons: { price: number }[] = []) =>
  unitPrice + addons.reduce((s, a) => s + a.price, 0);
