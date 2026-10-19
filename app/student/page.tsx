'use client';

import { useState, useEffect } from 'react';

type MockTest = { id: string; title: string; totalDuration: number; exam: { name: string } };
type Attempt = { id: string; totalScore: number; endTime: string; mockTest: MockTest };
type Profile = { name: string; email: string; batch: string; };

export default function StudentDashboard() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/student/profile', { cache: 'no-store' }).then(res => res.json()),
      fetch('/api/student/tests', { cache: 'no-store' }).then(res => res.json()),
      fetch('/api/student/history', { cache: 'no-store' }).then(res => res.json())
    ]).then(([profileData, testsData, historyData]) => {
      if (profileData && !profileData.error) setProfile(profileData);
      if (Array.isArray(testsData)) setTests(testsData);
      if (Array.isArray(historyData)) setHistory(historyData);
      setLoading(false);
    }).catch(err => {
      console.error("Dashboard fetch error:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-[#5e1515]">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16 font-sans text-gray-800">
      
      {/* CLEAN & PROFESSIONAL NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="Trishul Defence" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-tight">Trishul Defence</h1>
              <p className="text-xs text-[#B8860B] font-serif tracking-widest mt-0.5">त्रिशक्त्या वीरप्रसविनी</p>
            </div>
          </div>
          
          {/* User Profile */}
          {profile && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">{profile.name}</div>
                <div className="text-xs text-gray-500 font-medium">{profile.batch}</div>
              </div>
              <div className="w-10 h-10 bg-[#5e1515] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        
        {/* MINIMALIST WELCOME SECTION */}
        {profile && (
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-200 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            {/* Subtle left accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#B8860B]"></div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {profile.name.split(' ')[0]}.</h2>
              <p className="text-gray-500 text-sm max-w-lg">
                Your mock tests are ready. Maintain your focus, track your progress, and keep pushing towards your goal.
              </p>
            </div>
            
            <div className="bg-[#F8F9FA] border border-gray-100 py-3 px-6 rounded-xl flex-shrink-0 text-center md:text-right">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Batch</div>
              <div className="font-semibold text-[#5e1515]">{profile.batch}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AVAILABLE TESTS */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Available Tests</h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-200/60 px-3 py-1 rounded-full">{tests.length} Tests</span>
            </div>

            {tests.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-gray-200 text-center shadow-sm">
                <p className="text-gray-500 text-sm">No mock tests assigned to your batch currently.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tests.map(test => (
                  <div key={test.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#5e1515]/30 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{test.exam?.name || 'Exam'}</div>
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{test.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {test.totalDuration} Mins
                        </span>
                      </div>
                    </div>
                    
                    <a href={`/exam/${test.id}?new=true`} className="bg-[#5e1515] hover:bg-[#4a1010] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto text-center whitespace-nowrap">
                      Start Test
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PERFORMANCE LOG */}
          <div className="lg:col-span-1 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Recent Scores</h3>
            </div>
            
            {history.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
                <p className="text-gray-500 text-sm">No previous attempts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(attempt => (
                  <div key={attempt.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1">{attempt.mockTest?.title}</div>
                    <div className="text-xs text-gray-400 mb-3">
                      {new Date(attempt.endTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {attempt.totalScore.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Score</div>
                      </div>
                      <a href={`/student/review/${attempt.id}`} className="text-[#5e1515] hover:text-[#4a1010] bg-[#5e1515]/5 hover:bg-[#5e1515]/10 px-3 py-1.5 rounded text-xs font-semibold transition-colors">
                        Review
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}