'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
const RichTextViewer = dynamic(() => import('@/components/RichTextViewer'), { ssr: false });

type Question = { id: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation?: string; positiveMarks: number; negativeMarks: number; };
type Section = { id: string; name: string; questions: Question[] };
type AttemptData = {
  id: string; totalScore: number; tabSwitchCount: number; pauseCount: number;
  mockTest: { id: string; title: string; exam: { name: string }; sections: Section[] };
  responses: { questionId: string; selectedOption: string | null; timeSpent: number; }[];
};

function ReviewContent() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}/review`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setAttempt(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <div className="p-10 text-center font-bold text-xl text-blue-900">Loading Review...</div>;
  if (!attempt || !attempt.mockTest) return <div className="p-10 text-center text-red-600">Error loading review data.</div>;

  const currentSection = attempt.mockTest.sections[currentSectionIdx];
  const currentQ = currentSection?.questions?.[currentQuestionIdx];

  if (!currentQ) return <div className="p-10 text-center">No questions found.</div>;

  const savedResponse = attempt.responses.find(r => r.questionId === currentQ.id);
  const selectedOption = savedResponse?.selectedOption || null;
  const isCorrect = selectedOption === currentQ.correctOption;
  const timeSpent = savedResponse?.timeSpent || 0;

  // Helper for Palette Colors
  const getPaletteStatus = (q: Question) => {
    const res = attempt.responses.find(r => r.questionId === q.id);
    if (!res || !res.selectedOption) return 'bg-gray-300 text-gray-700 rounded-full border border-gray-400';
    if (res.selectedOption === q.correctOption) return 'bg-green-600 text-white rounded-full border border-green-700';
    return 'bg-red-600 text-white rounded-full border border-red-700';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-sm text-gray-900">
      
      {/* HEADER */}
      <header className="bg-blue-900 text-white flex justify-between items-center p-3 border-b-4 border-orange-500">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">{attempt.mockTest.title} - Review</h1>
          <span className="bg-blue-800 px-3 py-1 rounded">{currentSection.name}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-white text-black font-bold text-lg px-4 py-1 rounded">
            Score: <span className="text-green-600">{attempt.totalScore.toFixed(2)}</span>
          </div>
          <a href={`/exam/${attempt.mockTest.id}?new=true`} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded transition-colors shadow-sm">
            🔄 Attempt Again
          </a>
          <button onClick={() => router.push('/student')} className="bg-gray-200 text-gray-800 font-bold px-4 py-1.5 rounded hover:bg-gray-300">
            Exit Review
          </button>
        </div>
      </header>

      {/* SECTION TABS */}
      <div className="bg-white border-b border-gray-300 flex px-4 pt-2 gap-2 overflow-x-auto">
        {attempt.mockTest.sections.map((sec, idx) => (
          <button key={sec.id} onClick={() => { setCurrentSectionIdx(idx); setCurrentQuestionIdx(0); }} className={`px-4 py-2 font-semibold rounded-t-md border-b-2 ${currentSectionIdx === idx ? 'border-blue-600 text-blue-800 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            {sec.name}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: QUESTION & OPTIONS */}
        <div className="flex-1 flex flex-col bg-white m-2 border border-gray-300 shadow-sm">
          <div className="bg-blue-50 p-2 border-b border-gray-300 font-semibold flex justify-between">
            <div className="flex items-center gap-6">
              <span>Question No. {currentQuestionIdx + 1} (of {currentSection.questions.length})</span>
              <span className="text-gray-500 font-normal text-xs bg-gray-200 px-2 py-0.5 rounded">⏱ {timeSpent}s</span>
            </div>
            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
              {selectedOption 
                ? (isCorrect ? `Correct (+${currentQ.positiveMarks})` : `Incorrect (${currentQ.negativeMarks})`) 
                : 'Unattempted'}
            </span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-lg mb-6 leading-relaxed"><RichTextViewer content={String(currentQ.text || "")} /></div>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optionText = currentQ[`option${opt}` as keyof Question];
                const isSelected = selectedOption === opt;
                const isRightAnswer = currentQ.correctOption === opt;
                
                // Color logic
                let bgClass = 'bg-white hover:bg-gray-50 border-gray-200';
                if (isRightAnswer) bgClass = 'bg-green-100 border-green-500 text-green-900';
                else if (isSelected && !isRightAnswer) bgClass = 'bg-red-100 border-red-500 text-red-900';

                return (
                  <div key={opt} className={`flex items-center gap-3 p-3 border rounded-lg ${bgClass}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isRightAnswer ? 'bg-green-600 text-white' : isSelected ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {opt}
                    </div>
                    <div className="text-base flex-1"><RichTextViewer content={String(optionText || "")} /></div>
                    
                    {/* Status Icons */}
                    {isRightAnswer && <span className="text-green-700 font-bold text-sm">✓ Correct Answer</span>}
                    {isSelected && !isRightAnswer && <span className="text-red-700 font-bold text-sm">✗ Your Answer</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* EXPLANATION BOX */}
          {currentQ.explanation && (
            <div className="mx-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                <span className="text-lg">💡</span> Explanation
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="bg-gray-50 p-3 border-t border-gray-300 flex justify-between items-center">
             <button onClick={() => { if (currentQuestionIdx > 0) setCurrentQuestionIdx(currentQuestionIdx - 1); }} disabled={currentQuestionIdx === 0} className="px-6 py-2 bg-white border border-gray-400 rounded font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50">Previous</button>
             <button onClick={() => { if (currentQuestionIdx < currentSection.questions.length - 1) setCurrentQuestionIdx(currentQuestionIdx + 1); }} disabled={currentQuestionIdx === currentSection.questions.length - 1} className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50">Next</button>
          </div>
        </div>

        {/* RIGHT PANEL: PALETTE */}
        <div className="w-80 bg-white m-2 ml-0 border border-gray-300 shadow-sm flex flex-col">
          <div className="p-3 bg-gray-100 border-b border-gray-300 font-bold flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800">Q</div>
             Palette
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
             <div className="grid grid-cols-5 gap-3">
              {currentSection.questions.map((q, idx) => (
                <button key={q.id} onClick={() => setCurrentQuestionIdx(idx)} className={`w-10 h-10 flex items-center justify-center font-bold shadow-sm ${getPaletteStatus(q)}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-300 text-xs text-gray-500">
             <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 bg-green-600 rounded-full"></div> Correct</div>
             <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 bg-red-600 rounded-full"></div> Incorrect</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-full"></div> Unattempted</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-xl text-blue-900">Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}