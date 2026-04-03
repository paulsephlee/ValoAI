import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

const RANKS = [
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant',
];

const AGENTS: Record<string, string[]> = {
  Duelists: ['Iso', 'Jett', 'Neon', 'Phoenix', 'Reyna', 'Raze', 'Yoru'],
  Initiators: ['Breach', 'Fade', 'Gekko', 'KAY/O', 'Skye', 'Sova'],
  Controllers: ['Astra', 'Brimstone', 'Harbor', 'Omen', 'Viper'],
  Sentinels: ['Chamber', 'Cypher', 'Deadlock', 'Killjoy', 'Sage', 'Vyse'],
};

function formatAvg(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const SELECT_CLASS = `w-full bg-valo-dark border border-valo-border rounded px-3 py-2.5
  text-valo-white font-body text-sm focus:outline-none focus:border-valo-red
  transition-colors appearance-none cursor-pointer`;

export default function SubmitPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [avgTime, setAvgTime] = useState<string | null>(null);
  const [rank, setRank] = useState('');
  const [agent, setAgent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND}/api/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data.avgSeconds) setAvgTime(formatAvg(data.avgSeconds));
      })
      .catch(() => {});
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2048 * 1024 * 1024) {
      setError('File must be under 2GB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append('file', file);
    if (rank) form.append('rank', rank);
    if (agent) form.append('agent', agent);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { jobId } = JSON.parse(xhr.responseText);
        navigate(`/results/${jobId}`);
      } else {
        const json = JSON.parse(xhr.responseText);
        setError(json.error ?? 'Upload failed');
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError('Upload failed — check your connection and try again');
      setUploading(false);
    };

    xhr.open('POST', `${BACKEND}/api/analyze/upload`);
    xhr.send(form);
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-heading text-valo-white text-2xl uppercase tracking-wider">
          Submit Your Clip
        </h2>
        <p className="text-valo-muted text-base mt-2">
          Upload a video file for AI analysis. Max 60 minutes / 2GB.
        </p>
      </div>

      {!uploading && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Rank */}
          <div>
            <label className="block text-valo-muted text-xs uppercase tracking-wider font-heading mb-1.5">
              Your Rank <span className="normal-case text-valo-muted/60">(optional)</span>
            </label>
            <div className="relative">
              <select value={rank} onChange={(e) => setRank(e.target.value)} className={SELECT_CLASS}>
                <option value="">Select rank...</option>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-valo-muted text-xs pointer-events-none">▼</span>
            </div>
          </div>

          {/* Agent */}
          <div>
            <label className="block text-valo-muted text-xs uppercase tracking-wider font-heading mb-1.5">
              Agent Played <span className="normal-case text-valo-muted/60">(optional)</span>
            </label>
            <div className="relative">
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className={SELECT_CLASS}>
                <option value="">Select agent...</option>
                {Object.entries(AGENTS).map(([role, agents]) => (
                  <optgroup key={role} label={role}>
                    {agents.map((a) => <option key={a} value={a}>{a}</option>)}
                  </optgroup>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-valo-muted text-xs pointer-events-none">▼</span>
            </div>
          </div>
        </div>
      )}

      <label
        className={`block border-2 border-dashed border-valo-border rounded-lg p-10
                    text-center cursor-pointer transition-colors hover:border-valo-red
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="text-valo-muted text-4xl mb-3">▲</div>
        <p className="text-valo-white font-body font-semibold">
          {uploading ? `Uploading... ${progress}%` : 'Click to select a video file'}
        </p>
        <p className="text-valo-muted text-sm mt-1">MP4, MOV, AVI — max 2GB, 60 min</p>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={onFileChange}
          disabled={uploading}
        />
      </label>

      {uploading && (
        <div className="mt-4 w-full bg-valo-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-valo-red h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {avgTime && !uploading && (
        <p className="text-center text-valo-muted text-sm mt-5">
          Average analysis time: <span className="text-valo-white font-semibold">{avgTime}</span>
        </p>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-valo-red rounded text-valo-red text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
