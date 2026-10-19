'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';

function DetailContent() {
  const router = useRouter();
  const params = useParams();
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/results/${params.attemptId}`)
      .then(res => res.json())
      .then(data => setAttempt(data));
  }, [params.attemptId]);

  if (!attempt) return <div className="p-10 text-center font-bold">Loading Details...</div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Attempt Details: {attempt.user.name}</h1>
        <button onClick={() => router.push('/teacher/results')} className="bg-gray-200 px-4 py-2 rounded font-semibold hover:bg-gray-300">
          &larr; Back to Results
        </button>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Score</div>
          <div className="font-bold text-2xl text-green-600">{attempt.totalScore.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Tab Switches</div>
          <div className={`font-bold text-2xl ${attempt.tabSwitchCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {attempt.tabSwitchCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-sm text-gray-500 font-semibold mb-1">Pauses</div>
          <div className={`font-bold text-2xl ${attempt.pauseCount > 0 ? 'text-yellow-600' : 'text-gray-800'}`}>
            {attempt.pauseCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center col-span-2">
          <div className="text-sm text-gray-500 font-semibold mb-1">Total Time Spent</div>
          <div className="font-bold text-2xl text-blue-600">
            {formatTime(attempt.responses.reduce((acc: number, curr: any) => acc + (curr.timeSpent || 0), 0))}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Section & Question Breakdown</h2>
      <div className="space-y-6">
        {attempt.mockTest.sections.map((section: any) => {
          // Calculate total time for this section
          const sectionResponses = attempt.responses.filter((r: any) => 
            section.questions.some((q: any) => q.id === r.questionId)
          );
          const sectionTime = sectionResponses.reduce((acc: number, curr: any) => acc + (curr.timeSpent || 0), 0);

          return (
            <div key={section.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-lg text-blue-900">{section.name}</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-bold">
                  Time Spent: {formatTime(sectionTime)}
                </span>
              </div>
              <div className="p-4 grid gap-3">
                {section.questions.map((q: any, idx: number) => {
                  const res = attempt.responses.find((r: any) => r.questionId === q.id);
                  const selected = res?.selectedOption;
                  const isCorrect = selected === q.correctOption;
                  const timeSpent = res?.timeSpent || 0;
                  
                  return (
                    <div key={q.id} className={`p-3 rounded border flex justify-between items-center ${!selected ? 'bg-gray-50 border-gray-200' : isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex-1 pr-4">
                        <span className="font-bold mr-2">Q{idx + 1}.</span>
                        <span className="text-sm">{q.text}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm font-bold">
                        <span className="text-gray-500 text-xs">⏱ {timeSpent}s</span>
                        {selected ? (
                          <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            Selected: {selected} (Correct: {q.correctOption})
                          </span>
                        ) : (
                          <span className="text-gray-400">Skipped</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading...</div>}>
      <DetailContent />
    </Suspense>
  );
}