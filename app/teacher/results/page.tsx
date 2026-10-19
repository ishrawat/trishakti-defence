'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

type Attempt = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalScore: number;
  userId: string;
  tabSwitchCount: number;
  pauseCount: number;
  user: { name: string; email: string };
  mockTest: { title: string; exam: { name: string } };
};

export default function AdminResults() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/results', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAttempts(data);
        } else {
          console.error("API did not return an array:", data);
          setAttempts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setAttempts([]);
        setLoading(false);
      });
  }, []);

  const exportToExcel = () => {
    if (attempts.length === 0) return alert("No data to export");
    
    // Format data for Excel
    const exportData = attempts.map(a => ({
      StudentName: a.user.name,
      Email: a.user.email,
      Exam: a.mockTest.exam.name,
      TestTitle: a.mockTest.title,
      Score: a.totalScore,
      Status: a.status,
      TabSwitches: a.tabSwitchCount,
      Pauses: a.pauseCount,
      Date: formatDate(a.startTime)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `Results_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-gray-900 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-blue-900">Student Results & Analytics</h1>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700">
            📥 Export to Excel
          </button>
        </div>
        <Link href="/teacher" className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300">
          &larr; Back to Admin Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center font-bold text-gray-500">Loading results...</div>
        ) : attempts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No tests have been attempted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white text-sm">
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Exam / Test</th>
                  <th className="p-4 font-semibold">Date Attempted</th>
                  <th className="p-4 font-semibold">Score</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <Link href={`/teacher/students/${attempt.userId}`} className="group">
                        <div className="font-bold text-blue-700 group-hover:underline">{attempt.user.name}</div>
                        <div className="text-xs text-gray-500">{attempt.user.email}</div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-blue-800">{attempt.mockTest.exam.name}</div>
                      <div className="text-sm text-gray-600">{attempt.mockTest.title}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(attempt.startTime)}
                    </td>
                    <td className="p-4">
                      <span className="text-lg font-extrabold text-green-700">{attempt.totalScore.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {attempt.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/teacher/results/${attempt.id}`} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-200 transition-colors">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}