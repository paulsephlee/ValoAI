import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '✓', label: 'What You Did Well', desc: 'Highlights the plays and decisions you got right', color: 'text-green-400', bg: 'bg-green-900/10 border-green-900/40' },
  { icon: '✗', label: 'Mistakes', desc: 'Flags errors with timestamps and severity levels', color: 'text-red-700', bg: 'bg-red-900/10 border-red-900/40' },
  { icon: '📈', label: 'How to Improve', desc: 'Actionable tips across aim, positioning, utility and more', color: 'text-blue-400', bg: 'bg-blue-900/10 border-blue-900/40' },
  { icon: '👥', label: 'Team Positioning', desc: 'Spots where your team\'s setup cost you the round', color: 'text-purple-400', bg: 'bg-purple-900/10 border-purple-900/40' },
  { icon: '🎙️', label: 'Team Communication', desc: 'Listens to your comms and grades callouts and shot-calling', color: 'text-cyan-400', bg: 'bg-cyan-900/10 border-cyan-900/40' },
  { icon: '💬', label: 'Ask the AI', desc: 'Chat with the AI about any moment in your clip after the analysis', color: 'text-valo-red', bg: 'bg-red-900/10 border-red-900/40' },
];

const STEPS = [
  { number: '01', title: 'Upload Your Clip', desc: 'Upload any Valorant gameplay video up to 60 minutes and 2GB.' },
  { number: '02', title: 'AI Analyzes It', desc: 'Our AI watches your full clip and breaks down every key moment.' },
  { number: '03', title: 'Get Pro Feedback', desc: 'Receive detailed, timestamped feedback calibrated to VCT pro standards.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-20 py-6">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-block bg-valo-red/10 border border-valo-red/30 rounded-full px-4 py-1 text-valo-red text-xs font-heading uppercase tracking-widest">
          AI-Powered VOD Review
        </div>
        <h2 className="font-heading text-valo-white text-4xl sm:text-5xl uppercase tracking-wide leading-tight">
          Stop Guessing.<br />
          <span className="text-valo-red">Start Winning.</span>
        </h2>
        <p className="text-valo-muted text-base max-w-xl mx-auto font-body leading-relaxed">
          Upload your Valorant gameplay and get instant, detailed AI coaching — calibrated against VCT professional standards. Know exactly what you did wrong, why it cost you the round, and how to fix it.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="inline-block bg-valo-red text-white font-heading uppercase tracking-wider
                     px-10 py-4 rounded hover:opacity-90 transition-opacity text-base"
        >
          Analyze My Clip
        </button>
      </section>

      {/* How it works */}
      <section>
        <h3 className="font-heading text-valo-white uppercase tracking-wider text-center text-lg mb-8">
          How It Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map(({ number, title, desc }) => (
            <div key={number} className="bg-valo-dark border border-valo-border rounded-lg p-6 text-center">
              <div className="text-valo-red font-heading text-3xl mb-3">{number}</div>
              <p className="font-heading text-valo-white uppercase tracking-wider text-sm mb-2">{title}</p>
              <p className="text-valo-muted text-sm font-body">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section>
        <h3 className="font-heading text-valo-white uppercase tracking-wider text-center text-lg mb-8">
          What You Get
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, label, desc, color, bg }) => (
            <div key={label} className={`border rounded-lg p-4 flex gap-4 ${bg}`}>
              <span className={`text-2xl flex-shrink-0 ${color}`}>{icon}</span>
              <div>
                <p className={`font-heading text-sm uppercase tracking-wider ${color}`}>{label}</p>
                <p className="text-valo-muted text-sm mt-1 font-body">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-valo-dark border border-valo-border rounded-lg p-10 space-y-4">
        <h3 className="font-heading text-valo-white uppercase tracking-wider text-xl">
          Ready to Rank Up?
        </h3>
        <p className="text-valo-muted font-body text-sm">
          Upload your clip and get your full analysis in minutes.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="inline-block bg-valo-red text-white font-heading uppercase tracking-wider
                     px-10 py-4 rounded hover:opacity-90 transition-opacity text-base"
        >
          Get Started
        </button>
      </section>
    </div>
  );
}
