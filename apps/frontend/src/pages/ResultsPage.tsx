import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { JobResponse, Mistake, Improvement, TeamImprovement } from '@valoai/shared';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

const STAGE_LABELS: Record<string, string> = {
  queued: 'Waiting in queue...',
  downloading: 'Downloading your clip...',
  uploading: 'Uploading to AI...',
  analyzing: 'Analyzing your gameplay...',
  complete: 'Analysis complete',
  failed: 'Analysis failed',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  medium: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  high: 'text-valo-red border-valo-red/30 bg-valo-red/10',
};

const CATEGORY_ICONS: Record<string, string> = {
  positioning: '📍',
  utility: '💥',
  aim: '🎯',
  'game-sense': '🧠',
  communication: '🎙️',
};

function Section({
  title,
  color,
  bg,
  defaultOpen = true,
  children,
}: {
  title: string;
  color: string;
  bg: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-valo-dark border border-valo-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 ${bg} border-b border-valo-border`}
      >
        <h3 className={`font-heading ${color} uppercase tracking-wider text-sm`}>{title}</h3>
        <span className={`text-xs ${color} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}

export default function ResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data, error } = useQuery<JobResponse>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Job not found');
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'complete' || status === 'failed') return false;
      return 4000;
    },
    enabled: !!jobId,
  });

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-valo-red text-lg">Job not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-valo-muted underline text-sm">
          Back to submit
        </button>
      </div>
    );
  }

  if (!data || data.status !== 'complete') {
    const isFailed = data?.status === 'failed';
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        {!isFailed && (
          <div className="w-12 h-12 border-4 border-valo-red border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        )}
        <p className={`text-lg font-body font-semibold ${isFailed ? 'text-valo-red' : 'text-valo-white'}`}>
          {STAGE_LABELS[data?.status ?? 'queued']}
        </p>
        {isFailed && data?.error && (
          <p className="text-valo-muted text-sm mt-2">{data.error}</p>
        )}
        {isFailed && (
          <button onClick={() => navigate('/')} className="mt-6 text-valo-muted underline text-sm">
            Try again
          </button>
        )}
      </div>
    );
  }

  const result = data.result!;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Overall rating — always visible, not collapsible */}
      <div className="bg-valo-dark border border-valo-border rounded-lg p-6 flex items-center justify-between">
        <div>
          <p className="text-valo-muted text-xs uppercase tracking-widest font-body font-bold mb-1">Overall Rating</p>
          <p className="text-valo-white font-body text-base">{result.summary}</p>
        </div>
        <div className="text-center ml-6 flex-shrink-0">
          <div className={`text-5xl font-heading ${result.overall_rating >= 7 ? 'text-green-400' : result.overall_rating >= 4 ? 'text-yellow-400' : 'text-valo-red'}`}>
            {result.overall_rating}
          </div>
          <div className="text-valo-muted text-xs">/10</div>
        </div>
      </div>

      {/* Positives */}
      {result.positives.length > 0 && (
        <Section title="What You Did Well" color="text-green-400" bg="bg-green-900/20">
          <ul className="divide-y divide-valo-border">
            {result.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 text-valo-white font-body text-sm">
                <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Mistakes */}
      {result.mistakes.length > 0 && (
        <Section title="Mistakes" color="text-valo-red" bg="bg-red-900/20">
          <ul className="divide-y divide-valo-border">
            {result.mistakes.map((m: Mistake, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border mt-0.5 flex-shrink-0 uppercase ${SEVERITY_COLORS[m.severity]}`}>
                  {m.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-valo-white font-body text-sm">{m.description}</p>
                  <p className="text-valo-muted text-xs mt-0.5">{m.timestamp}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <Section title="How to Improve" color="text-blue-400" bg="bg-blue-900/20">
          <ul className="divide-y divide-valo-border">
            {result.improvements.map((imp: Improvement, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[imp.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-valo-muted text-xs uppercase tracking-wide font-bold mb-0.5">{imp.category}</p>
                  <p className="text-valo-white font-body text-sm">{imp.advice}</p>
                  {imp.timestamp && <p className="text-valo-muted text-xs mt-0.5">{imp.timestamp}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Team Improvements */}
      {result.team_improvements.length > 0 && (
        <Section title="How to Improve As a Team" color="text-purple-400" bg="bg-purple-900/20">
          <ul className="divide-y divide-valo-border">
            {result.team_improvements.map((t: TeamImprovement, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">👥</span>
                <div className="flex-1 min-w-0">
                  <p className="text-valo-white font-body text-sm">{t.advice}</p>
                  {t.timestamp && <p className="text-valo-muted text-xs mt-0.5">{t.timestamp}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full border border-valo-border text-valo-muted font-heading uppercase tracking-wider
                   py-3 rounded hover:border-valo-muted hover:text-valo-white transition-colors text-sm"
      >
        Analyze Another Clip
      </button>
    </div>
  );
}
