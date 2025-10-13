import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadEmployees } from '../../services/api.js';
import Button from '../common/Button.jsx';

export default function EmployeeUpload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) {
      toast.error('Select an Excel file first');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await uploadEmployees(formData);
      toast.success(`Imported ${data.count} employees`);
      setFile(null);
      event.target.reset();
      onComplete?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
      <h2 className="text-lg font-semibold text-white">Upload employees</h2>
      <p className="mt-2 text-sm text-slate-300">Import an Excel file containing columns for Name, Email, and Admin (Yes/No).</p>
      <form className="mt-5 space-y-4" onSubmit={handleUpload}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => setFile(event.target.files[0] || null)}
          className="block w-full text-xs text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-aurora/20 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.3em] file:text-white hover:file:bg-aurora/30"
        />
        <Button type="submit" disabled={loading}>{loading ? 'Uploading…' : 'Upload'}</Button>
      </form>
    </div>
  );
}
