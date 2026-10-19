'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ProfileContent() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/students/${params.userId}`)
      .then(res => res.json())
      .then(resData => setData(resData));
  }, [params.userId]);

  if (!data) return <div className="p-10 text-center font-bold text-xl">Loading Profile...</div>;

  // Find max score for chart scaling
  // Safeguard against undefined data
  if (!data || data.error || !data.history) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Student data not found.</div>;
  }

  const maxScore = Math.max(...data.history.map((h: any) => h.totalScore), 10);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
            {data.user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-900">{data.user.name}</h1>
            <p className="text-gray-500">{data.user.email} | Batch: {data.user.batch || 'Unassigned'}</p>
          </div>
        </div>
        <button onClick={() => router.push('/teacher/results')} className="bg-gray-200 px-4 py-2 rounded font-semibold hover:bg-gray-300">
          &larr; Back to Results
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Total Tests</div>
          <div className="font-bold text-3xl text-blue-900">{data.stats.totalTests}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Average Score</div>
          <div className="font-bold text-3xl text-green-600">{data.stats.averageScore}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Total Time Spent</div>
          <div className="font-bold text-2xl text-purple-600">{Math.floor(data.stats.totalTimeSpent / 60)} mins</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Integrity Flags</div>
          <div className={`font-bold text-3xl ${data.stats.totalTabSwitches > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {data.stats.totalTabSwitches}
          </div>
          <div className="text-xs text-gray-400">Tab Switches</div>
        </div>
      </div>

      {/* PROGRESS CHART (Simple CSS Bar Chart) */}
      <h2 className="text-xl font-bold mb-4 text-blue-900">Score Progression (Recent Tests)</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="h-64 flex items-end gap-4 border-b border-gray-300 pb-2 overflow-x-auto">
          {data.history.length === 0 && <p className="text-gray-400 m-auto">No tests completed yet.</p>}
          {data.history.map((attempt: any, idx: number) => {
            const heightPercent = (attempt.totalScore / maxScore) * 100;
            return (
              <div key={attempt.id} className="flex flex-col items-center justify-end h-full min-w-[60px] group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {attempt.mockTest.title}
                </div>
                {/* Bar */}
                <div 
                  className="w-12 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-500"
                  style={{ height: `${heightPercent}%` }}
                ></div>
                {/* Label */}
                <div className="text-xs text-gray-500 mt-2 text-center truncate w-full" title={attempt.mockTest.title}>
                  Test {data.history.length - idx}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEST HISTORY TABLE */}
      <h2 className="text-xl font-bold mb-4 text-blue-900">Detailed History</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-4 font-semibold">Test Name</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Score</th>
              <th className="p-4 font-semibold">Tab Switches</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.history.map((attempt: any) => (
              <tr key={attempt.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-blue-800">{attempt.mockTest.title}</td>
                <td className="p-4 text-sm text-gray-600">{new Date(attempt.endTime).toLocaleDateString()}</td>
                <td className="p-4 font-bold text-green-600">{attempt.totalScore.toFixed(2)}</td>
                <td className="p-4">
                  {attempt.tabSwitchCount > 0 ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">⚠️ {attempt.tabSwitchCount}</span>
                  ) : <span className="text-gray-400 text-xs">Clean</span>}
                </td>
                <td className="p-4">
                  <Link href={`/teacher/results/${attempt.id}`} className="text-blue-600 hover:underline text-sm font-semibold">View Forensics</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}