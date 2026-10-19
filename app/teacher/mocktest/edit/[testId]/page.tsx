'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';

function EditTestContent() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [timerType, setTimerType] = useState('FULL');
  const [totalDuration, setTotalDuration] = useState('60');
  const [overallCutoff, setOverallCutoff] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/batches').then(res => res.json()).then(data => setBatches(data));
    fetch(`/api/mocktests/${testId}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setTimerType(data.timerType);
        setTotalDuration(data.totalDuration.toString());
        setOverallCutoff(data.overallCutoff ? data.overallCutoff.toString() : '');
        setSections(data.sections);
        if (data.batches) setSelectedBatchIds(data.batches.map((b: any) => b.id));
        setLoading(false);
      });
  }, [testId]);

  const updateSection = (index: number, field: string, value: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title, timerType,
      totalDuration: parseInt(totalDuration),
      overallCutoff,
      sections,
      batchIds: selectedBatchIds // Send to API
    };

    const res = await fetch(`/api/mocktests/${testId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('Test Updated Successfully!');
      router.push('/teacher');
    } else {
      alert('Error updating test');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto text-gray-900 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Edit Mock Test</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md border border-gray-200 space-y-6">
        
        <div>
          <label className="block font-medium mb-1">Mock Test Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block font-medium mb-1">Timer Type</label>
            <select value={timerType} onChange={(e) => setTimerType(e.target.value)} className="w-full border p-2 rounded">
              <option value="FULL">Overall Test Timer</option>
              <option value="SECTIONAL">Sectional Timer</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Total Duration (Mins)</label>
            <input type="number" required value={totalDuration} onChange={(e) => setTotalDuration(e.target.value)} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-bold mb-4">Sections</h2>
          {sections.map((sec, index) => (
            <div key={sec.id} className="flex gap-3 mb-3 items-end bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Section Name</label>
                <input type="text" required value={sec.name} onChange={(e) => updateSection(index, 'name', e.target.value)} className="w-full border p-2 rounded" />
              </div>
              {timerType === 'SECTIONAL' && (
                <div className="w-32">
                  <label className="block text-xs font-medium mb-1">Mins</label>
                  <input type="number" value={sec.duration || ''} onChange={(e) => updateSection(index, 'duration', e.target.value)} className="w-full border p-2 rounded" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BATCH SELECTION */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-bold mb-2 text-blue-900">Assign to Batches</h2>
          <div className="flex flex-wrap gap-4">
            {batches.map(b => (
              <label key={b.id} className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded border border-gray-200 hover:bg-gray-100">
                <input 
                  type="checkbox" 
                  checked={selectedBatchIds.includes(b.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedBatchIds([...selectedBatchIds, b.id]);
                    else setSelectedBatchIds(selectedBatchIds.filter(id => id !== b.id));
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-gray-700">{b.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default function EditTestPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading...</div>}>
      <EditTestContent />
    </Suspense>
  );
}