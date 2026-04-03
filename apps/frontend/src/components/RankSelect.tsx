import { useState, useRef, useEffect } from 'react';

const RANK_TIERS: { tier: string; color: string; bg: string; numbers: string[] }[] = [
  { tier: 'Iron',      color: '#8d8d8d', bg: '#2a2a2a', numbers: ['1','2','3'] },
  { tier: 'Bronze',    color: '#a0522d', bg: '#2d1f10', numbers: ['1','2','3'] },
  { tier: 'Silver',    color: '#b0b8c1', bg: '#1e2226', numbers: ['1','2','3'] },
  { tier: 'Gold',      color: '#f0b429', bg: '#2b2200', numbers: ['1','2','3'] },
  { tier: 'Platinum',  color: '#47b9c7', bg: '#0a2228', numbers: ['1','2','3'] },
  { tier: 'Diamond',   color: '#7b68ee', bg: '#16103a', numbers: ['1','2','3'] },
  { tier: 'Ascendant', color: '#4cb76a', bg: '#0d2218', numbers: ['1','2','3'] },
  { tier: 'Immortal',  color: '#e05252', bg: '#2a0d0d', numbers: ['1','2','3'] },
  { tier: 'Radiant',   color: '#ffe44d', bg: '#2b2400', numbers: [] },
];

function RankBadge({ tier, color, size = 'sm' }: { tier: string; color: string; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 28 : 22;
  const font = size === 'md' ? 9 : 7;
  const abbr = tier.slice(0, 2).toUpperCase();
  return (
    <svg width={dim} height={dim} viewBox="0 0 28 28" className="flex-shrink-0">
      <polygon
        points="14,2 26,8 26,20 14,26 2,20 2,8"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <text
        x="14"
        y="15"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={font + 3}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {abbr}
      </text>
    </svg>
  );
}

interface RankSelectProps {
  value: string;
  onChange: (val: string) => void;
}

export default function RankSelect({ value, onChange }: RankSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = RANK_TIERS.flatMap((t) =>
    t.numbers.length
      ? t.numbers.map((n) => ({ label: `${t.tier} ${n}`, tier: t.tier, color: t.color }))
      : [{ label: t.tier, tier: t.tier, color: t.color }]
  ).find((r) => r.label === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-valo-dark border border-valo-border rounded px-3 py-2.5 text-left
                   flex items-center gap-2 focus:outline-none focus:border-valo-red transition-colors"
      >
        {selected ? (
          <>
            <RankBadge tier={selected.tier} color={selected.color} />
            <span className="text-valo-white font-body text-sm flex-1">{selected.label}</span>
          </>
        ) : (
          <span className="text-valo-muted font-body text-sm flex-1">Select rank...</span>
        )}
        <span className="text-valo-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-valo-dark border border-valo-border rounded shadow-xl max-h-64 overflow-y-auto">
          <div
            className="px-3 py-2 hover:bg-valo-border cursor-pointer"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            <span className="text-valo-muted font-body text-sm">None</span>
          </div>
          {RANK_TIERS.map((t) => (
            <div key={t.tier}>
              <div className="px-3 py-1 border-t border-valo-border/50">
                <span className="text-xs uppercase tracking-wider font-heading" style={{ color: t.color }}>
                  {t.tier}
                </span>
              </div>
              {(t.numbers.length ? t.numbers : ['']).map((n) => {
                const label = n ? `${t.tier} ${n}` : t.tier;
                return (
                  <div
                    key={label}
                    onClick={() => { onChange(label); setOpen(false); }}
                    className={`px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-valo-border transition-colors
                      ${value === label ? 'bg-valo-border' : ''}`}
                  >
                    <RankBadge tier={t.tier} color={t.color} />
                    <span className="text-valo-white font-body text-sm">{label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
