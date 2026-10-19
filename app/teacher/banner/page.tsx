'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BannerManager() {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [title, setTitle] = useState('Upgrade Your Prep');
  const [subtitle, setSubtitle] = useState('Mission Defence 2026');
  const [buttonText, setButtonText] = useState('Explore Now');
  
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
        body: JSON.stringify({ imageUrl, linkUrl, title, subtitle, buttonText }),
        cache: 'no-store'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update banner');
      }

      setSuccess(true);
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
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-bold border border-green-200">
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
              <input type="url" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#5e1515]/50" placeholder="https://example.com/banner.jpg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Link URL</label>
              <input type="url" required value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#5e1515]/50" placeholder="https://example.com/promo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Gold Text)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#5e1515]/50" placeholder="Upgrade Your Prep" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (White Text)</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#5e1515]/50" placeholder="Mission Defence 2026" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#5e1515]/50" placeholder="Explore Now" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#5e1515] text-white font-bold py-3 rounded-lg hover:bg-[#4a1010] transition-colors disabled:bg-gray-400 mt-4">
              {loading ? 'Updating...' : 'Update Banner'}
            </button>
          </form>
        </div>

        {/* Exact Mobile App Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
            Live Preview
            <span className="text-xs font-bold text-[#B8860B] bg-[#B8860B]/10 px-2 py-1 rounded">Mobile App View</span>
          </h2>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-center min-h-[250px]">
            {imageUrl ? (
              <a href={linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="relative block w-full max-w-sm h-[160px] rounded-lg overflow-hidden shadow-md border border-gray-200">
                <img src={imageUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 p-5 flex flex-col justify-center">
                  <p className="text-[#B8860B] font-extrabold text-xs uppercase tracking-wider mb-1">{title}</p>
                  <p className="text-white font-extrabold text-xl mb-2">{subtitle}</p>
                  <div className="bg-white text-[#5e1515] text-xs font-bold px-3 py-1.5 rounded self-start">{buttonText}</div>
                </div>
              </a>
            ) : (
              <p className="text-gray-400">Paste an Image URL to see the preview</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}