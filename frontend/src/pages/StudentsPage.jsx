import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StudentForm from '../components/StudentForm.jsx';
import StudentTable from '../components/StudentTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = form closed, {} = new, student = edit
  const [deleting, setDeleting] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/students');
      setStudents(data);
      setError('');
    } catch {
      setError('Could not load students. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(values) {
    if (editing.id) {
      await api.put(`/students/${editing.id}`, values);
      setMessage('Student updated successfully');
    } else {
      await api.post('/students', values);
      setMessage('Student created successfully');
    }
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    await api.delete(`/students/${deleting.id}`);
    setMessage('Student deleted successfully');
    setDeleting(null);
    load();
  }

  const q = search.trim().toLowerCase();
  const visible = students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(q)
  );

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
        <button
          onClick={() => { setMessage(''); setEditing({}); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Add Student
        </button>
      </header>

      {message && (
        <p role="status" className="mb-4 rounded-lg bg-green-100 px-4 py-2 text-green-800">
          {message}
        </p>
      )}

      {editing && (
        <StudentForm
          key={editing.id || 'new'}
          student={editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      <input
        type="search"
        aria-label="Search students"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2"
      />

      {loading ? (
        <p>Loading students...</p>
      ) : error ? (
        <p role="alert" className="text-red-600">{error}</p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg bg-white p-8 text-center text-slate-500 shadow-sm">
          {students.length === 0 ? 'No students yet. Click "Add Student" to create one.' : 'No students match your search.'}
        </p>
      ) : (
        <StudentTable
          students={visible}
          onEdit={(s) => { setMessage(''); setEditing(s); }}
          onDelete={setDeleting}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete student?"
          message={`Are you sure you want to delete ${deleting.first_name} ${deleting.last_name}?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </main>
  );
}
