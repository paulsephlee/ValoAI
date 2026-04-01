import { Routes, Route } from 'react-router-dom';
import SubmitPage from './pages/SubmitPage.tsx';
import ResultsPage from './pages/ResultsPage.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-valo-black flex flex-col">
      <header className="bg-valo-dark border-b-2 border-valo-red px-6 py-4 text-center">
        <p className="font-heading text-valo-red text-sm tracking-widest mb-1">VALORANT</p>
        <h1 className="font-heading text-valo-white text-4xl tracking-wide uppercase">
          Valo<span className="text-valo-red">AI</span>
        </h1>
        <p className="text-valo-muted text-sm tracking-widest uppercase mt-1 font-body font-medium">
          AI-Powered VOD Review
        </p>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/results/:jobId" element={<ResultsPage />} />
        </Routes>
      </main>

      <footer className="bg-valo-dark border-t border-valo-border text-center py-4 text-valo-muted text-xs tracking-widest font-body">
        VALOAI — AI VOD REVIEW
      </footer>
    </div>
  );
}
