'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [batchId, setBatchId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/batches').then(res => res.json()).then(data => setBatches(data));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, batchId })
    });
    
    if (res.ok) {
      alert('Notification Sent!');
    } else {
      const err = await res.json();
      alert(`Error: ${err.details || err.error}`);
    }
    setTitle(''); setMessage('');
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-gray-50 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Push Notifications</h1>
        <Link href="/teacher" className="bg-gray-200 px-4 py-2 rounded font-semibold hover:bg-gray-300">&larr; Back</Link>
      </div>

      <form onSubmit={handleSend} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Send To</label>
          <select value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full border p-2 rounded">
            <option value="">All Students (Global)</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}