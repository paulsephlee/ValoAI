import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

function formatAvg(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function SubmitPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [avgTime, setAvgTime] = useState<string | null>(null);
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

      {!uploading && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            { icon: '✓', label: 'What You Did Well', desc: 'Highlights the plays and decisions you got right', color: 'text-green-400' },
            { icon: '✗', label: 'Mistakes', desc: 'Flags errors with timestamps and severity levels', color: 'text-red-700' },
            { icon: '📈', label: 'How to Improve', desc: 'Actionable tips across aim, positioning, utility and more', color: 'text-blue-400' },
            { icon: '👥', label: 'Team Positioning', desc: 'Spots where your team\'s setup cost you the round', color: 'text-purple-400' },
            { icon: '🎙️', label: 'Team Communication', desc: 'Listens to your comms and grades callouts and shot-calling', color: 'text-cyan-400' },
            { icon: '💬', label: 'Ask the AI', desc: 'Chat with the AI about any moment in your clip', color: 'text-valo-red' },
          ].map(({ icon, label, desc, color }) => (
            <div key={label} className="bg-valo-dark border border-valo-border rounded-lg p-4 flex gap-3">
              <span className={`text-lg flex-shrink-0 ${color}`}>{icon}</span>
              <div>
                <p className={`font-heading text-xs uppercase tracking-wider ${color}`}>{label}</p>
                <p className="text-valo-muted text-xs mt-0.5 font-body">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-valo-red rounded text-valo-red text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
