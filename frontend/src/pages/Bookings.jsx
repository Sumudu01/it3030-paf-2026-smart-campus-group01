import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../services/api';
import './Bookings.css';

function toLocalDateTimeString(datetimeLocalValue) {
  // Spring LocalDateTime expects: "YYYY-MM-DDTHH:mm:ss" (no timezone)
  if (!datetimeLocalValue) return '';
  return datetimeLocalValue.length === 16 ? `${datetimeLocalValue}:00` : datetimeLocalValue;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function statusPillClass(status) {
  switch (status) {
    case 'APPROVED':
      return 'pill pill-approved';
    case 'REJECTED':
      return 'pill pill-rejected';
    case 'CANCELLED':
      return 'pill pill-cancelled';
    default:
      return 'pill pill-pending';
  }
}

const Bookings = ({ onBookingCreated }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('request');
  const tabs = useMemo(() => {
    const base = [
      { id: 'request', label: 'Request booking' },
      { id: 'mine', label: 'My bookings' },
    ];
    if (isAdmin) base.push({ id: 'admin', label: 'Pending approvals' });
    return base;
  }, [isAdmin]);

  // Request form
  const [resourceId, setResourceId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [purpose, setPurpose] = useState('');

  // Data
  const [myBookings, setMyBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyBooking, setHistoryBooking] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const refreshMine = async () => {
    setLoadingMine(true);
    try {
      const res = await bookingAPI.mine();
      setMyBookings(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load your bookings');
    } finally {
      setLoadingMine(false);
    }
  };

  const refreshPending = async () => {
    if (!isAdmin) return;
    setLoadingPending(true);
    try {
      const res = await bookingAPI.adminPending();
      setPendingBookings(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load pending bookings');
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    setError('');
    setSuccess('');
    if (activeTab === 'mine') refreshMine();
    if (activeTab === 'admin') refreshPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resourceId.trim()) return setError('Resource ID is required.');
    if (!startAt) return setError('Start date/time is required.');
    if (!endAt) return setError('End date/time is required.');
    if (!purpose.trim()) return setError('Purpose is required.');

    const startStr = toLocalDateTimeString(startAt);
    const endStr = toLocalDateTimeString(endAt);
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      return setError('End time must be after start time.');
    }

    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        resourceId: resourceId.trim(),
        startAt: startStr,
        endAt: endStr,
        purpose: purpose.trim(),
      });
      setSuccess(res.data?.message || 'Booking request created');
      onBookingCreated?.(res.data?.booking, res.data?.message);
      setResourceId('');
      setStartAt('');
      setEndAt('');
      setPurpose('');
      setActiveTab('mine');
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.response?.data?.message || e2?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (id) => {
    setError('');
    setSuccess('');
    const note = window.prompt('Optional cancellation note (leave empty for none):', '');
    try {
      const res = await bookingAPI.cancel(id, note || undefined);
      setSuccess(res.data?.message || 'Booking cancelled');
      await refreshMine();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to cancel booking');
    }
  };

  const openHistory = async (booking) => {
    setHistoryOpen(true);
    setHistoryBooking(booking);
    setHistoryRows([]);
    setLoadingHistory(true);
    setError('');
    try {
      const res = await bookingAPI.history(booking.id);
      setHistoryRows(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load booking history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const decide = async (id, action) => {
    setError('');
    setSuccess('');
    const reason = window.prompt(`Optional reason for ${action} (leave empty for none):`, '');
    try {
      const res =
        action === 'approve'
          ? await bookingAPI.adminApprove(id, reason || undefined)
          : await bookingAPI.adminReject(id, reason || undefined);
      setSuccess(res.data?.message || `Booking ${action}d`);
      await refreshPending();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || `Failed to ${action} booking`);
    }
  };

  return (
    <div className="bookings-wrap">
      <div className="bookings-top">
        <div>
          <h3 className="bookings-title">Bookings</h3>
          <p className="bookings-subtitle">Request resources, track your requests, and manage approvals.</p>
        </div>
      </div>

      <div className="bookings-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`bookings-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(error || success) && (
        <div className="bookings-messages">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </div>
      )}

      {activeTab === 'request' && (
        <div className="card">
          <h4 className="card-title">New booking request</h4>
          <form className="form" onSubmit={onSubmit}>
            <div className="grid">
              <div className="field">
                <label>Resource ID</label>
                <input value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="e.g. LAB-A1 / PROJECTOR-3" />
              </div>
              <div className="field">
                <label>Start</label>
                <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div className="field">
                <label>End</label>
                <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
              <div className="field field-wide">
                <label>Purpose</label>
                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="What is this booking for?" />
              </div>
            </div>
            <div className="actions">
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setResourceId('');
                  setStartAt('');
                  setEndAt('');
                  setPurpose('');
                  setError('');
                  setSuccess('');
                }}
                disabled={submitting}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'mine' && (
        <div className="card">
          <div className="card-head">
            <h4 className="card-title">My bookings</h4>
            <button type="button" className="secondary small" onClick={refreshMine} disabled={loadingMine}>
              {loadingMine ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      {loadingMine ? 'Loading…' : 'No bookings found.'}
                    </td>
                  </tr>
                )}
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>
                      <div className="mono">{b.resourceId}</div>
                      <div className="muted">{b.purpose}</div>
                    </td>
                    <td>{formatDateTime(b.startAt)}</td>
                    <td>{formatDateTime(b.endAt)}</td>
                    <td>
                      <span className={statusPillClass(b.status)}>{b.status}</span>
                    </td>
                    <td className="right">
                      <div className="row-actions">
                        <button type="button" className="ghost small" onClick={() => openHistory(b)}>
                          History
                        </button>
                        <button
                          type="button"
                          className="danger small"
                          onClick={() => onCancel(b.id)}
                          disabled={b.status === 'CANCELLED' || b.status === 'REJECTED'}
                          title={b.status === 'APPROVED' ? 'Cancels an approved booking' : 'Cancel booking'}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'admin' && isAdmin && (
        <div className="card">
          <div className="card-head">
            <h4 className="card-title">Pending approvals</h4>
            <button type="button" className="secondary small" onClick={refreshPending} disabled={loadingPending}>
              {loadingPending ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requester</th>
                  <th>Resource</th>
                  <th>Start</th>
                  <th>End</th>
                  <th className="right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      {loadingPending ? 'Loading…' : 'No pending bookings.'}
                    </td>
                  </tr>
                )}
                {pendingBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>
                      <div>{b.createdByEmail}</div>
                      <div className="muted">User ID: {b.createdByUserId}</div>
                    </td>
                    <td>
                      <div className="mono">{b.resourceId}</div>
                      <div className="muted">{b.purpose}</div>
                    </td>
                    <td>{formatDateTime(b.startAt)}</td>
                    <td>{formatDateTime(b.endAt)}</td>
                    <td className="right">
                      <div className="row-actions">
                        <button type="button" className="ghost small" onClick={() => openHistory(b)}>
                          History
                        </button>
                        <button type="button" className="primary small" onClick={() => decide(b.id, 'approve')}>
                          Approve
                        </button>
                        <button type="button" className="danger small" onClick={() => decide(b.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="modal-overlay" onClick={() => setHistoryOpen(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-head">
              <div>
                <div className="history-title">Booking history</div>
                <div className="history-sub">
                  Booking #{historyBooking?.id} · <span className="mono">{historyBooking?.resourceId}</span>
                </div>
              </div>
              <button type="button" className="x" onClick={() => setHistoryOpen(false)}>
                ×
              </button>
            </div>

            <div className="history-body">
              {loadingHistory ? (
                <div className="empty">Loading…</div>
              ) : historyRows.length === 0 ? (
                <div className="empty">No history entries.</div>
              ) : (
                <div className="timeline">
                  {historyRows.map((h) => (
                    <div key={h.id} className="timeline-row">
                      <div className="dot" />
                      <div className="timeline-card">
                        <div className="timeline-top">
                          <div className="mono">
                            {h.fromStatus} → {h.toStatus}
                          </div>
                          <div className="muted">{formatDateTime(h.changedAt)}</div>
                        </div>
                        <div className="muted">By: {h.changedByEmail || '—'}</div>
                        {h.note && <div className="note">{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="history-foot">
              <button type="button" className="secondary" onClick={() => setHistoryOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;

