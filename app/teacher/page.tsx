'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type MockTest = { id: string; title: string; totalDuration: number; timerType: string; overallCutoff: number | null };
type Exam = { id: string; name: string; description: string; mockTests: MockTest[] };

export default function AdminDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchExams = async () => {
    const res = await fetch('/api/exams', { cache: 'no-store' });
    const data = await res.json();
    setExams(data);
  };

  useEffect(() => { fetchExams(); }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    setName(''); setDescription(''); setLoading(false); fetchExams();
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('WARNING: Deleting this exam will also delete all mock tests and questions inside it. Are you sure?')) return;
    await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    fetchExams();
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Mock Test?')) return;
    await fetch(`/api/mocktests/${id}`, { method: 'DELETE' });
    fetchExams();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-gray-900 min-h-screen bg-gray-50">
      
      {/* HEADER WITH NEW BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-blue-900">Admin / Teacher Dashboard</h1>
        <div className="mt-4 mb-6">
          <a href="/teacher/banner" className="inline-flex items-center gap-2 bg-[#5e1515] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4a1010] transition-colors shadow-sm">
            🖼️ Manage Promo Banner
          </a>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link href="/teacher/notifications" className="bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-700 shadow-sm transition-colors flex items-center gap-2">
            🔔 Push Notifications
          </Link>
          <Link href="/teacher/batches" className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2">
            📦 Manage Batches
          </Link>
          <Link href="/teacher/students" className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 shadow-sm transition-colors flex items-center gap-2">
            👥 Manage Students
          </Link>
          <Link href="/teacher/results" className="bg-blue-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 shadow-sm transition-colors flex items-center gap-2">
            📊 View Student Results
          </Link>
        </div>
      </div>
      
      {/* Create Exam Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Create New Exam</h2>
        <form onSubmit={handleCreateExam} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Exam Name (e.g. SSC CGL 2026)</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 w-full md:w-auto">
            {loading ? 'Saving...' : 'Create Exam'}
          </button>
        </form>
      </div>

      {/* Manage Exams List */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Exams & Tests</h2>
      <div className="space-y-6">
        {exams.length === 0 && <p className="text-gray-500">No exams created yet.</p>}
        
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-50 p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-xl text-blue-900">{exam.name}</h3>
                <p className="text-gray-600 text-sm">{exam.description || 'No description'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteExam(exam.id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-red-200">Delete Exam</button>
                <Link href={`/teacher/mocktest?examId=${exam.id}`} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-700">+ Add Mock Test</Link>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Mock Tests</h4>
              {exam.mockTests.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No mock tests added yet.</p>
              ) : (
                <div className="grid gap-3">
                  {exam.mockTests.map(test => (
                    <div key={test.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border border-gray-200 rounded hover:bg-gray-50 gap-3">
                      <div>
                        <span className="font-bold text-gray-800">{test.title}</span>
                        <span className="text-xs text-gray-500 ml-3 bg-gray-100 px-2 py-0.5 rounded">({test.totalDuration} mins, {test.timerType})</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/teacher/questions?testId=${test.id}`} className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-900 font-semibold">Manage Qs</Link>
                        <Link href={`/teacher/mocktest/edit/${test.id}`} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs hover:bg-gray-300 font-semibold">Edit</Link>
                        <button onClick={() => handleDeleteTest(test.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200 font-semibold">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}