import { useState, useRef, useEffect } from 'react';

const BASE = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04';

const RANKS = [
  { label: 'Iron 1',      img: `${BASE}/3/largeicon.png` },
  { label: 'Iron 2',      img: `${BASE}/4/largeicon.png` },
  { label: 'Iron 3',      img: `${BASE}/5/largeicon.png` },
  { label: 'Bronze 1',    img: `${BASE}/6/largeicon.png` },
  { label: 'Bronze 2',    img: `${BASE}/7/largeicon.png` },
  { label: 'Bronze 3',    img: `${BASE}/8/largeicon.png` },
  { label: 'Silver 1',    img: `${BASE}/9/largeicon.png` },
  { label: 'Silver 2',    img: `${BASE}/10/largeicon.png` },
  { label: 'Silver 3',    img: `${BASE}/11/largeicon.png` },
  { label: 'Gold 1',      img: `${BASE}/12/largeicon.png` },
  { label: 'Gold 2',      img: `${BASE}/13/largeicon.png` },
  { label: 'Gold 3',      img: `${BASE}/14/largeicon.png` },
  { label: 'Platinum 1',  img: `${BASE}/15/largeicon.png` },
  { label: 'Platinum 2',  img: `${BASE}/16/largeicon.png` },
  { label: 'Platinum 3',  img: `${BASE}/17/largeicon.png` },
  { label: 'Diamond 1',   img: `${BASE}/18/largeicon.png` },
  { label: 'Diamond 2',   img: `${BASE}/19/largeicon.png` },
  { label: 'Diamond 3',   img: `${BASE}/20/largeicon.png` },
  { label: 'Ascendant 1', img: `${BASE}/21/largeicon.png` },
  { label: 'Ascendant 2', img: `${BASE}/22/largeicon.png` },
  { label: 'Ascendant 3', img: `${BASE}/23/largeicon.png` },
  { label: 'Immortal 1',  img: `${BASE}/24/largeicon.png` },
  { label: 'Immortal 2',  img: `${BASE}/25/largeicon.png` },
  { label: 'Immortal 3',  img: `${BASE}/26/largeicon.png` },
  { label: 'Radiant',     img: `${BASE}/27/largeicon.png` },
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
        <div className="absolute z-50 mt-1 w-full bg-valo-dark border border-valo-border rounded shadow-xl max-h-64 overflow-y-auto">
          <div
            className="px-3 py-2 hover:bg-valo-border cursor-pointer"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            <span className="text-valo-muted font-body text-sm">None</span>
          </div>
          {RANKS.map((r) => (
            <div
              key={r.label}
              onClick={() => { onChange(r.label); setOpen(false); }}
              className={`px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-valo-border transition-colors
                ${value === r.label ? 'bg-valo-border' : ''}`}
            >
              <img src={r.img} alt={r.label} className="w-7 h-7 object-contain flex-shrink-0" />
              <span className="text-valo-white font-body text-sm">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
