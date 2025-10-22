import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchEmployees,
  fetchSettings,
  generateAssignments,
  notifyAssignments,
  fetchIncompleteWishlists,
  sendWishlistReminders
} from '../../services/api.js';
import EmployeeUpload from './EmployeeUpload.jsx';
import AssignmentList from './AssignmentList.jsx';
import WishlistSettings from './WishlistSettings.jsx';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import Modal from '../common/Modal.jsx';

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [incompleteEmployees, setIncompleteEmployees] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderResults, setReminderResults] = useState(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const assignmentsGenerated = settings?.assignment_completed === '1';

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: employeeData }, { data: settingsData }, { data: incompleteData }] = await Promise.all([
        fetchEmployees(),
        fetchSettings(),
        fetchIncompleteWishlists()
      ]);
      setEmployees(
        employeeData.employees.map((employee) => ({
          ...employee,
          recipient: employee.recipient_id ? employeeData.employees.find((row) => row.id === employee.recipient_id) : null
        }))
      );
      setSettings(settingsData.settings);
      setIncompleteCount(incompleteData.count);
      setIncompleteEmployees(incompleteData.employees || []);
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
    // If assignments already generated, show confirmation modal
    if (assignmentsGenerated) {
      setShowRegenerateModal(true);
      return;
    }
    
    // First time generation - proceed directly
    await performGeneration();
  }

  async function performGeneration() {
    setBusy(true);
    try {
      await generateAssignments();
      toast.success('Assignments created');
      await loadData();
      setShowRegenerateModal(false);
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

  async function handleSendReminders() {
    setBusy(true);
    try {
      const { data } = await sendWishlistReminders();
      setReminderResults(data);
      setShowReminderModal(true);
      toast.success(data.message);
      await loadData(); // Refresh incomplete count
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reminders');
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
              {assignmentsGenerated ? '🔄 Re-generate assignments' : 'Generate assignments'}
            </Button>
            <Button onClick={handleNotify} disabled={busy} variant="secondary">
              Email assignments
            </Button>
          </div>
          
          {assignmentsGenerated && (
            <div className="mt-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-medium flex items-center justify-center gap-1">
                <span>✓</span>
                <span>Assignments already generated. Re-generating will change all recipients!</span>
              </p>
            </div>
          )}
          
          {/* Incomplete Wishlists Section */}
          {incompleteCount > 0 && (
            <div className="mt-4 w-full max-w-md">
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 px-4 py-3">
                <div className="flex items-center justify-center gap-2 text-yellow-800 font-semibold text-sm mb-2">
                  <span className="text-xl">⚠️</span>
                  <span>{incompleteCount} employee{incompleteCount > 1 ? 's' : ''} with incomplete wishlist{incompleteCount > 1 ? 's' : ''}</span>
                </div>
                <Button 
                  onClick={handleSendReminders} 
                  disabled={busy}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>📧</span>
                    <span>Send Wishlist Reminders</span>
                  </span>
                </Button>
              </div>
            </div>
          )}
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
              {employees.filter((employee) => !employee.is_admin).length}
            </span>
            team members
          </span>
        </div>
        <AssignmentList employees={employees.filter((employee) => !employee.is_admin)} />
      </section>

      {/* Reminder Results Modal */}
      {showReminderModal && reminderResults && (
        <Modal
          open={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setReminderResults(null);
          }}
          title="Wishlist Reminder Results"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reminderResults.sent}</div>
                <div className="text-xs text-gray-600 uppercase tracking-wide">Sent</div>
              </div>
              {reminderResults.failed > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{reminderResults.failed}</div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Failed</div>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="text-sm font-semibold text-gray-700 mb-2">Email Recipients:</div>
              <ul className="space-y-2">
                {reminderResults.results?.map((result, idx) => (
                  <li 
                    key={idx}
                    className={`flex items-start justify-between p-3 rounded-lg border ${
                      result.status === 'sent' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.name}</div>
                      <div className="text-xs text-gray-600">{result.email}</div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1 font-mono">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {result.status === 'sent' ? (
                        <span className="text-green-600 font-semibold text-xs whitespace-nowrap">✓ Sent</span>
                      ) : (
                        <span className="text-red-600 font-semibold text-xs whitespace-nowrap">✗ Failed</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderResults(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Re-generate Confirmation Modal */}
      {showRegenerateModal && (
        <Modal
          open={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          title="⚠️ Re-generate Assignments?"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-semibold mb-2">
                Warning: This action will completely change all Secret Santa assignments!
              </p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>All existing recipient assignments will be deleted</li>
                <li>New random assignments will be generated</li>
                <li>Employees who already saw their recipients will see different people</li>
                <li>This cannot be undone</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Recommendation:</strong> Only re-generate if there was an error in the original assignments. 
                If assignments were already emailed, you should notify employees about the change.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={() => setShowRegenerateModal(false)}
                variant="secondary"
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                onClick={performGeneration}
                disabled={busy}
              >
                {busy ? 'Generating...' : 'Yes, Re-generate'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
