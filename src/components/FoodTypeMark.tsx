import type { FoodType } from '@/types/api';

// The FSSAI-style square: green dot = veg, brown triangle = non-veg, yellow dot = egg.
const COLOR: Record<FoodType, string> = { veg: '#16a34a', nonveg: '#92400e', egg: '#ca8a04' };
const LABEL: Record<FoodType, string> = { veg: 'Veg', nonveg: 'Non-veg', egg: 'Contains egg' };

export function FoodTypeMark({ type = 'veg', size = 14 }: { type?: FoodType; size?: number }) {
  const c = COLOR[type];
  return (
    <span
      role="img"
      aria-label={LABEL[type]}
      title={LABEL[type]}
      className="inline-flex items-center justify-center flex-shrink-0 border-2 rounded-[3px] bg-white"
      style={{ width: size, height: size, borderColor: c }}
    >
      {type === 'nonveg' ? (
        <span style={{ width: 0, height: 0, borderLeft: `${size * 0.25}px solid transparent`, borderRight: `${size * 0.25}px solid transparent`, borderBottom: `${size * 0.42}px solid ${c}` }} />
      ) : (
        <span className="rounded-full" style={{ width: size * 0.45, height: size * 0.45, background: c }} />
      )}
    </span>
  );
}
