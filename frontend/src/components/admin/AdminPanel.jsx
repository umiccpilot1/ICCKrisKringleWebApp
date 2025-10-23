import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchEmployees,
  fetchSettings,
  generateAssignments,
  notifyAssignments,
  fetchIncompleteWishlists,
  sendWishlistReminders,
  updateEmployeePhoto,
  uploadEmployeePhotos,
  mapEmployeePhotos,
  fetchNotificationJobStatus,
  cancelNotificationJob
} from '../../services/api.js';
import EmployeeUpload from './EmployeeUpload.jsx';
import AssignmentList from './AssignmentList.jsx';
import WishlistSettings from './WishlistSettings.jsx';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import Modal from '../common/Modal.jsx';

const NOTIFICATION_TYPES = {
  ASSIGNMENT_EMAILS: 'assignment-emails',
  WISHLIST_REMINDERS: 'wishlist-reminders'
};

const ACTIVE_NOTIFICATION_STATUSES = new Set(['running', 'cancelling']);
const TERMINAL_NOTIFICATION_STATUSES = new Set(['completed', 'cancelled', 'failed']);

const NOTIFICATION_STATUS_META = {
  pending: { icon: '🕒', color: 'text-gray-500', label: 'Pending' },
  sending: { icon: '📤', color: 'text-blue-600', label: 'Sending' },
  sent: { icon: '✅', color: 'text-green-600', label: 'Sent' },
  failed: { icon: '❌', color: 'text-red-600', label: 'Failed' },
  cancelled: { icon: '⏹️', color: 'text-amber-600', label: 'Cancelled' }
};

const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.ASSIGNMENT_EMAILS]: 'Assignment Emails',
  [NOTIFICATION_TYPES.WISHLIST_REMINDERS]: 'Wishlist Reminders'
};

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [incompleteCount, setIncompleteCount] = useState(0);
  const [incompleteEmployees, setIncompleteEmployees] = useState([]);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderResults, setReminderResults] = useState(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoWorking, setPhotoWorking] = useState(false);
  const [photoLogs, setPhotoLogs] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoMapped, setPhotoMapped] = useState([]);
  const [photoConflicts, setPhotoConflicts] = useState([]);
  const [photoMissing, setPhotoMissing] = useState([]);
  const [photoSummary, setPhotoSummary] = useState({ totalEmployees: 0, mappedCount: 0, autoMappedCount: 0, unmappedCount: 0 });
  const [manualSelections, setManualSelections] = useState({});
  const [manualUpdating, setManualUpdating] = useState(null);
  const [manualMappedCount, setManualMappedCount] = useState(0);

  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationContext, setNotificationContext] = useState(null);
  const [notificationJob, setNotificationJob] = useState(null);
  const [notificationInitializing, setNotificationInitializing] = useState(false);

  const fileInputRef = useRef(null);
  const photoWorkingRef = useRef(false);
  const rescanQueuedRef = useRef(false);
  const notificationPollingRef = useRef(null);
  const lastNotificationSnapshotRef = useRef({ id: null, status: null });

  const assignmentsGenerated = settings?.assignment_completed === '1';
  const notificationJobActive = Boolean(notificationJob && ACTIVE_NOTIFICATION_STATUSES.has(notificationJob.status));

  const notificationSummary = useMemo(() => {
    if (!notificationJob) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        pending: 0,
        processed: 0,
        percent: 0
      };
    }
    const { total, successCount, failureCount, cancelledCount, pendingCount } = notificationJob;
    const processed = total - pendingCount;
    const percent = total ? Math.round((processed / total) * 100) : 0;
    return {
      total,
      sent: successCount,
      failed: failureCount,
      cancelled: cancelledCount,
      pending: pendingCount,
      processed,
      percent
    };
  }, [notificationJob]);

  const activeNotificationType = notificationJob?.type || notificationContext;
  const notificationLabel = NOTIFICATION_TYPE_LABELS[activeNotificationType] || 'Email Notifications';
  const notificationStatusText = notificationJob?.status || (notificationInitializing ? 'initializing' : 'idle');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [employeesResponse, settingsResponse, incompleteResponse] = await Promise.all([
        fetchEmployees(),
        fetchSettings(),
        fetchIncompleteWishlists()
      ]);

      setEmployees(employeesResponse.data?.employees || []);
      setSettings(settingsResponse.data?.settings || null);

      const incomplete = incompleteResponse.data?.employees || [];
      const count = typeof incompleteResponse.data?.count === 'number' ? incompleteResponse.data.count : incomplete.length;
      setIncompleteEmployees(incomplete);
      setIncompleteCount(count);
    } catch (error) {
      console.error('Failed to load admin data', error);
      const message = error?.response?.data?.message || 'Failed to load admin data.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopNotificationPolling = useCallback(() => {
    if (notificationPollingRef.current) {
      clearInterval(notificationPollingRef.current);
      notificationPollingRef.current = null;
    }
  }, []);

  const refreshNotificationStatus = useCallback(async () => {
    try {
      const { data } = await fetchNotificationJobStatus();
      if (data?.job) {
        setNotificationJob(data.job);
        setNotificationContext((prev) => prev || data.job.type);
      } else {
        setNotificationJob(null);
      }
    } catch (error) {
      console.error('Unable to fetch notification status', error);
    }
  }, []);

  const beginNotificationPolling = useCallback(() => {
    if (notificationPollingRef.current) {
      return;
    }
    notificationPollingRef.current = setInterval(() => {
      refreshNotificationStatus();
    }, 1000);
  }, [refreshNotificationStatus]);

  const startNotificationJob = useCallback(
    async (type) => {
      if (notificationJob && ACTIVE_NOTIFICATION_STATUSES.has(notificationJob.status)) {
        setNotificationModalOpen(true);
        toast.error('Another notification job is already running.');
        return;
      }

      const startRequest =
        type === NOTIFICATION_TYPES.ASSIGNMENT_EMAILS ? notifyAssignments : sendWishlistReminders;

      setNotificationContext(type);
      setNotificationModalOpen(true);
      setNotificationInitializing(true);

      try {
        const { data } = await startRequest();
        if (!data?.job) {
          throw new Error('No job data returned.');
        }

        setNotificationJob(data.job);
        setNotificationContext((prev) => data.job.type || prev || type);

        if (ACTIVE_NOTIFICATION_STATUSES.has(data.job.status)) {
          beginNotificationPolling();
        } else {
          stopNotificationPolling();
          if (data.job.message) {
            const notifyFn = data.job.status === 'failed' ? toast.error : toast.success;
            notifyFn(data.job.message);
          }
        }
      } catch (error) {
        const response = error?.response;
        if (response?.status === 409) {
          const existingJob = response.data?.job;
          if (existingJob) {
            setNotificationJob(existingJob);
            setNotificationContext(existingJob.type);
            setNotificationModalOpen(true);
            if (ACTIVE_NOTIFICATION_STATUSES.has(existingJob.status)) {
              beginNotificationPolling();
            } else {
              stopNotificationPolling();
            }
          } else {
            await refreshNotificationStatus();
          }
          toast.error(response.data?.message || 'Another notification job is already running.');
        } else {
          stopNotificationPolling();
          setNotificationModalOpen(false);
          setNotificationContext(null);
          const message = response?.data?.message || error.message || 'Unable to start notification job.';
          toast.error(message);
        }
      } finally {
        setNotificationInitializing(false);
      }
    },
    [notificationJob, beginNotificationPolling, stopNotificationPolling, refreshNotificationStatus]
  );

  const performGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await generateAssignments();
      toast.success(data?.message || 'Assignments generated');
      setShowRegenerateModal(false);
      await loadData();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to generate assignments.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [loadData]);

  const handleNotificationCancel = useCallback(async () => {
    if (!notificationJob || !ACTIVE_NOTIFICATION_STATUSES.has(notificationJob.status)) {
      toast.error('No active notification job to stop.');
      return;
    }

    try {
      const { data } = await cancelNotificationJob();
      if (data?.job) {
        setNotificationJob(data.job);
        if (ACTIVE_NOTIFICATION_STATUSES.has(data.job.status)) {
          beginNotificationPolling();
        } else {
          stopNotificationPolling();
        }
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to stop the notification job.';
      toast.error(message);
    }
  }, [notificationJob, beginNotificationPolling, stopNotificationPolling]);

  const handleNotificationModalClose = useCallback(() => {
    if (notificationJobActive) {
      toast.error('Stop the email run before closing.');
      return;
    }

    stopNotificationPolling();
    setNotificationModalOpen(false);
    setNotificationContext(null);
    setNotificationJob(null);
    setNotificationInitializing(false);
  }, [notificationJobActive, stopNotificationPolling]);

  useEffect(() => {
    refreshNotificationStatus();
  }, [refreshNotificationStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => () => {
    stopNotificationPolling();
  }, [stopNotificationPolling]);

  useEffect(() => {
    if (notificationJob && ACTIVE_NOTIFICATION_STATUSES.has(notificationJob.status)) {
      beginNotificationPolling();
    }

    if (!notificationJob || TERMINAL_NOTIFICATION_STATUSES.has(notificationJob?.status)) {
      stopNotificationPolling();
    }
  }, [notificationJob, beginNotificationPolling, stopNotificationPolling]);

  useEffect(() => {
    if (!notificationJob || !TERMINAL_NOTIFICATION_STATUSES.has(notificationJob.status)) {
      return;
    }

    stopNotificationPolling();
    const previous = lastNotificationSnapshotRef.current;
    if (!previous || previous.id !== notificationJob.id || previous.status !== notificationJob.status) {
      lastNotificationSnapshotRef.current = { id: notificationJob.id, status: notificationJob.status };
      if (notificationJob.message) {
        const notifyFn = notificationJob.status === 'failed' ? toast.error : toast.success;
        notifyFn(notificationJob.message);
      }
      loadData();
    }
  }, [notificationJob, stopNotificationPolling, loadData]);

  const logIcons = useMemo(
    () => ({
      mapped: '✅',
      info: 'ℹ️',
      conflict: '🧭',
      missing: '⚠️',
      error: '❌'
    }),
    []
  );

  const progressPercent = useMemo(() => {
    if (!photoSummary.totalEmployees) {
      return 0;
    }
    return Math.round((photoSummary.mappedCount / photoSummary.totalEmployees) * 100);
  }, [photoSummary]);

  const handleNotifyClick = useCallback(() => {
    startNotificationJob(NOTIFICATION_TYPES.ASSIGNMENT_EMAILS);
  }, [startNotificationJob]);

  const handleGenerateClick = useCallback(() => {
    if (assignmentsGenerated) {
      setShowRegenerateModal(true);
      return;
    }
    performGenerate();
  }, [assignmentsGenerated, performGenerate]);

  const handleReminderClick = useCallback(() => {
    startNotificationJob(NOTIFICATION_TYPES.WISHLIST_REMINDERS);
  }, [startNotificationJob]);

  const appendPhotoLog = useCallback((entry) => {
    setPhotoLogs((prev) => [...prev, { id: `${entry.status}-${Date.now()}`, ...entry }]);
  }, []);

  const normaliseMapResponse = useCallback((payload) => {
    const files = (payload?.files || []).slice().sort((a, b) => a.localeCompare(b));
    const availableFiles = (payload?.availableFiles || files).slice().sort((a, b) => a.localeCompare(b));

    return {
      files,
      availableFiles,
      mapped: (payload?.mapped || []).slice().sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
      conflicts: (payload?.unmapped?.conflicts || []).slice().sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
      missing: (payload?.unmapped?.missing || []).slice().sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
      summary: {
        totalEmployees: payload?.summary?.totalEmployees || 0,
        mappedCount: payload?.summary?.mappedCount || 0,
        autoMappedCount: payload?.summary?.autoMappedCount || 0,
        unmappedCount:
          payload?.summary?.unmappedCount !== undefined
            ? payload.summary.unmappedCount
            : (payload?.unmapped?.conflicts || []).length + (payload?.unmapped?.missing || []).length
      }
    };
  }, []);

  const runPhotoMapping = useCallback(async (options = {}) => {
    const { resetLogs = true, resetState = true } = options;
    if (photoWorkingRef.current) {
      rescanQueuedRef.current = true;
      return;
    }

    setPhotoWorking(true);
    photoWorkingRef.current = true;
    if (resetState) {
      setPhotoFiles([]);
      setPhotoMapped([]);
      setPhotoConflicts([]);
      setPhotoMissing([]);
      setPhotoSummary({ totalEmployees: 0, mappedCount: 0, autoMappedCount: 0, unmappedCount: 0 });
      setManualSelections({});
      setManualMappedCount(0);
    }
    if (resetLogs) {
      setPhotoLogs([]);
    }

    try {
      const { data } = await mapEmployeePhotos();
      const { availableFiles, mapped, conflicts, missing, summary } = normaliseMapResponse(data);

      setPhotoFiles(availableFiles);
      setPhotoMapped(mapped);
      setPhotoConflicts(conflicts);
      setPhotoMissing(missing);
      setPhotoSummary(summary);

      appendPhotoLog({
        status: summary.autoMappedCount ? 'mapped' : 'info',
        message: `Automatically mapped ${summary.autoMappedCount} employee${summary.autoMappedCount === 1 ? '' : 's'}.`
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to map employee photos';
      toast.error(message);
      appendPhotoLog({ status: 'error', message });
    } finally {
      setPhotoWorking(false);
      photoWorkingRef.current = false;
      if (rescanQueuedRef.current) {
        rescanQueuedRef.current = false;
        setTimeout(() => {
          runPhotoMapping();
        }, 0);
      }
    }
  }, [appendPhotoLog, normaliseMapResponse]);

  useEffect(() => {
    if (!showPhotoModal) {
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('webkitdirectory', '');
      fileInputRef.current.setAttribute('directory', '');
      fileInputRef.current.setAttribute('multiple', '');
    }

    runPhotoMapping();
  }, [runPhotoMapping, showPhotoModal]);

  useEffect(() => {
    setManualSelections((prev) => {
      const next = { ...prev };
      const activeIds = new Set([
        ...photoConflicts.map((entry) => entry.employeeId),
        ...photoMissing.map((entry) => entry.employeeId)
      ]);

      Object.keys(next).forEach((key) => {
        const numericId = Number(key);
        if (!activeIds.has(numericId)) {
          delete next[key];
        }
      });

      photoConflicts.forEach((entry) => {
        if (!next[entry.employeeId]) {
          next[entry.employeeId] = entry.matches?.[0] || '';
        }
      });

      photoMissing.forEach((entry) => {
        const hasCandidate = photoFiles.includes(entry.currentPhotoFilename);
        if (!next[entry.employeeId]) {
          next[entry.employeeId] = hasCandidate ? entry.currentPhotoFilename : '';
        }
      });

      return next;
    });
  }, [photoConflicts, photoMissing, photoFiles]);

  const handlePhotoPickClick = useCallback(() => {
    if (photoUploading) {
      toast.error('Please wait until the current upload finishes.');
      return;
    }

    fileInputRef.current?.click();
  }, [photoUploading]);

  const handlePhotoFolderChange = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      if (event.target) {
        event.target.value = '';
      }

      if (!files.length) {
        return;
      }

      const pngFiles = files.filter((file) => file.name?.toLowerCase().endsWith('.png'));
      if (!pngFiles.length) {
        toast.error('Only PNG files are supported.');
        return;
      }

      setPhotoUploading(true);
      appendPhotoLog({ status: 'info', message: `Uploading ${pngFiles.length} photo${pngFiles.length === 1 ? '' : 's'}…` });

      const formData = new FormData();
      pngFiles.forEach((file) => formData.append('photos', file, file.name));

      try {
        const { data } = await uploadEmployeePhotos(formData);
        appendPhotoLog({ status: 'mapped', message: data?.message || 'Upload complete.' });
        toast.success(data?.message || 'Photos uploaded');
        runPhotoMapping();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to upload photos';
        appendPhotoLog({ status: 'error', message });
        toast.error(message);
      } finally {
        setPhotoUploading(false);
      }
    },
    [appendPhotoLog, runPhotoMapping]
  );

  const handleRescanClick = useCallback(() => {
    if (photoUploading) {
      toast.error('Please wait until the current upload finishes.');
      return;
    }

    runPhotoMapping();
  }, [photoUploading, runPhotoMapping]);

  const handleManualSelection = useCallback((employeeId, value) => {
    setManualSelections((prev) => ({ ...prev, [employeeId]: value }));
  }, []);

  const handleManualAssign = useCallback(
    async (entry) => {
      const { employeeId, employeeName } = entry;
      const selectedFilename = manualSelections[employeeId];

      if (!selectedFilename) {
        toast.error('Pick a photo before assigning.');
        return;
      }

      setManualUpdating(employeeId);
      try {
        await updateEmployeePhoto(employeeId, selectedFilename);
        appendPhotoLog({ status: 'mapped', message: `Mapped ${employeeName} → ${selectedFilename}` });
        toast.success(`Photo mapped for ${employeeName}`);

  setPhotoFiles((prev) => prev.filter((filename) => filename !== selectedFilename));
        setPhotoConflicts((prev) => prev.filter((candidate) => candidate.employeeId !== employeeId));
        setPhotoMissing((prev) => prev.filter((candidate) => candidate.employeeId !== employeeId));
        setPhotoMapped((prev) => {
          const filtered = prev.filter((candidate) => candidate.employeeId !== employeeId);
          return [...filtered, { ...entry, photoFilename: selectedFilename, source: 'manual' }]
            .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        });
        setManualSelections((prev) => {
          const next = { ...prev };
          delete next[employeeId];
          Object.keys(next).forEach((key) => {
            if (next[key] === selectedFilename) {
              next[key] = '';
            }
          });
          return next;
        });
        setManualMappedCount((prev) => prev + 1);
        setPhotoSummary((prev) => ({
          totalEmployees: prev.totalEmployees,
          mappedCount: Math.min(prev.mappedCount + 1, prev.totalEmployees),
          autoMappedCount: prev.autoMappedCount,
          unmappedCount: Math.max(prev.unmappedCount - 1, 0)
        }));
  runPhotoMapping({ resetLogs: false, resetState: false });
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to map photo';
        appendPhotoLog({ status: 'error', message });
        toast.error(message);
      } finally {
        setManualUpdating(null);
      }
    },
    [appendPhotoLog, manualSelections, runPhotoMapping]
  );

  const handleClosePhotoModal = useCallback(() => {
    if (photoUploading || photoWorking) {
      toast.error('Please wait until processing completes.');
      return;
    }

    setShowPhotoModal(false);
    setPhotoLogs([]);
    setPhotoFiles([]);
    setPhotoMapped([]);
    setPhotoConflicts([]);
    setPhotoMissing([]);
    setPhotoSummary({ totalEmployees: 0, mappedCount: 0, autoMappedCount: 0, unmappedCount: 0 });
    setManualSelections({});
    setManualMappedCount(0);
    rescanQueuedRef.current = false;
    photoWorkingRef.current = false;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [photoUploading, photoWorking]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading admin data…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-12">
      <header className="relative w-full max-w-4xl animate-fade-in-up overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="max-w-2xl">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Admin operations
            </p>
            <h1 className="mt-2 flex items-center justify-center gap-3 font-display text-3xl font-bold text-gray-900">
              Coordinate the entire exchange
            </h1>
            <p className="mt-3 text-sm text-muted-700">
              Upload your employees, configure visibility, send reminders, and manage photo assignments in a single control center.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={handleGenerateClick} disabled={busy}>
              {assignmentsGenerated ? '🔄 Re-generate assignments' : 'Generate assignments'}
            </Button>
            <Button
              onClick={handleNotifyClick}
              disabled={busy || notificationJobActive || notificationInitializing}
              variant="secondary"
            >
              {activeNotificationType === NOTIFICATION_TYPES.ASSIGNMENT_EMAILS && (notificationJobActive || notificationInitializing)
                ? 'Sending…'
                : 'Email assignments'}
            </Button>
            <Button onClick={() => setShowPhotoModal(true)} disabled={busy} variant="ghost">
              <span className="flex items-center justify-center gap-2">
                <span>🖼️</span>
                <span>Manage employee photos</span>
              </span>
            </Button>
          </div>

          {assignmentsGenerated ? (
            <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-green-700">
                <span>✓</span>
                <span>Assignments already generated. Re-generating will replace every recipient pairing.</span>
              </p>
            </div>
          ) : null}

          {incompleteCount > 0 ? (
            <div className="mt-4 w-full max-w-md">
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 px-4 py-3">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-yellow-800">
                  <span className="text-xl">⚠️</span>
                  <span>
                    {incompleteCount} employee{incompleteCount > 1 ? 's' : ''} with incomplete wishlist{incompleteCount > 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  onClick={handleReminderClick}
                  disabled={busy || notificationJobActive || notificationInitializing}
                  className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>📧</span>
                    <span>
                      {activeNotificationType === NOTIFICATION_TYPES.WISHLIST_REMINDERS && (notificationJobActive || notificationInitializing)
                        ? 'Sending reminders…'
                        : 'Send Wishlist Reminders'}
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2 md:items-start">
        <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <EmployeeUpload onComplete={loadData} incompleteEmployees={incompleteEmployees} />
        </div>
        {settings ? (
          <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <WishlistSettings settings={settings} onRefresh={loadData} />
          </div>
        ) : null}
      </div>

      <section
        className="w-full max-w-4xl animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-8 shadow-card"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Assignments overview
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-gray-900">Employee pairings</h2>
          </div>
          <span className="flex items-center justify-center gap-1.5 text-xs text-muted-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-500">
              {employees.filter((employee) => !employee.is_admin).length}
            </span>
            team members
          </span>
        </div>
        <AssignmentList employees={employees.filter((employee) => !employee.is_admin)} />
      </section>

      {showReminderModal && reminderResults ? (
        <Modal
          open={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setReminderResults(null);
          }}
          title="Wishlist Reminder Results"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6 rounded-lg bg-gray-50 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reminderResults.sent}</div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Sent</div>
              </div>
              {reminderResults.failed > 0 ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{reminderResults.failed}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-600">Failed</div>
                </div>
              ) : null}
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="mb-2 text-sm font-semibold text-gray-700">Email recipients</div>
              <ul className="space-y-2">
                {reminderResults.results?.map((result, index) => (
                  <li
                    key={`${result.email}-${index}`}
                    className={`flex items-start justify-between rounded-lg border p-3 ${
                      result.status === 'sent' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.name}</div>
                      <div className="text-xs text-gray-600">{result.email}</div>
                      {result.error ? (
                        <div className="mt-1 text-xs font-mono text-red-600">Error: {result.error}</div>
                      ) : null}
                    </div>
                    <span className={`text-xs font-semibold ${result.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                    </span>
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
      ) : null}

      {showRegenerateModal ? (
        <Modal open={showRegenerateModal} onClose={() => setShowRegenerateModal(false)} title="⚠️ Re-generate Assignments?">
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-semibold text-red-800">Warning: this replaces every Secret Santa pairing!</p>
              <ul className="list-inside list-disc space-y-1 text-xs text-red-700">
                <li>All existing assignments are deleted</li>
                <li>New random recipients are generated</li>
                <li>Employees may have already viewed their previous recipient</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Recommendation:</strong> Only re-generate if the original assignments were incorrect. If emails were sent, notify the team about the change.
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={() => setShowRegenerateModal(false)} variant="secondary" disabled={busy}>
                Cancel
              </Button>
              <Button onClick={performGenerate} disabled={busy}>
                {busy ? 'Generating…' : 'Yes, re-generate'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {showPhotoModal ? (
        <Modal open={showPhotoModal} onClose={handleClosePhotoModal} title="Employee Photo Mapping">
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,image/png"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoFolderChange}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={handlePhotoPickClick} disabled={photoUploading}>
                  {photoUploading ? 'Uploading…' : 'Upload photo folder'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleRescanClick} disabled={photoUploading || photoWorking}>
                  Re-run scan
                </Button>
              </div>
              <p className="text-[11px] text-gray-500">PNG files only. Filenames should match employee last names.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold md:grid-cols-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                <span>Total employees</span>
                <span>{photoSummary.totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700">
                <span>Mapped</span>
                <span>{photoSummary.mappedCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                <span>Auto mapped</span>
                <span>{photoSummary.autoMappedCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                <span>Unmapped</span>
                <span>{photoSummary.unmappedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
              <span>Manual assignments this session: {manualMappedCount}</span>
              <span>
                Progress {photoSummary.mappedCount} / {photoSummary.totalEmployees}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-300 ${progressPercent === 100 ? 'bg-green-500' : 'bg-infosoft-red-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
              {photoLogs.length ? (
                <ul className="space-y-1">
                  {photoLogs.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-2 text-gray-700">
                      <span>{logIcons[entry.status] || '•'}</span>
                      <span>{entry.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Upload or scan to see results.</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Mapped employees</h3>
                {photoMapped.length ? (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-muted-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Employee</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Photo</th>
                          <th className="px-3 py-2 text-left">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {photoMapped.map((entry) => (
                          <tr key={entry.employeeId}>
                            <td className="px-3 py-2 text-gray-900">{entry.employeeName}</td>
                            <td className="px-3 py-2 text-muted-600">{entry.employeeEmail}</td>
                            <td className="px-3 py-2 font-mono text-[11px] text-muted-700">{entry.photoFilename}</td>
                            <td className="px-3 py-2 text-muted-600 capitalize">{entry.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-600">No employees have a mapped photo yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Manual selection required</h3>
                {photoConflicts.length ? (
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                    {photoConflicts.map((entry) => (
                      <div key={entry.employeeId} className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{entry.employeeName}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                              {entry.reason === 'duplicate-surname' ? 'Shared last name detected' : 'Multiple matching files'}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-700">{entry.employeeEmail}</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <select
                            className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-infosoft-red-500 focus:outline-none"
                            value={manualSelections[entry.employeeId] || ''}
                            onChange={(event) => handleManualSelection(entry.employeeId, event.target.value)}
                          >
                            <option value="">Select photo…</option>
                            {entry.matches?.map((match) => (
                              <option key={match} value={match}>
                                {match}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleManualAssign(entry)}
                            disabled={
                              photoWorking ||
                              manualUpdating === entry.employeeId ||
                              !manualSelections[entry.employeeId]
                            }
                          >
                            {manualUpdating === entry.employeeId ? 'Assigning…' : 'Assign photo'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-600">No duplicate surnames detected.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">No matching photo found</h3>
                {photoMissing.length ? (
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                    {photoMissing.map((entry) => (
                      <div key={entry.employeeId} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{entry.employeeName}</p>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">
                              {entry.reason === 'file-missing'
                                ? 'Existing photo missing from folder'
                                : entry.reason === 'no-available-match'
                                ? 'Matching photo already assigned'
                                : 'No filename match'}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-700">{entry.employeeEmail}</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <select
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-infosoft-red-500 focus:outline-none"
                            value={manualSelections[entry.employeeId] || ''}
                            onChange={(event) => handleManualSelection(entry.employeeId, event.target.value)}
                          >
                            <option value="">Select photo…</option>
                            {photoFiles.map((filename) => (
                              <option key={filename} value={filename}>
                                {filename}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleManualAssign(entry)}
                            disabled={
                              photoWorking ||
                              manualUpdating === entry.employeeId ||
                              !manualSelections[entry.employeeId]
                            }
                          >
                            {manualUpdating === entry.employeeId ? 'Assigning…' : 'Assign photo'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-600">Every employee has at least one matching photo candidate.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleClosePhotoModal} disabled={photoUploading || photoWorking}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {notificationModalOpen ? (
        <Modal open={notificationModalOpen} onClose={handleNotificationModalClose} title={`${notificationLabel} Progress`}>
          <div className="space-y-4">
            {notificationInitializing && !notificationJob ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner label="Starting email run…" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{notificationLabel}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-700">Status: {notificationStatusText}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-600">{notificationSummary.sent}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Sent</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold md:grid-cols-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700">
                    <span>Total</span>
                    <span>{notificationSummary.total}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700">
                    <span>Sent</span>
                    <span>{notificationSummary.sent}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    <span>Failed</span>
                    <span>{notificationSummary.failed}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                    <span>Remaining</span>
                    <span>{notificationSummary.pending}</span>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${notificationSummary.percent === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${notificationSummary.percent}%` }}
                  />
                </div>

                {notificationJob?.items?.length ? (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-100 bg-white">
                    <ul className="divide-y divide-gray-100 text-sm">
                      {notificationJob.items.map((item) => {
                        const meta = NOTIFICATION_STATUS_META[item.status] || NOTIFICATION_STATUS_META.pending;
                        return (
                          <li key={`${item.email}-${item.status}-${item.updatedAt}`} className="flex items-start justify-between gap-3 px-4 py-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-xs text-muted-700">{item.email}</p>
                              {item.recipientName ? (
                                <p className="text-[11px] text-muted-600">Recipient: {item.recipientName}</p>
                              ) : null}
                              {item.error ? <p className="mt-1 text-xs text-red-600">{item.error}</p> : null}
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-muted-700">
                    No recipients queued for this run.
                  </p>
                )}

                {notificationJob?.message && TERMINAL_NOTIFICATION_STATUSES.has(notificationJob.status) ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {notificationJob.message}
                  </div>
                ) : null}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    onClick={handleNotificationCancel}
                    variant="secondary"
                    disabled={!notificationJobActive}
                  >
                    Stop sending
                  </Button>
                  <Button onClick={handleNotificationModalClose} disabled={notificationJobActive}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
