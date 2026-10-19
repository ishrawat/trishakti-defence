'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Student = { id: string; name: string; email: string; batch: { name: string } | null; initialPassword: string; };
type Batch = { id: string; name: string };

export default function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [batchId, setBatchId] = useState('');

  // Modals State
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState({ email: '', password: '' });
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBatchId, setEditBatchId] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const fetchData = async () => {
    try {
      const [resStudents, resBatches] = await Promise.all([
        fetch('/api/admin/students', { cache: 'no-store' }),
        fetch('/api/admin/batches', { cache: 'no-store' })
      ]);
      
      const studentData = await resStudents.json();
      const batchData = await resBatches.json();
      
      if (Array.isArray(studentData)) setStudents(studentData);
      if (Array.isArray(batchData)) setBatches(batchData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, batchId }),
    });

    if (res.ok) {
      setGeneratedCreds({ email, password });
      setShowCredentials(true);
      setName(''); setEmail(''); setPassword(''); setBatchId('');
      fetchData();
    } else {
      const error = await res.json();
      alert(error.error || 'Failed to create student');
    }
    setLoading(false);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditPassword('');
    // Find the batchId based on the batch name
    const currentBatch = batches.find(b => b.name === student.batch?.name);
    setEditBatchId(currentBatch ? currentBatch.id : '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setLoading(true);

    const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName, 
        email: editEmail, 
        batchId: editBatchId,
        newPassword: editPassword || undefined 
      }),
    });

    if (res.ok) {
      setEditingStudent(null);
      fetchData(); // Refresh list
      if (editPassword) {
        setGeneratedCreds({ email: editEmail, password: editPassword });
        setShowCredentials(true);
      }
    } else {
      const error = await res.json();
      alert(error.error || 'Failed to update student');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50 text-gray-900 relative">
      
      {/* CREDENTIALS MODAL */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 text-center">
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Credentials</h2>
            <p className="text-gray-500 mb-6 text-sm">Please copy these and send them to the student.</p>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-left mb-6 font-mono text-sm">
              <div className="mb-2"><strong className="text-gray-600">Email/ID:</strong> {generatedCreds.email}</div>
              <div><strong className="text-gray-600">Password:</strong> {generatedCreds.password}</div>
            </div>
            <button onClick={() => setShowCredentials(false)} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Close</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Student</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email / Login ID</label>
                <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to Batch</label>
                <select value={editBatchId} onChange={e => setEditBatchId(e.target.value)} className="w-full border p-2 rounded bg-white">
                  <option value="">No Batch / Remove from Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reset Password (Optional)</label>
                <input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full border p-2 rounded" placeholder="Leave blank to keep current password" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Student Management</h1>
        <Link href="/teacher" className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300">&larr; Back to Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CREATE FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Add New Student</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email / Login ID</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input type="text" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to Batch</label>
                <select required value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full border p-2 rounded bg-white">
                  <option value="">Select a Batch...</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Create Student</button>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Registered Students ({students.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-sm border-b border-gray-200">
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Batch</th>
                    <th className="p-4 font-semibold">Password</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                          {student.batch?.name || 'No Batch'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-700">
                        {student.initialPassword || 'Hidden'}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-3 items-center">
                        <button onClick={() => handleEditClick(student)} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-bold hover:bg-gray-300">
                          Edit
                        </button>
                        <Link href={`/teacher/students/${student.id}`} className="text-blue-600 hover:underline text-sm font-semibold">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}