// A simple accessible modal. role="dialog" lets Playwright find it with getByRole('dialog').
export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 id="confirm-title" className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-6 text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg bg-slate-200 px-4 py-2 hover:bg-slate-300">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>
  );
}
