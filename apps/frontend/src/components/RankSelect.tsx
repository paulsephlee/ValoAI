import { useState, useRef, useEffect } from 'react';

const RANKS = [
  { label: 'Iron 1',      img: '/ranks/iron1.png' },
  { label: 'Iron 2',      img: '/ranks/iron2.png' },
  { label: 'Iron 3',      img: '/ranks/iron3.png' },
  { label: 'Bronze 1',    img: '/ranks/bronze1.png' },
  { label: 'Bronze 2',    img: '/ranks/bronze2.png' },
  { label: 'Bronze 3',    img: '/ranks/bronze3.png' },
  { label: 'Silver 1',    img: '/ranks/silver1.png' },
  { label: 'Silver 2',    img: '/ranks/silver2.png' },
  { label: 'Silver 3',    img: '/ranks/silver3.png' },
  { label: 'Gold 1',      img: '/ranks/gold1.png' },
  { label: 'Gold 2',      img: '/ranks/gold2.png' },
  { label: 'Gold 3',      img: '/ranks/gold3.png' },
  { label: 'Platinum 1',  img: '/ranks/platinum1.png' },
  { label: 'Platinum 2',  img: '/ranks/platinum2.png' },
  { label: 'Platinum 3',  img: '/ranks/platinum3.png' },
  { label: 'Diamond 1',   img: '/ranks/diamond1.png' },
  { label: 'Diamond 2',   img: '/ranks/diamond2.png' },
  { label: 'Diamond 3',   img: '/ranks/diamond3.png' },
  { label: 'Ascendant 1', img: '/ranks/ascendant1.png' },
  { label: 'Ascendant 2', img: '/ranks/ascendant2.png' },
  { label: 'Ascendant 3', img: '/ranks/ascendant3.png' },
  { label: 'Immortal 1',  img: '/ranks/immortal1.png' },
  { label: 'Immortal 2',  img: '/ranks/immortal2.png' },
  { label: 'Immortal 3',  img: '/ranks/immortal3.png' },
  { label: 'Radiant',     img: '/ranks/radiant.png' },
];

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

  const selected = RANKS.find((r) => r.label === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-valo-dark border border-valo-border rounded px-3 py-2 text-left
                   flex items-center gap-2 focus:outline-none focus:border-valo-red transition-colors"
      >
        {selected ? (
          <>
            <img src={selected.img} alt={selected.label} className="w-7 h-7 object-contain flex-shrink-0" />
            <span className="text-valo-white font-body text-sm flex-1">{selected.label}</span>
          </>
        ) : (
          <span className="text-valo-muted font-body text-sm flex-1">Select rank...</span>
        )}
        <span className="text-valo-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="fixed z-[9999] bg-[#0f1923] border border-[#2a3441] rounded shadow-2xl overflow-y-auto"
          style={{
            width: ref.current?.getBoundingClientRect().width,
            top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 4,
            left: ref.current?.getBoundingClientRect().left,
            maxHeight: 260,
          }}
        >
          <div
            className="px-3 py-2 hover:bg-[#1a2535] cursor-pointer"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            <span className="text-[#8b9eb0] font-body text-sm">None</span>
          </div>
          {RANKS.map((r) => (
            <div
              key={r.label}
              onClick={() => { onChange(r.label); setOpen(false); }}
              className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors
                ${value === r.label ? 'bg-[#1a2535]' : 'hover:bg-[#1a2535]'}`}
            >
              <img src={r.img} alt={r.label} className="w-7 h-7 object-contain flex-shrink-0" />
              <span className="text-white font-body text-sm">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
