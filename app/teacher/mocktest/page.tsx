'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Exam = { id: string; name: string };
type Batch = { id: string; name: string };

function CreateMockTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlExamId = searchParams.get('examId');

  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [examId, setExamId] = useState(urlExamId || '');
  const [title, setTitle] = useState('');
  const [timerType, setTimerType] = useState('FULL');
  const [totalDuration, setTotalDuration] = useState('60');
  const [overallCutoff, setOverallCutoff] = useState('');
  const [sections, setSections] = useState([{ name: 'Quantitative Aptitude', duration: '', cutoffMarks: '' }]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchesRes, examsRes] = await Promise.all([
          fetch('/api/admin/batches', { cache: 'no-store' }),
          fetch('/api/exams', { cache: 'no-store' })
        ]);

        if (!batchesRes.ok || !examsRes.ok) {
          throw new Error('Failed to load exams or batches.');
        }

        const batchesData = await batchesRes.json();
        const examsData = await examsRes.json();

        if (Array.isArray(batchesData)) setBatches(batchesData);
        if (Array.isArray(examsData)) {
          setExams(examsData);
          if (!urlExamId && examsData.length > 0) setExamId(examsData[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message);
      }
    };
    fetchData();
  }, [urlExamId]);

  const addSection = () => setSections([...sections, { name: '', duration: '', cutoffMarks: '' }]);
  const updateSection = (index: number, field: string, value: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) return alert('Please select an exam');
    setLoading(true);
    setErrorMsg('');

    const payload = {
      examId, title, timerType,
      totalDuration: parseInt(totalDuration),
      overallCutoff,
      sections,
      batchIds: selectedBatchIds
    };

    try {
      const res = await fetch('/api/mocktests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Mock Test Created Successfully!');
        router.push('/teacher');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error creating test');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto text-gray-900 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Create Mock Test</h1>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md border border-gray-200 space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Select Exam</label>
            <select required value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full border p-2 rounded">
              <option value="" disabled>Select an exam...</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Mock Test Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. SSC CGL Tier 1 Mock 1" />
          </div>
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
            <div key={index} className="flex gap-3 mb-3 items-end bg-gray-50 p-3 rounded border">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Section Name</label>
                <input type="text" required value={sec.name} onChange={(e) => updateSection(index, 'name', e.target.value)} className="w-full border p-2 rounded" />
              </div>
              {timerType === 'SECTIONAL' && (
                <div className="w-32">
                  <label className="block text-xs font-medium mb-1">Mins</label>
                  <input type="number" value={sec.duration} onChange={(e) => updateSection(index, 'duration', e.target.value)} className="w-full border p-2 rounded" />
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addSection} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">+ Add Section</button>
        </div>

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

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Saving...' : 'Save Mock Test'}
        </button>
      </form>
    </div>
  );
}

export default function CreateMockTestPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-xl text-blue-900">Loading page...</div>}>
      <CreateMockTestContent />
    </Suspense>
  );
}