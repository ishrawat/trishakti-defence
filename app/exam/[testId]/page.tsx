'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import RichTextViewer from '@/components/RichTextViewer';

type Question = { id: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; positiveMarks: number; negativeMarks: number; };
type Section = { id: string; name: string; duration: number; questions: Question[] };
type MockTest = { id: string; title: string; timerType: string; totalDuration: number; sections: Section[] };

function ExamContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const isNew = searchParams.get('new') === 'true';

  const [test, setTest] = useState<MockTest | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  // Refs for precise tracking
  const questionStartTime = useRef<number>(Date.now());
  const currentQIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false); // Prevents warnings during submit

  // ANTI-CHEAT
  useEffect(() => {
    const logViolation = (type: string) => {
      if (attemptId && !isPaused && !isSubmittingRef.current) {
        fetch('/api/attempts/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, type })
        }).catch(console.error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        logViolation('TAB_SWITCH');
        setWarningMsg("Warning: You switched tabs! This activity has been recorded.");
        setTimeout(() => setWarningMsg(''), 5000);
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden && !isSubmittingRef.current) { 
        logViolation('WINDOW_BLUR');
        setWarningMsg("Warning: You switched windows! This activity has been recorded.");
        setTimeout(() => setWarningMsg(''), 5000);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittingRef.current && !loading) {
        logViolation('EXIT_FULLSCREEN');
        setWarningMsg("Warning: You exited Full-Screen mode! Please click anywhere to resume.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [attemptId, isPaused]);

  // FETCH & RESUME
  useEffect(() => {
    const initExam = async () => {
      try {
        const testRes = await fetch(`/api/mocktests/${testId}`);
        if (!testRes.ok) throw new Error('Test not found');
        const testData = await testRes.json();
        
        if (!testData.sections || testData.sections.length === 0) throw new Error('No sections found');
        setTest(testData);

        const attemptRes = await fetch('/api/attempts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId, forceNew: isNew })
        });
        const attemptData = await attemptRes.json();
        setAttemptId(attemptData.id);

        if (isNew) router.replace(`/exam/${testId}`);

        const restoredAnswers: Record<string, string> = {};
        if (attemptData.responses) {
          attemptData.responses.forEach((r: any) => {
            if (r.selectedOption) restoredAnswers[r.questionId] = r.selectedOption;
          });
        }
        setAnswers(restoredAnswers);

        if (testData.timerType === 'FULL') setTimeLeft(testData.totalDuration * 60); 
        else setTimeLeft((testData.sections[0].duration || testData.totalDuration) * 60);
        
        setLoading(false);
      } catch (err: any) {
        setErrorMsg(err.message);
        setLoading(false);
      }
    };
    initExam();
  }, [testId, isNew, router]);

  // TIMER LOGIC & AUTO-ADVANCE
  useEffect(() => {
    if (loading || isPaused) return;

    if (timeLeft <= 0) {
      if (test?.timerType === 'SECTIONAL' && currentSectionIdx < test.sections.length - 1) {
        // Auto-submit section and move to next
        alert("Time is up for this section! Moving to the next section.");
        setCurrentSectionIdx(prev => prev + 1);
        setCurrentQuestionIdx(0);
        setTimeLeft((test.sections[currentSectionIdx + 1].duration || test.totalDuration) * 60);
      } else {
        // Auto-submit whole test
        handleSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isPaused, test, currentSectionIdx]);

  useEffect(() => {
    if (test) {
      const currentQ = test.sections[currentSectionIdx]?.questions?.[currentQuestionIdx];
      if (currentQ && currentQ.id !== currentQIdRef.current) {
        currentQIdRef.current = currentQ.id;
        questionStartTime.current = Date.now();
      }
    }
  }, [currentQuestionIdx, currentSectionIdx, test]);

  const saveTimeAndMove = (nextAction: () => void) => {
    const timeSpentSec = Math.round((Date.now() - questionStartTime.current) / 1000);
    const currentQ = test?.sections[currentSectionIdx]?.questions?.[currentQuestionIdx];
    
    if (currentQ && attemptId) {
      fetch('/api/attempts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          selectedOption: answers[currentQ.id] || null,
          status: answers[currentQ.id] ? 'ANSWERED' : 'NOT_ANSWERED',
          timeSpent: timeSpentSec
        })
      }).catch(console.error);
    }
    nextAction();
  };

  const handleOptionSelect = (option: string) => {
    if (!currentQ) return;
    setAnswers({ ...answers, [currentQ.id]: option });
  };

  const handlePause = () => {
    setIsPaused(true);
    if (attemptId) {
      fetch('/api/attempts/pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attemptId }) }).catch(console.error);
    }
  };

  const handleResume = () => {
    questionStartTime.current = Date.now();
    setIsPaused(false);
  };

  const handleSubmitSection = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (window.confirm('Are you sure you want to submit this section? You cannot return to it.')) {
      saveTimeAndMove(() => {
        if (test && currentSectionIdx < test.sections.length - 1) {
          setCurrentSectionIdx(prev => prev + 1);
          setCurrentQuestionIdx(0);
          setTimeLeft((test.sections[currentSectionIdx + 1].duration || test.totalDuration) * 60);
          isSubmittingRef.current = false;
        } else {
          handleSubmit(true);
        }
      });
    } else {
      isSubmittingRef.current = false;
    }
  };

  const nextQuestion = () => {
    saveTimeAndMove(() => {
      if (currentQuestionIdx < currentSection.questions.length - 1) {
        setVisited({ ...visited, [currentSection.questions[currentQuestionIdx + 1].id]: true });
        setCurrentQuestionIdx(currentQuestionIdx + 1);
      }
    });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (isSubmittingRef.current && !autoSubmit) return;
    isSubmittingRef.current = true;

    if (autoSubmit || window.confirm('Are you sure you want to submit the final test?')) {
      try {
        const timeSpentSec = Math.round((Date.now() - questionStartTime.current) / 1000);
        const currentQ = test?.sections[currentSectionIdx]?.questions?.[currentQuestionIdx];
        if (currentQ && attemptId) {
          await fetch('/api/attempts/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId, questionId: currentQ.id, selectedOption: answers[currentQ.id] || null, status: 'ANSWERED', timeSpent: timeSpentSec })
          });
        }

        const res = await fetch('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attemptId }) });
        if (!res.ok) throw new Error('Failed to submit');
        const result = await res.json();
        sessionStorage.setItem('examResult', JSON.stringify(result));
        router.push(`/student/result/${attemptId}`);
      } catch (error) {
        alert('Error submitting test. Please try again.');
        isSubmittingRef.current = false;
      }
    } else {
      isSubmittingRef.current = false;
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-xl text-blue-900">Loading Exam Data...</div>;
  if (errorMsg) return <div className="p-10 text-center text-red-600 font-bold text-xl">Error: {errorMsg}</div>;
  if (!test || !test.sections || test.sections.length === 0) return <div className="p-10 text-center text-red-600">Error: Test data empty.</div>;

  const currentSection = test.sections[currentSectionIdx];
  const currentQ = currentSection?.questions?.[currentQuestionIdx];
  if (!currentQ) return <div className="p-10 text-center">No questions found.</div>;

  const getPaletteStatus = (qId: string) => {
    const isAnswered = !!answers[qId];
    const isMarked = markedForReview[qId];
    const isVisited = visited[qId];
    if (isMarked && isAnswered) return 'bg-purple-600 text-white relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-0 after:h-0 after:border-l-[10px] after:border-l-transparent after:border-b-[10px] after:border-b-green-500 rounded-full';
    if (isMarked) return 'bg-purple-600 text-white rounded-full';
    if (isAnswered) return 'bg-green-600 text-white rounded-full';
    if (isVisited) return 'bg-red-500 text-white rounded-full';
    return 'bg-gray-300 text-gray-700 rounded-full';
  };

  const enterFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  };

  if (!document.fullscreenElement && !loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-blue-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Instructions</h1>
        <p className="mb-6 max-w-md text-center">This test must be taken in Full-Screen mode. Do not switch tabs or exit full-screen, or it will be recorded as a violation.</p>
        <button onClick={enterFullScreen} className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded text-xl font-bold shadow-lg">
          🖥️ Enter Full Screen & Start
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-sm text-gray-900 relative">
      
      {warningMsg && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce font-bold text-lg">
          {warningMsg}
        </div>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-md w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Test Paused</h2>
            <p className="text-gray-500 mb-6">Your timer has been stopped and questions are hidden.</p>
            <button onClick={handleResume} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full">▶ Resume Test</button>
          </div>
        </div>
      )}

      <header className="bg-blue-900 text-white flex justify-between items-center p-3 border-b-4 border-orange-500 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">{test.title}</h1>
          <span className="bg-blue-800 px-3 py-1 rounded">{currentSection.name}</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={handlePause} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-1.5 rounded transition-colors shadow-sm">⏸ Pause Test</button>
          <div className="bg-white text-black font-bold text-lg px-4 py-1 rounded">
            Time Left: <span className={timeLeft < 300 ? 'text-red-600' : 'text-blue-900'}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-300 flex px-4 pt-2 gap-2 overflow-x-auto z-10">
        {test.sections.map((sec, idx) => {
          const isPast = test.timerType === 'SECTIONAL' && idx < currentSectionIdx;
          const isCurrent = currentSectionIdx === idx;
          return (
            <button 
              key={sec.id} 
              disabled={test.timerType === 'SECTIONAL'} 
              onClick={() => { if (test.timerType !== 'SECTIONAL') { setCurrentSectionIdx(idx); setCurrentQuestionIdx(0); } }}
              className={`px-4 py-2 font-semibold rounded-t-md border-b-2 ${
                isCurrent ? 'border-blue-600 text-blue-800 bg-blue-50' : 
                isPast ? 'border-transparent text-gray-400 bg-gray-100 opacity-50 cursor-not-allowed' : 
                'border-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              {sec.name}
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 overflow-hidden z-10">
        <div className="flex-1 flex flex-col bg-white m-2 border border-gray-300 shadow-sm">
          <div className="bg-blue-50 p-2 border-b border-gray-300 font-semibold flex justify-between items-center">
            <span>Question No. {currentQuestionIdx + 1} (of {currentSection.questions.length})</span>
            <span className="font-bold text-xs bg-gray-200 px-2 py-1 rounded">Marks: <span className="text-green-600">+{currentQ.positiveMarks}</span>, <span className="text-red-600">{currentQ.negativeMarks}</span></span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-lg mb-6 leading-relaxed"><RichTextViewer content={currentQ.text} /></div>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optionText = currentQ[`option${opt}` as keyof Question];
                return (
                  <label key={opt} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-300 rounded">
                    <input type="radio" name={`q_${currentQ.id}`} value={opt} checked={answers[currentQ.id] === opt} onChange={() => handleOptionSelect(opt)} className="w-4 h-4 cursor-pointer" />
                    <span className="text-base flex items-center"><strong className="mr-2">{opt})</strong> <RichTextViewer content={optionText} /></span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="bg-gray-50 p-3 border-t border-gray-300 flex flex-wrap justify-between items-center gap-2">
            <div className="flex gap-2">
              <button onClick={() => { setMarkedForReview({ ...markedForReview, [currentQ.id]: !markedForReview[currentQ.id] }); nextQuestion(); }} className="px-4 py-2 bg-white border border-gray-400 rounded text-gray-700 hover:bg-gray-100">Mark for Review & Next</button>
              <button onClick={() => { const newAns = {...answers}; delete newAns[currentQ.id]; setAnswers(newAns); }} className="px-4 py-2 bg-white border border-gray-400 rounded text-gray-700 hover:bg-gray-100">Clear Response</button>
            </div>
            <div className="flex gap-2">
              <button onClick={nextQuestion} className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700">Save & Next</button>
              
              {/* LEFT SIDE SUBMIT BUTTON */}
              {test.timerType === 'SECTIONAL' && currentSectionIdx < test.sections.length - 1 ? (
                <button onClick={handleSubmitSection} className="px-6 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700">Submit Section</button>
              ) : (
                <button onClick={() => handleSubmit(false)} className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">Submit Test</button>
              )}
            </div>
          </div>
        </div>

        <div className="w-80 bg-white m-2 ml-0 border border-gray-300 shadow-sm flex flex-col">
          <div className="p-3 bg-gray-100 border-b border-gray-300 font-bold flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800">Q</div>
             Palette
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
             <div className="grid grid-cols-5 gap-3">
              {currentSection.questions.map((q, idx) => (
                <button key={q.id} onClick={() => { saveTimeAndMove(() => { setCurrentQuestionIdx(idx); setVisited({ ...visited, [q.id]: true }); }); }} className={`w-10 h-10 flex items-center justify-center font-bold border border-gray-400 shadow-sm ${getPaletteStatus(q.id)}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          
          {/* RIGHT SIDE SUBMIT BUTTON */}
          <div className="p-3 bg-gray-50 border-t border-gray-300">
             <button onClick={() => handleSubmit(false)} className="w-full py-2 bg-blue-900 text-white rounded font-semibold hover:bg-blue-800">Submit Test</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-xl text-blue-900">Loading Exam Interface...</div>}>
      <ExamContent />
    </Suspense>
  );
}