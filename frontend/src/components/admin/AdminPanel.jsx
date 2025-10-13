import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchEmployees,
  fetchSettings,
  generateAssignments,
  notifyAssignments
} from '../../services/api.js';
import EmployeeUpload from './EmployeeUpload.jsx';
import AssignmentList from './AssignmentList.jsx';
import WishlistSettings from './WishlistSettings.jsx';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: employeeData }, { data: settingsData }] = await Promise.all([
        fetchEmployees(),
        fetchSettings()
      ]);
      setEmployees(
        employeeData.employees.map((employee) => ({
          ...employee,
          recipient: employee.recipient_id ? employeeData.employees.find((row) => row.id === employee.recipient_id) : null
        }))
      );
      setSettings(settingsData.settings);
    } catch (error) {
      toast.error('Unable to load admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleGenerate() {
    setBusy(true);
    try {
      await generateAssignments();
      toast.success('Assignments created');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate assignments');
    } finally {
      setBusy(false);
    }
  }

  async function handleNotify() {
    setBusy(true);
    try {
      await notifyAssignments();
      toast.success('Assignment emails queued');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notifications');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading admin data…" />;
  }

  return (
    <div className="space-y-12 text-slate-200">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-iris/20 via-nightfall to-nightfall p-8 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Admin operations</p>
            <h1 className="font-display text-3xl font-semibold text-white">Coordinate the entire exchange</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">Upload employees, configure visibility, and orchestrate assignments with a polished control center.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={busy}>Generate assignments</Button>
            <Button onClick={handleNotify} disabled={busy} variant="secondary">Email assignments</Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <EmployeeUpload onComplete={loadData} />
        {settings ? <WishlistSettings settings={settings} onRefresh={loadData} /> : null}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Assignments overview</p>
            <h2 className="font-display text-2xl font-semibold text-white">Employee pairings</h2>
          </div>
          <span className="text-xs text-slate-400">Showing {employees.length} team members</span>
        </div>
        <AssignmentList employees={employees.filter((employee) => !employee.is_admin)} />
      </section>
    </div>
  );
}
