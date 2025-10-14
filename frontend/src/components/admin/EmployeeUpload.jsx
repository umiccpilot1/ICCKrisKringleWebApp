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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card text-center">
      <h2 className="text-lg font-semibold text-gray-900">Upload employees</h2>
      <p className="mt-2 text-sm text-muted-700">Import an Excel file containing columns for Name, Email, and Admin (Yes/No).</p>
      <form className="mt-5 flex flex-col items-center gap-4" onSubmit={handleUpload}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => setFile(event.target.files[0] || null)}
          className="w-full text-xs text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-brand-500 hover:file:bg-brand-100 file:transition-colors"
        />
        <Button type="submit" disabled={loading}>{loading ? 'Uploading…' : 'Upload'}</Button>
      </form>
    </div>
  );
}
