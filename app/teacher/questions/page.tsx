'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Question = { id: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string; topic?: string; positiveMarks: number; negativeMarks: number; };
type Section = { id: string; name: string; questions: Question[] };
type MockTest = { id: string; title: string; sections: Section[] };

export default function QuestionBuilder() {
  const router = useRouter();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Selection State
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [topic, setTopic] = useState('');
  const [positiveMarks, setPositiveMarks] = useState('1.0');
  const [negativeMarks, setNegativeMarks] = useState('-0.25');

  const fetchTests = () => {
    fetch('/api/questions', { cache: 'no-store' }).then(res => res.json()).then(data => {
      setMockTests(data);
      if (data.length > 0) {
        setSelectedTestId(data[0].id);
        setAvailableSections(data[0].sections);
        if (data[0].sections.length > 0) {
          setSelectedSectionId(data[0].sections[0].id);
          setExistingQuestions(data[0].sections[0].questions || []);
        }
      }
    });
  };

  useEffect(() => { fetchTests(); }, []);

  const handleTestChange = (testId: string) => {
    setSelectedTestId(testId);
    const test = mockTests.find(t => t.id === testId);
    if (test) {
      setAvailableSections(test.sections);
      const firstSec = test.sections.length > 0 ? test.sections[0] : null;
      setSelectedSectionId(firstSec ? firstSec.id : '');
      setExistingQuestions(firstSec ? firstSec.questions || [] : []);
      resetForm();
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = availableSections.find(s => s.id === sectionId);
    setExistingQuestions(section ? section.questions || [] : []);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setText(''); setOptionA(''); setOptionB(''); setOptionC(''); setOptionD(''); 
    setCorrectOption('A'); setExplanation('');
    setPositiveMarks('1.0'); setNegativeMarks('-0.25'); setTopic('');
  };

  const handleEditClick = (q: Question) => {
    setEditingId(q.id);
    setText(q.text);
    setOptionA(q.optionA); setOptionB(q.optionB); setOptionC(q.optionC); setOptionD(q.optionD);
    setCorrectOption(q.correctOption);
    setExplanation(q.explanation || '');
    setTopic(q.topic || '');
    setPositiveMarks(q.positiveMarks.toString());
    setNegativeMarks(q.negativeMarks.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    setExistingQuestions(prev => prev.filter(q => q.id !== id));
    if (editingId === id) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId) return alert('Please select a section first');
    setLoading(true);

    const payload = {
      sectionId: selectedSectionId,
      text, optionA, optionB, optionC, optionD, correctOption, explanation, topic,
      positiveMarks: parseFloat(positiveMarks),
      negativeMarks: parseFloat(negativeMarks)
    };

    const url = editingId ? `/api/questions/${editingId}` : '/api/questions';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert(editingId ? 'Question Updated!' : 'Question Added!');
      if (editingId) {
        setExistingQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...payload } : q));
      } else {
        const newQ = await res.json();
        setExistingQuestions(prev => [...prev, newQ]);
      }
      resetForm();
    } else {
      alert('Error saving question');
    }
    setLoading(false);
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const templateData = [
        {
          Question: "What is 2+2?", Topic: "Addition",
          OptionA: "3", OptionB: "4", OptionC: "5", OptionD: "6",
          CorrectOption: "B",
          Explanation: "Basic addition.",
          PositiveMarks: 2.0,
          NegativeMarks: -0.5
        }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      XLSX.writeFile(wb, "Question_Template.xlsx");
    } catch (err) {
      alert("Error generating template.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedSectionId) { alert("Please select a section first!"); e.target.value = ''; return; }

    setBulkUploading(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const formattedQuestions = rawData.map(row => ({
        sectionName: row.Section || row.section || '', // NEW: Read section name
        text: row.Question || row.question,
        topic: row.Topic || row.topic || '',
        optionA: row.OptionA || row.optionA,
        optionB: row.OptionB || row.optionB,
        optionC: row.OptionC || row.optionC,
        optionD: row.OptionD || row.optionD,
        correctOption: (row.CorrectOption || row.correctOption || 'A').toUpperCase(),
        explanation: row.Explanation || row.explanation || '',
        positiveMarks: parseFloat(row.PositiveMarks) || 1.0,
        negativeMarks: parseFloat(row.NegativeMarks) || -0.25,
      }));

      if (formattedQuestions.length === 0) throw new Error("No data found in file");

      const res = await fetch('/api/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testId: selectedTestId, 
          defaultSectionId: selectedSectionId, 
          questions: formattedQuestions 
        })
      });

      if (!res.ok) throw new Error("Failed to upload");
      const result = await res.json();
      alert(`Successfully uploaded ${result.count} questions!`);
      fetchTests();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setBulkUploading(false);
      e.target.value = ''; 
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-gray-900 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Question Builder</h1>
        <button onClick={() => router.push('/teacher')} className="text-blue-600 hover:underline">Back to Dashboard</button>
      </div>

      <div className="bg-white p-6 rounded shadow-md border border-green-200 mb-8 bg-green-50">
        <h2 className="text-xl font-bold text-green-900 mb-2">Bulk Upload via Excel</h2>
        <p className="text-sm text-gray-600 mb-4">Download the template, fill in your questions (including Positive and Negative marks), and upload the file.</p>
        <div className="flex gap-4">
          <button type="button" onClick={downloadTemplate} className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700">📥 Download Template</button>
          <div className="relative">
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={bulkUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
            <button type="button" disabled={bulkUploading} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400">
              {bulkUploading ? '⏳ Uploading...' : '📤 Upload Excel File'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className={`bg-white p-6 rounded shadow-md border-2 ${editingId ? 'border-yellow-400' : 'border-gray-200'} space-y-4 sticky top-8`}>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mock Test</label>
                  <select value={selectedTestId} onChange={(e) => handleTestChange(e.target.value)} className="w-full border p-2 rounded text-sm">
                    {mockTests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Section</label>
                  <select value={selectedSectionId} onChange={(e) => handleSectionChange(e.target.value)} className="w-full border p-2 rounded text-sm">
                    {availableSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold flex justify-between items-center">
              {editingId ? 'Edit Question' : 'Add New Question (Manual)'}
              {editingId && <button type="button" onClick={resetForm} className="text-xs bg-gray-200 px-2 py-1 rounded">Cancel Edit</button>}
            </h2>

            <div>
              <label className="block font-medium mb-1 text-sm">Question Text</label>
              <textarea required rows={3} value={text} onChange={(e) => setText(e.target.value)} className="w-full border p-2 rounded text-sm"></textarea>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs mb-1">Option A</label><input type="text" required value={optionA} onChange={(e) => setOptionA(e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
              <div><label className="block text-xs mb-1">Option B</label><input type="text" required value={optionB} onChange={(e) => setOptionB(e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
              <div><label className="block text-xs mb-1">Option C</label><input type="text" required value={optionC} onChange={(e) => setOptionC(e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
              <div><label className="block text-xs mb-1">Option D</label><input type="text" required value={optionD} onChange={(e) => setOptionD(e.target.value)} className="w-full border p-2 rounded text-sm" /></div>
            </div>

            <div>
              <label className="block font-medium mb-1 text-sm">Explanation (Optional)</label>
              <textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} className="w-full border p-2 rounded text-sm"></textarea>
            </div>

            {/* MARKS SECTION */}
            <div>
              <label className="block font-medium mb-1 text-sm">Topic / Chapter (Optional)</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="e.g. Algebra, Reading Comprehension" />
            </div>

            <div className="bg-gray-50 p-4 border border-gray-200 rounded grid grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-sm mb-1">Correct Option</label>
                <select value={correctOption} onChange={(e) => setCorrectOption(e.target.value)} className="w-full border p-2 rounded font-bold text-green-700 bg-white">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Positive Marks</label>
                <input type="number" step="0.01" required value={positiveMarks} onChange={(e) => setPositiveMarks(e.target.value)} className="w-full border p-2 rounded text-green-700 font-bold" />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Negative Marks</label>
                <input type="number" step="0.01" required value={negativeMarks} onChange={(e) => setNegativeMarks(e.target.value)} className="w-full border p-2 rounded text-red-700 font-bold" />
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full font-bold py-3 rounded text-white ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
              {loading ? 'Saving...' : editingId ? 'Update Question' : 'Save Question'}
            </button>
          </form>
        </div>

        <div>
          <div className="bg-white p-6 rounded shadow-md border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-blue-900">Questions in this Section ({existingQuestions.length})</h2>
            
            {existingQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No questions added yet.</p>
            ) : (
              <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                {existingQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 border border-gray-200 rounded bg-gray-50 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-sm bg-gray-200 px-2 py-1 rounded mr-2">Q{idx + 1}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">+{q.positiveMarks}</span>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded ml-1">{q.negativeMarks}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(q)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Edit</button>
                        <button onClick={() => handleDeleteClick(q.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Delete</button>
                      </div>
                    </div>
                    <p className="text-sm mb-2 font-medium">{q.text}</p>
                    <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
                      <span className={q.correctOption === 'A' ? 'font-bold text-green-600' : ''}>A) {q.optionA}</span>
                      <span className={q.correctOption === 'B' ? 'font-bold text-green-600' : ''}>B) {q.optionB}</span>
                      <span className={q.correctOption === 'C' ? 'font-bold text-green-600' : ''}>C) {q.optionC}</span>
                      <span className={q.correctOption === 'D' ? 'font-bold text-green-600' : ''}>D) {q.optionD}</span>
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