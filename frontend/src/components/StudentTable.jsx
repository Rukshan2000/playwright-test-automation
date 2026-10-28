export default function StudentTable({ students, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Age</th>
            <th className="px-4 py-3">Course</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{s.first_name} {s.last_name}</td>
              <td className="px-4 py-3">{s.email}</td>
              <td className="px-4 py-3">{s.age}</td>
              <td className="px-4 py-3">{s.course}</td>
              <td className="space-x-2 px-4 py-3 whitespace-nowrap">
                <button onClick={() => onEdit(s)} className="rounded bg-slate-200 px-3 py-1 hover:bg-slate-300">
                  Edit
                </button>
                <button onClick={() => onDelete(s)} className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
