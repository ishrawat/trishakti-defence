'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Helper to render progress bars safely
const ProgressBar = ({ value, max, color }: { value: number, max: number, color: string }) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 overflow-hidden">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

function ResultContent() {
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('examResult');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
  }, []);

  if (!result) return <div className="p-10 text-center font-bold text-xl text-blue-900">Loading Analysis...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-12 text-gray-900">
      
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-900">Test Analysis</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push(`/student/review/${params.attemptId}`)} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 shadow-sm transition-colors">
            Review Answers
          </button>
          <button onClick={() => router.push('/student')} className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-gray-300 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        
        {/* 1. OVERALL PERFORMANCE SUMMARY */}
        <h2 className="text-xl font-bold mb-4">Overall Performance Summary</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
            
            {/* Score Card */}
            <div className="p-6 text-center">
              <div className="text-sm font-semibold text-gray-500 mb-1">Score</div>
              <div className="text-3xl font-extrabold text-blue-900">
                {result.totalScore.toFixed(2)} <span className="text-lg text-gray-400">/ {result.totalQuestions}</span>
              </div>
              <div className={`mt-2 text-xs font-bold px-2 py-1 rounded inline-block ${result.isOverallPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.isOverallPassed ? 'PASSED CUTOFF' : 'FAILED CUTOFF'}
              </div>
            </div>

            {/* Attempted Card */}
            <div className="p-6 text-center">
              <div className="text-sm font-semibold text-gray-500 mb-1">Attempted</div>
              <div className="text-3xl font-extrabold text-blue-900">
                {result.totalAttempted} <span className="text-lg text-gray-400">/ {result.totalQuestions}</span>
              </div>
              <ProgressBar value={result.totalAttempted} max={result.totalQuestions} color="bg-blue-500" />
            </div>

            {/* Accuracy Card */}
            <div className="p-6 text-center">
              <div className="text-sm font-semibold text-gray-500 mb-1">Accuracy</div>
              <div className="text-3xl font-extrabold text-green-600">
                {result.overallAccuracy.toFixed(2)}%
              </div>
              <ProgressBar value={result.overallAccuracy} max={100} color="bg-green-500" />
            </div>

            {/* Stats Card */}
            <div className="p-6 text-center flex justify-center gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">Correct</div>
                <div className="text-xl font-bold text-green-600">{result.totalCorrect}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500">Wrong</div>
                <div className="text-xl font-bold text-red-600">{result.totalWrong}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500">Skipped</div>
                <div className="text-xl font-bold text-gray-500">{result.totalUnattempted}</div>
              </div>
            </div>

          </div>
        </div>

        {/* 2. SECTIONAL SUMMARY */}
        <h2 className="text-xl font-bold mb-4">Sectional Summary</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Section Name</th>
                <th className="p-4 font-semibold">Score</th>
                <th className="p-4 font-semibold">Attempted</th>
                <th className="p-4 font-semibold">Accuracy</th>
                <th className="p-4 font-semibold">Cutoff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.sectionResults.map((sec: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{sec.sectionName}</td>
                  
                  <td className="p-4">
                    <div className="text-sm font-bold">{sec.score.toFixed(2)} <span className="text-gray-400 font-normal">/ {sec.maxScore.toFixed(2)}</span></div>
                    <ProgressBar value={sec.score} max={sec.maxScore} color="bg-blue-500" />
                  </td>

                  <td className="p-4">
                    <div className="text-sm font-bold">{sec.attempted} <span className="text-gray-400 font-normal">/ {sec.totalQuestions}</span></div>
                    <ProgressBar value={sec.attempted} max={sec.totalQuestions} color="bg-purple-500" />
                  </td>

                  <td className="p-4">
                    <div className="text-sm font-bold text-green-600">{sec.accuracy.toFixed(2)}%</div>
                    <ProgressBar value={sec.accuracy} max={100} color="bg-green-500" />
                  </td>

                  <td className="p-4">
                    {sec.cutoff ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${sec.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {sec.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. TOPIC-WISE PERFORMANCE */}
        {result.topicResults && Object.keys(result.topicResults).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Topic-wise Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.topicResults).map(([topicName, stats]: [string, any]) => {
                const accuracy = (stats.correct / stats.total) * 100;
                return (
                  <div key={topicName} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800">{topicName}</span>
                      <span className={`font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {accuracy.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${accuracy >= 70 ? 'bg-green-500' : accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-right">
                      {stats.correct} / {stats.total} correct
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. COMPARE WITH TOPPER (Mocked Data) */}
        <h2 className="text-xl font-bold mb-4">Compare with Topper</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Score</th>
                <th className="p-4 font-semibold">Accuracy</th>
                <th className="p-4 font-semibold">Correct</th>
                <th className="p-4 font-semibold">Wrong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-blue-50/50">
                <td className="p-4 font-bold text-blue-900">You</td>
                <td className="p-4 text-sm font-bold">{result.totalScore.toFixed(2)}</td>
                <td className="p-4 text-sm font-bold">{result.overallAccuracy.toFixed(2)}%</td>
                <td className="p-4 text-sm font-bold text-green-600">{result.totalCorrect}</td>
                <td className="p-4 text-sm font-bold text-red-600">{result.totalWrong}</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-gray-700">Topper <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded ml-2">Mock</span></td>
                <td className="p-4 text-sm font-bold">{(result.totalQuestions * 1).toFixed(2)}</td>
                <td className="p-4 text-sm font-bold">100.00%</td>
                <td className="p-4 text-sm font-bold">{result.totalQuestions}</td>
                <td className="p-4 text-sm font-bold">0</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-gray-700">Average <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded ml-2">Mock</span></td>
                <td className="p-4 text-sm font-bold">{(result.totalQuestions * 0.45).toFixed(2)}</td>
                <td className="p-4 text-sm font-bold">65.00%</td>
                <td className="p-4 text-sm font-bold">{(result.totalQuestions * 0.35).toFixed(0)}</td>
                <td className="p-4 text-sm font-bold">{(result.totalQuestions * 0.20).toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BOTTOM CALL TO ACTION */}
        <div className="mt-10 mb-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Want to see where you went wrong?</h3>
          <p className="text-gray-500 mb-6">Review all questions, check the correct answers, and read the detailed explanations.</p>
          <button 
            onClick={() => router.push(`/student/review/${params.attemptId}`)} 
            className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-md transition-colors"
          >
            📖 Review Answers & Explanations
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-xl text-blue-900">Loading Result Interface...</div>}>
      <ResultContent />
    </Suspense>
  );
}