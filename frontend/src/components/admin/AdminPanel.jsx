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
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner label="Loading admin data…" />
      </div>
    );
  }

  return (
    <div className="space-y-12 flex flex-col items-center">
      <header className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-card animate-fade-in-up">
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-brand-500 font-semibold flex items-center justify-center gap-2">
              Admin operations
            </p>
            <h1 className="font-display text-3xl font-bold text-gray-900 mt-2 flex items-center justify-center gap-3">
              Coordinate the entire exchange
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-700">Upload employees, configure visibility, and orchestrate assignments with a polished control center.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={handleGenerate} disabled={busy}>
              Generate assignments
            </Button>
            <Button onClick={handleNotify} disabled={busy} variant="secondary">
              Email assignments
            </Button>
          </div>
        </div>
      </header>

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2 md:place-items-center">
        <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <EmployeeUpload onComplete={loadData} />
        </div>
        {settings ? (
          <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <WishlistSettings settings={settings} onRefresh={loadData} />
          </div>
        ) : null}
      </div>

      <section className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex flex-col items-center gap-4 text-center sm:text-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-500 font-semibold flex items-center justify-center gap-2">
              Assignments overview
            </p>
            <h2 className="font-display text-2xl font-bold text-gray-900 mt-2">Employee pairings</h2>
          </div>
          <span className="text-xs text-muted-700 flex items-center justify-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-500 font-semibold">
              {employees.length}
            </span>
            team members
          </span>
        </div>
        <AssignmentList employees={employees.filter((employee) => !employee.is_admin)} />
      </section>
    </div>
  );
}
