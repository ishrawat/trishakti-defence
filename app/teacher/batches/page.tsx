'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Batch = { id: string; name: string; studentCount: number; averageScore: string; testIds?: string[]; };
type MockTest = { id: string; title: string; exam?: { name: string } };

export default function ManageBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit Access State
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [resBatches, resTests] = await Promise.all([
        fetch('/api/admin/batches', { cache: 'no-store' }),
        fetch('/api/questions', { cache: 'no-store' })
      ]);
      
      const batchData = await resBatches.json();
      const testData = await resTests.json();
      
      if (Array.isArray(batchData)) setBatches(batchData);
      else console.error("Batches API error:", batchData);
      
      if (Array.isArray(testData)) setMockTests(testData);
      else console.error("Tests API error:", testData);
      
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setName('');
    setLoading(false);
    fetchData();
  };

  const openAccessModal = (batch: Batch) => {
    console.log("Opening modal for batch:", batch.name);
    setEditingBatch(batch);
    // Safeguard against undefined testIds
    setSelectedTestIds(Array.isArray(batch.testIds) ? batch.testIds : []);
  };

  const handleSaveAccess = async () => {
    if (!editingBatch) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/admin/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testIds: selectedTestIds }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save');
      }

      setEditingBatch(null);
      fetchData();
    } catch (err: any) {
      alert(`Error saving access: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50 text-gray-900 relative">
      
      {/* EDIT ACCESS MODAL */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 max-h-[90vh] flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Assign Tests to {editingBatch.name}</h2>
            <p className="text-gray-500 mb-6 text-sm">Check the tests you want this batch to have access to.</p>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-3 mb-6">
              {mockTests.length === 0 && <p className="text-gray-500 italic">No mock tests created yet.</p>}
              
              {mockTests.map(test => (
                <label key={test.id} className="flex items-center gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox"
                    checked={selectedTestIds.includes(test.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTestIds([...selectedTestIds, test.id]);
                      else setSelectedTestIds(selectedTestIds.filter(id => id !== test.id));
                    }}
                    className="w-5 h-5 cursor-pointer text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-gray-800">{test.title}</div>
                    <div className="text-xs text-gray-500">{test.exam?.name || "Unassigned Exam"}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button onClick={() => setEditingBatch(null)} className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 rounded hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={handleSaveAccess} disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                {loading ? 'Saving...' : 'Save Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Batch Management</h1>
        <Link href="/teacher" className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CREATE BATCH FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Create New Batch</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Army Agniveer 2024" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
                {loading ? 'Creating...' : 'Create Batch'}
              </button>
            </form>
          </div>
        </div>

        {/* BATCH ANALYTICS LIST */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Active Batches ({batches.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {batches.length === 0 && <p className="p-8 text-center text-gray-500">No batches created yet.</p>}
              
              {batches.map(batch => (
                <div key={batch.id} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-blue-900">{batch.name}</h3>
                    <p className="text-sm text-gray-500">{batch.studentCount} Students | {batch.testIds?.length || 0} Tests Assigned</p>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-500">Batch Avg Score</div>
                      <div className={`text-xl font-extrabold ${batch.averageScore === 'N/A' ? 'text-gray-400' : 'text-green-600'}`}>
                        {batch.averageScore}
                      </div>
                    </div>
                    <button 
                      onClick={() => openAccessModal(batch)}
                      className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-900 transition-colors whitespace-nowrap"
                    >
                      Edit Test Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}