'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BannerManager() {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSuccess(false); setError('');

    try {
      const res = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, linkUrl }),
        cache: 'no-store'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update banner');
      }

      setSuccess(true);
      setImageUrl(''); setLinkUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-[#F8F9FA] text-gray-900 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#5e1515]">Banner Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Update the promotional banner visible to students.</p>
        </div>
        <Link href="/teacher" className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Update Active Banner</h2>

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-bold border border-green-200 flex items-center gap-2">
              ✅ Banner updated successfully! It is now live.
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm font-bold border border-red-200">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="url" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5e1515]/50" placeholder="https://example.com/banner.jpg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Link URL</label>
              <input type="url" required value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5e1515]/50" placeholder="https://example.com/promo" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5e1515] text-white font-bold py-3 rounded-lg hover:bg-[#4a1010] transition-colors disabled:bg-gray-400 mt-4">
              {loading ? 'Updating...' : 'Update Banner'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
            Live Preview
            <span className="text-xs font-bold text-[#B8860B] bg-[#B8860B]/10 px-2 py-1 rounded">Mobile App View</span>
          </h2>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-center min-h-[250px]">
            {imageUrl ? (
              <a href={linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm rounded-lg overflow-hidden shadow-md border border-gray-200 hover:opacity-90 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Banner Preview" className="w-full h-auto object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x150?text=Invalid+Image+URL'; }} />
              </a>
            ) : (
              <div className="text-center text-gray-400">
                <p>Paste an Image URL to see the preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}