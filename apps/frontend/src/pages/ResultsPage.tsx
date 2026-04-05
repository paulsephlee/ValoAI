import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import type { JobResponse, Mistake, Improvement, TeamImprovement, TeamCommunication, Round, EconomyIssue, AgentCoaching, MapMeta } from '@valoai/shared';

type ChatMessage = { role: 'user' | 'model'; text: string };

function ChatSidebar({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "I've reviewed your analysis. What would you like to know about your gameplay?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages
      .slice(1)
      .map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

    try {
      const res = await fetch(`${BACKEND}/api/jobs/${jobId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: 'Sorry, something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-valo-dark border-l border-valo-border flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-valo-border">
        <h3 className="font-heading text-valo-white uppercase tracking-wider text-sm">Ask About Your Clip</h3>
        <button onClick={onClose} className="text-valo-muted hover:text-valo-white text-xl leading-none">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-body ${
              m.role === 'user'
                ? 'bg-valo-red text-white'
                : 'bg-valo-border text-valo-white'
            }`}>
              {m.role === 'user' ? m.text : (
                <ReactMarkdown
                  components={{
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-valo-border rounded-lg px-3 py-2 text-valo-muted text-sm">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-valo-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask anything about your gameplay..."
          className="flex-1 bg-white border border-valo-border rounded px-3 py-2 text-black placeholder-gray-400 text-sm focus:outline-none focus:border-valo-red"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-valo-red text-white font-heading uppercase tracking-wider px-4 py-2 rounded text-xs disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  );
}

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
  open,
  onToggle,
  children,
}: {
  title: string;
  color: string;
  bg: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-valo-dark border border-valo-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
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
  const [chatOpen, setChatOpen] = useState(false);
  const [sections, setSections] = useState({
    positives: true,
    mistakes: true,
    improvements: true,
    communication: true,
    teamImprovements: true,
    rounds: true,
    economy: true,
    agentCoaching: true,
    mapMeta: true,
  });

  const allOpen = Object.values(sections).every(Boolean);

  function toggle(key: keyof typeof sections) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAll() {
    const next = !allOpen;
    setSections({ positives: next, mistakes: next, improvements: next, communication: next, teamImprovements: next, rounds: next, economy: next, agentCoaching: next, mapMeta: next });
  }

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
      {/* Collapse / Expand all */}
      <div className="flex justify-end">
        <button
          onClick={toggleAll}
          className="text-valo-muted text-xs font-heading uppercase tracking-wider hover:text-valo-white transition-colors"
        >
          {allOpen ? 'Collapse All ▲' : 'Expand All ▼'}
        </button>
      </div>

      {/* Overall rating — always visible, not collapsible */}
      <div className="bg-valo-dark border border-valo-border rounded-lg p-6">
        <p className="text-valo-muted text-xs uppercase tracking-widest font-body font-bold mb-1">Overall Rating</p>
        <p className="text-valo-white font-body text-base">{result.summary}</p>
      </div>

      {/* Positives */}
      {result.positives.length > 0 && (
        <Section title="What You Did Well" color="text-green-400" bg="bg-green-900/20" open={sections.positives} onToggle={() => toggle('positives')}>
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
        <Section title="Mistakes" color="text-valo-red" bg="bg-red-900/20" open={sections.mistakes} onToggle={() => toggle('mistakes')}>
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
        <Section title="How to Improve" color="text-blue-400" bg="bg-blue-900/20" open={sections.improvements} onToggle={() => toggle('improvements')}>
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

      {/* Team Communication */}
      {result.team_communication.length > 0 && (
        <Section title="Team Communication" color="text-cyan-400" bg="bg-cyan-900/20" open={sections.communication} onToggle={() => toggle('communication')}>
          <ul className="divide-y divide-valo-border">
            {result.team_communication.map((c: TeamCommunication, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className={`mt-0.5 flex-shrink-0 ${c.type === 'positive' ? 'text-green-400' : 'text-red-700'}`}>
                  {c.type === 'positive' ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm ${c.type === 'positive' ? 'text-valo-white' : 'text-valo-white'}`}>{c.observation}</p>
                  {c.timestamp && <p className="text-valo-muted text-xs mt-0.5">{c.timestamp}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Team Improvements */}
      {result.team_improvements.length > 0 && (
        <Section title="How to Improve As a Team" color="text-purple-400" bg="bg-purple-900/20" open={sections.teamImprovements} onToggle={() => toggle('teamImprovements')}>
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

      {/* Round-by-Round Breakdown */}
      {result.rounds && result.rounds.length > 0 && (
        <Section title="Round-by-Round Breakdown" color="text-amber-400" bg="bg-amber-900/20" open={sections.rounds} onToggle={() => toggle('rounds')}>
          <ul className="divide-y divide-valo-border">
            {result.rounds.map((r: Round, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 text-center min-w-[2.5rem]">
                  <span className="text-xs font-heading text-valo-muted uppercase">R{r.round_number}</span>
                  <div className={`text-xs font-bold uppercase mt-0.5 ${r.outcome === 'win' ? 'text-green-400' : 'text-valo-red'}`}>
                    {r.outcome === 'win' ? 'WIN' : 'LOSS'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-valo-white font-body text-sm">{r.summary}</p>
                  <p className="text-amber-400 text-xs mt-1">⚡ {r.key_moment}</p>
                  {r.economy && <p className="text-valo-muted text-xs mt-0.5">💰 {r.economy}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Economy Issues */}
      {result.economy_issues && result.economy_issues.length > 0 && (
        <Section title="Economy Tracking" color="text-yellow-400" bg="bg-yellow-900/20" open={sections.economy} onToggle={() => toggle('economy')}>
          <ul className="divide-y divide-valo-border">
            {result.economy_issues.map((e: EconomyIssue, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="flex-shrink-0 text-xs font-heading text-valo-muted uppercase min-w-[2.5rem]">R{e.round_number}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-valo-white font-body text-sm">{e.issue}</p>
                  <p className="text-valo-muted text-xs mt-0.5">Impact: {e.impact}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Agent-Specific Coaching */}
      {result.agent_coaching && result.agent_coaching.length > 0 && (
        <Section title="Agent Coaching" color="text-pink-400" bg="bg-pink-900/20" open={sections.agentCoaching} onToggle={() => toggle('agentCoaching')}>
          <ul className="divide-y divide-valo-border">
            {result.agent_coaching.map((a: AgentCoaching, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-pink-400 text-sm font-heading uppercase flex-shrink-0 min-w-[4rem]">{a.ability}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-valo-white font-body text-sm">{a.advice}</p>
                  {a.timestamp && <p className="text-valo-muted text-xs mt-0.5">{a.timestamp}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Map Meta */}
      {result.map_meta && (
        <Section title={`Map Meta — ${(result.map_meta as MapMeta).detected_map}`} color="text-teal-400" bg="bg-teal-900/20" open={sections.mapMeta} onToggle={() => toggle('mapMeta')}>
          <div className="px-4 py-3 space-y-4">
            {(result.map_meta as MapMeta).pro_meta_notes.length > 0 && (
              <div>
                <p className="text-teal-400 text-xs font-heading uppercase tracking-wider mb-2">VCT Pro Meta</p>
                <ul className="space-y-1">
                  {(result.map_meta as MapMeta).pro_meta_notes.map((note: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-valo-white font-body text-sm">
                      <span className="text-teal-400 flex-shrink-0 mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(result.map_meta as MapMeta).player_deviation.length > 0 && (
              <div>
                <p className="text-orange-400 text-xs font-heading uppercase tracking-wider mb-2">Your Deviations from Meta</p>
                <ul className="space-y-1">
                  {(result.map_meta as MapMeta).player_deviation.map((dev: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-valo-white font-body text-sm">
                      <span className="text-orange-400 flex-shrink-0 mt-0.5">△</span>
                      {dev}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/upload')}
          className="border border-valo-border text-valo-muted font-heading uppercase tracking-wider
                     py-3 rounded hover:border-valo-muted hover:text-valo-white transition-colors text-sm"
        >
          Analyze Another Clip
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
          className="border border-valo-border text-valo-muted font-heading uppercase tracking-wider
                     py-3 rounded hover:border-valo-muted hover:text-valo-white transition-colors text-sm"
        >
          Share Results 🔗
        </button>
      </div>

      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 bg-valo-red text-white font-heading uppercase tracking-wider
                   px-5 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity text-sm z-40"
      >
        Ask AI 💬
      </button>

      {chatOpen && <ChatSidebar jobId={jobId!} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
