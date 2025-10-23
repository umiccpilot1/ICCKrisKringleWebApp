const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { db } = require('../config/database');
const emailService = require('./emailService');
const { generateSecureToken } = require('../utils/tokenGenerator');

const JOB_TYPES = {
  ASSIGNMENT_EMAILS: 'assignment-emails',
  WISHLIST_REMINDERS: 'wishlist-reminders'
};

const ACTIVE_STATUSES = new Set(['running', 'cancelling']);

let currentJob = null;

class JobConflictError extends Error {
  constructor(message, jobSnapshot = null) {
    super(message);
    this.name = 'JobConflictError';
    this.status = 409;
    this.jobSnapshot = jobSnapshot;
  }
}

class NoActiveJobError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoActiveJobError';
    this.status = 400;
  }
}

function generateJobId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hasActiveJob() {
  return currentJob && ACTIVE_STATUSES.has(currentJob.status);
}

function createJob(type, items) {
  const now = new Date().toISOString();
  return {
    id: generateJobId(type),
    type,
    status: items.length ? 'running' : 'completed',
    total: items.length,
    successCount: 0,
    failureCount: 0,
    cancelledCount: 0,
    processedCount: 0,
    currentIndex: null,
    currentItem: null,
    startedAt: now,
    updatedAt: now,
    finishedAt: items.length ? null : now,
    cancelRequested: false,
    message: null,
    items
  };
}

function setItemStatus(job, index, status, error = null) {
  const item = job.items[index];
  if (!item) {
    return;
  }

  const now = new Date().toISOString();

  if (status === 'sending') {
    job.currentIndex = index;
    job.currentItem = { name: item.name, email: item.email };
    item.error = null;
  } else if (job.currentIndex === index) {
    job.currentIndex = null;
    job.currentItem = null;
  }

  if (status === 'sent') {
    job.successCount += 1;
  } else if (status === 'failed') {
    job.failureCount += 1;
  } else if (status === 'cancelled') {
    job.cancelledCount += 1;
  }

  if (['sent', 'failed', 'cancelled'].includes(status)) {
    job.processedCount = job.successCount + job.failureCount + job.cancelledCount;
  }

  item.status = status;
  item.error = error;
  item.updatedAt = now;
  job.updatedAt = now;
}

function markPendingAsCancelled(job) {
  const now = new Date().toISOString();
  job.items.forEach((item) => {
    if (item.status === 'pending' || item.status === 'sending') {
      item.status = 'cancelled';
      item.error = null;
      item.updatedAt = now;
      job.cancelledCount += 1;
    }
  });
  job.processedCount = job.successCount + job.failureCount + job.cancelledCount;
  job.currentIndex = null;
  job.currentItem = null;
  job.updatedAt = now;
}

function serializeJob(job) {
  if (!job) {
    return null;
  }

  const pendingCount = Math.max(job.total - (job.successCount + job.failureCount + job.cancelledCount), 0);

  return {
    id: job.id,
    type: job.type,
    status: job.status,
    total: job.total,
    processedCount: job.processedCount,
    successCount: job.successCount,
    failureCount: job.failureCount,
    cancelledCount: job.cancelledCount,
    pendingCount,
    canCancel: ACTIVE_STATUSES.has(job.status),
    message: job.message,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    finishedAt: job.finishedAt,
    currentItem: job.currentItem,
    items: job.items.map((item) => ({
      name: item.name,
      email: item.email,
      recipientName: item.recipientName || null,
      status: item.status,
      error: item.error,
      updatedAt: item.updatedAt
    }))
  };
}

async function runAssignmentEmailsJob(job) {
  try {
    const insertMagicLink = db.prepare(`
      INSERT INTO magic_links (employee_id, token, expires_at, used)
      VALUES (?, ?, ?, 0)
    `);

    for (let index = 0; index < job.items.length; index += 1) {
      if (job.cancelRequested) {
        break;
      }

      const item = job.items[index];
      setItemStatus(job, index, 'sending');

      try {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        insertMagicLink.run(item._meta.giverId, hashedToken, expiresAt);

        await emailService.sendAssignmentEmail(
          { id: item._meta.giverId, name: item.name, email: item.email },
          { name: item.recipientName, email: item.recipientEmail },
          token
        );

        setItemStatus(job, index, 'sent');
      } catch (error) {
        setItemStatus(job, index, 'failed', error.message || 'Failed to send assignment email');
      }
    }

    if (job.cancelRequested) {
      markPendingAsCancelled(job);
      job.status = 'cancelled';
      job.message = `Stopped after sending ${job.successCount} of ${job.total} assignment email${job.successCount === 1 ? '' : 's'}.`;
    } else {
      job.status = 'completed';
      if (job.failureCount > 0) {
        job.message = `Completed with ${job.successCount} sent and ${job.failureCount} failed assignment email${job.failureCount === 1 ? '' : 's'}.`;
      } else {
        job.message = `Successfully sent ${job.successCount} assignment email${job.successCount === 1 ? '' : 's'}.`;
      }
    }
  } catch (error) {
    job.status = 'failed';
    job.message = error.message || 'Unexpected error while sending assignment emails.';
  } finally {
    job.cancelRequested = false;
    job.currentIndex = null;
    job.currentItem = null;
    job.finishedAt = new Date().toISOString();
    job.updatedAt = job.finishedAt;
  }
}

async function runWishlistRemindersJob(job) {
  try {
    const invalidateOldLinks = db.prepare('UPDATE magic_links SET used = 1 WHERE employee_id = ? AND used = 0');
    const insertMagicLink = db.prepare(
      "INSERT INTO magic_links (employee_id, token, expires_at) VALUES (?, ?, datetime('now', '+4 hours'))"
    );

    for (let index = 0; index < job.items.length; index += 1) {
      if (job.cancelRequested) {
        break;
      }

      const item = job.items[index];
      setItemStatus(job, index, 'sending');

      try {
        invalidateOldLinks.run(item._meta.employeeId);
        const token = generateSecureToken();
        const hashedToken = await bcrypt.hash(token, 10);
        insertMagicLink.run(item._meta.employeeId, hashedToken);

        await emailService.sendWishlistReminder(item.email, item.name, token);
        setItemStatus(job, index, 'sent');
      } catch (error) {
        setItemStatus(job, index, 'failed', error.message || 'Failed to send wishlist reminder');
      }
    }

    if (job.cancelRequested) {
      markPendingAsCancelled(job);
      job.status = 'cancelled';
      job.message = `Stopped after sending ${job.successCount} of ${job.total} wishlist reminder${job.successCount === 1 ? '' : 's'}.`;
    } else {
      job.status = 'completed';
      if (job.failureCount > 0) {
        job.message = `Completed with ${job.successCount} sent and ${job.failureCount} failed reminder${job.failureCount === 1 ? '' : 's'}.`;
      } else {
        job.message = `Successfully sent ${job.successCount} wishlist reminder${job.successCount === 1 ? '' : 's'}.`;
      }
    }
  } catch (error) {
    job.status = 'failed';
    job.message = error.message || 'Unexpected error while sending wishlist reminders.';
  } finally {
    job.cancelRequested = false;
    job.currentIndex = null;
    job.currentItem = null;
    job.finishedAt = new Date().toISOString();
    job.updatedAt = job.finishedAt;
  }
}

async function startAssignmentEmailsJob() {
  if (hasActiveJob()) {
    throw new JobConflictError('Another notification job is currently running.', serializeJob(currentJob));
  }

  const rows = db
    .prepare(`
      SELECT e.id AS giverId, e.name AS giverName, e.email AS giverEmail,
             r.name AS recipientName, r.email AS recipientEmail
      FROM employees e
      JOIN employees r ON e.recipient_id = r.id
      WHERE e.is_admin = 0
      ORDER BY e.name
    `)
    .all();

  const now = new Date().toISOString();

  const items = rows.map((row) => ({
    name: row.giverName,
    email: row.giverEmail,
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    status: 'pending',
    error: null,
    updatedAt: now,
    _meta: { giverId: row.giverId }
  }));

  currentJob = createJob(JOB_TYPES.ASSIGNMENT_EMAILS, items);

  if (items.length === 0) {
    currentJob.status = 'completed';
    currentJob.message = 'No assignment emails to send.';
    currentJob.finishedAt = now;
    currentJob.updatedAt = now;
    return serializeJob(currentJob);
  }

  setImmediate(() => {
    runAssignmentEmailsJob(currentJob).catch((error) => {
      currentJob.status = 'failed';
      currentJob.message = error.message || 'Unexpected error while sending assignment emails.';
      currentJob.finishedAt = new Date().toISOString();
      currentJob.updatedAt = currentJob.finishedAt;
    });
  });

  return serializeJob(currentJob);
}

async function startWishlistRemindersJob() {
  if (hasActiveJob()) {
    throw new JobConflictError('Another notification job is currently running.', serializeJob(currentJob));
  }

  const rows = db
    .prepare(`
      SELECT e.id, e.name, e.email
      FROM employees e
      LEFT JOIN wishlists w ON w.employee_id = e.id
      WHERE e.is_admin = 0
        AND (w.id IS NULL
          OR w.is_confirmed = 0
          OR w.items = '[]'
          OR w.items IS NULL)
      ORDER BY e.name
    `)
    .all();

  const now = new Date().toISOString();

  const items = rows.map((row) => ({
    name: row.name,
    email: row.email,
    status: 'pending',
    error: null,
    updatedAt: now,
    _meta: { employeeId: row.id }
  }));

  currentJob = createJob(JOB_TYPES.WISHLIST_REMINDERS, items);

  if (items.length === 0) {
    currentJob.status = 'completed';
    currentJob.message = 'No employees need reminders.';
    currentJob.finishedAt = now;
    currentJob.updatedAt = now;
    return serializeJob(currentJob);
  }

  setImmediate(() => {
    runWishlistRemindersJob(currentJob).catch((error) => {
      currentJob.status = 'failed';
      currentJob.message = error.message || 'Unexpected error while sending wishlist reminders.';
      currentJob.finishedAt = new Date().toISOString();
      currentJob.updatedAt = currentJob.finishedAt;
    });
  });

  return serializeJob(currentJob);
}

function getJobStatus() {
  return serializeJob(currentJob);
}

function requestCancellation() {
  if (!currentJob || !ACTIVE_STATUSES.has(currentJob.status)) {
    throw new NoActiveJobError('No active notification job to cancel.');
  }

  currentJob.cancelRequested = true;
  currentJob.status = 'cancelling';
  currentJob.updatedAt = new Date().toISOString();
  return serializeJob(currentJob);
}

module.exports = {
  JOB_TYPES,
  startAssignmentEmailsJob,
  startWishlistRemindersJob,
  getJobStatus,
  requestCancellation,
  JobConflictError,
  NoActiveJobError
};
