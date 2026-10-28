import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELDS = [
  { name: 'first_name', label: 'First Name' },
  { name: 'last_name', label: 'Last Name' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'course', label: 'Course' },
];

function validate(values) {
  const errors = {};
  for (const f of FIELDS) {
    if (!String(values[f.name] ?? '').trim()) errors[f.name] = `${f.label} is required`;
  }
  if (values.email && !EMAIL_RE.test(values.email)) errors.email = 'Please enter a valid email address';
  return errors;
}

export default function StudentForm({ student, onSave, onCancel }) {
  const isEdit = Boolean(student.id);
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.name, student[f.name] ?? '']))
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      await onSave({ ...values, age: Number(values.age) });
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong');
    }
  }

  return (
    // noValidate turns off the browser's built-in popups so our own messages show
    <form onSubmit={handleSubmit} noValidate aria-label="Student form" className="mb-6 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{isEdit ? 'Edit Student' : 'Add Student'}</h2>
      {serverError && <p role="alert" className="mb-4 text-red-600">{serverError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
            <input
              id={f.name}
              type={f.type || 'text'}
              value={values[f.name]}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              aria-invalid={Boolean(errors[f.name])}
              aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {errors[f.name] && <p id={`${f.name}-error`} className="mt-1 text-sm text-red-600">{errors[f.name]}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          {isEdit ? 'Update' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-slate-200 px-4 py-2 hover:bg-slate-300">Cancel</button>
      </div>
    </form>
  );
}
