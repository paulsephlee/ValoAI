import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

const urlSchema = z.object({ url: z.string().url('Please enter a valid URL') });
type UrlForm = z.infer<typeof urlSchema>;

export default function SubmitPage() {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<UrlForm>({
    resolver: zodResolver(urlSchema),
  });

  async function onUrlSubmit(data: UrlForm) {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(`${BACKEND}/api/analyze/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Submission failed');
      }
      const { jobId } = await res.json();
      navigate(`/results/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setError('File must be under 500MB');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BACKEND}/api/analyze/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Upload failed');
      }
      const { jobId } = await res.json();
      navigate(`/results/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-heading text-valo-white text-2xl uppercase tracking-wider">
          Submit Your Clip
        </h2>
        <p className="text-valo-muted text-base mt-2">
          Upload a clip or paste a video URL. Max 10 minutes.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border border-valo-border rounded overflow-hidden mb-6">
        {(['url', 'upload'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 font-heading tracking-wider text-sm uppercase transition-colors
              ${tab === t
                ? 'bg-valo-red text-valo-white'
                : 'bg-valo-dark text-valo-muted hover:text-valo-white'
              }`}
          >
            {t === 'url' ? 'Paste URL' : 'Upload File'}
          </button>
        ))}
      </div>

      {/* URL tab */}
      {tab === 'url' && (
        <form onSubmit={handleSubmit(onUrlSubmit)} className="space-y-4">
          <div>
            <input
              {...register('url')}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-valo-dark border border-valo-border rounded px-4 py-3
                         text-valo-white placeholder-valo-muted font-body text-base
                         focus:outline-none focus:border-valo-red transition-colors"
            />
            {errors.url && (
              <p className="text-valo-red text-sm mt-1">{errors.url.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-valo-red text-valo-white font-heading uppercase tracking-wider
                       py-3 rounded transition-opacity disabled:opacity-50 hover:opacity-90"
          >
            {uploading ? 'Submitting...' : 'Analyze Clip'}
          </button>
        </form>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          <label
            className={`block border-2 border-dashed border-valo-border rounded-lg p-10
                        text-center cursor-pointer transition-colors hover:border-valo-red
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="text-valo-muted text-4xl mb-3">▲</div>
            <p className="text-valo-white font-body font-semibold">
              {uploading ? 'Uploading...' : 'Click to select a video file'}
            </p>
            <p className="text-valo-muted text-sm mt-1">MP4, MOV, AVI — max 500MB, 10 min</p>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={onFileChange}
              disabled={uploading}
            />
          </label>
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
