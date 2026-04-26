import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ticketAPI } from '../services/api';
import './Tickets.css';

const Tickets = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';

  const [activeTab, setActiveTab] = useState('report');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Report Form State
  const [resourceId, setResourceId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  // Detail View State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const tabs = useMemo(() => {
    const base = [{ id: 'report', label: 'Report Incident' }];
    base.push({ id: 'mine', label: 'My Tickets' });
    if (isTechnician) base.push({ id: 'assigned', label: 'Assigned to Me' });
    if (isAdmin) base.push({ id: 'all', label: 'All Tickets' });
    return base;
  }, [isAdmin, isTechnician]);

  useEffect(() => {
    setError('');
    setSuccess('');
    if (activeTab !== 'report') {
      fetchTickets();
    }
    if (isAdmin) {
      fetchTechnicians();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    if (activeTab === 'report') return;
    setLoading(true);
    setError('');
    try {
      let res;
      if (activeTab === 'mine') res = await ticketAPI.getMine();
      else if (activeTab === 'assigned') res = await ticketAPI.getAssigned();
      else if (activeTab === 'all') res = await ticketAPI.getAll();
      
      if (res && res.data) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch (e) {
      console.error('Fetch tickets error:', e);
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await ticketAPI.getTechnicians();
      // Show all users so admin can pick anyone to promote to technician
      setTechnicians(res.data || []);
    } catch (e) {
      console.error('Failed to fetch users for assignment', e);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      setError('You can only upload up to 3 images.');
      return;
    }
    setImages([...images, ...files]);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resourceId || !category || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('resourceId', resourceId);
    formData.append('category', category);
    formData.append('description', description);
    images.forEach((image) => formData.append('images', image));

    try {
      await ticketAPI.create(formData);
      setSuccess('Incident reported successfully!');
      setResourceId('');
      setCategory('');
      setDescription('');
      setImages([]);
      setActiveTab('mine');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to report incident');
    }
  };

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await ticketAPI.getComments(ticket.id);
      setComments(res.data || []);
      setResolutionNotes(ticket.resolutionNotes || '');
    } catch (e) {
      console.error('Failed to fetch comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await ticketAPI.addComment(selectedTicket.id, newComment);
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (e) {
      setError('Failed to add comment');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const res = await ticketAPI.updateStatus(selectedTicket.id, status, resolutionNotes);
      setSelectedTicket(res.data);
      setSuccess(`Ticket status updated to ${status}`);
      fetchTickets();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;
    try {
      const res = await ticketAPI.assign(selectedTicket.id, selectedTechnician);
      setSelectedTicket(res.data);
      setSuccess('Technician assigned successfully');
      fetchTickets();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign technician');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'RESOLVED': return 'status-resolved';
      case 'CLOSED': return 'status-closed';
      default: return '';
    }
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h2>Ticket Management</h2>
        <p>Report and track facility or equipment issues.</p>
      </div>

      <div className="tickets-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedTicket(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(error || success) && (
        <div className={`message-banner ${error ? 'error' : 'success'}`}>
          {error || success}
          <button onClick={() => { setError(''); setSuccess(''); }}>×</button>
        </div>
      )}

      {selectedTicket ? (
        <div className="ticket-detail">
          <button className="back-btn" onClick={() => setSelectedTicket(null)}>← Back to List</button>
          
          <div className="detail-grid">
            <div className="detail-main">
              <div className="detail-card">
                <div className="detail-header">
                  <h3>Ticket #{selectedTicket.id}: {selectedTicket.category}</h3>
                  <span className={`status-badge ${getStatusClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="detail-resource"><strong>Resource:</strong> {selectedTicket.resourceId}</p>
                <p className="detail-desc">{selectedTicket.description}</p>
                
                {selectedTicket.images && selectedTicket.images.length > 0 && (
                  <div className="detail-images">
                    {selectedTicket.images.map((img) => (
                      <img key={img.id} src={`http://localhost:8099${img.fileUrl}`} alt="Attachment" className="ticket-img" />
                    ))}
                  </div>
                )}

                <div className="detail-meta">
                  <span><strong>Reported by:</strong> {selectedTicket.createdByEmail}</span>
                  <span><strong>Date:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>

                {selectedTicket.resolutionNotes && (
                  <div className="resolution-box">
                    <h4>Resolution Notes</h4>
                    <p>{selectedTicket.resolutionNotes}</p>
                  </div>
                )}
              </div>

              <div className="comments-section">
                <h4>Comments</h4>
                <div className="comments-list">
                  {comments.length === 0 ? <p className="no-comments">No comments yet.</p> : (
                    comments.map((c) => (
                      <div key={c.id} className="comment-card">
                        <div className="comment-header">
                          <strong>{c.userEmail}</strong>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <form className="comment-form" onSubmit={handleAddComment}>
                  <textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <button type="submit" className="primary-btn">Post Comment</button>
                </form>
              </div>
            </div>

            <div className="detail-sidebar">
              {isAdmin && selectedTicket.status === 'OPEN' && (
                <div className="sidebar-card">
                  <h4>Assign Technician</h4>
                  <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="technician-select"
              >
                <option value="">Select Technician</option>
                {technicians.length > 0 ? (
                  technicians.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role === 'TECHNICIAN' ? 'Technician' : 'Promote to Tech'}) - {user.email}
                    </option>
                  ))
                ) : (
                  <option disabled>No users found</option>
                )}
              </select>
                  <button 
                    className="primary-btn" 
                    onClick={handleAssignTechnician}
                    disabled={!selectedTechnician}
                  >
                    Assign
                  </button>
                </div>
              )}

              {(isTechnician || isAdmin) && selectedTicket.status === 'IN_PROGRESS' && (
                <div className="sidebar-card">
                  <h4>Resolve Ticket</h4>
                  <textarea
                    placeholder="Resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                  <button 
                    className="success-btn" 
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={!resolutionNotes.trim()}
                  >
                    Mark as Resolved
                  </button>
                </div>
              )}

              {(selectedTicket.createdByUserId === user.id || isAdmin) && selectedTicket.status === 'RESOLVED' && (
                <div className="sidebar-card">
                  <h4>Close Ticket</h4>
                  <p>Issue resolved? Close the ticket permanently.</p>
                  <button 
                    className="dark-btn" 
                    onClick={() => handleUpdateStatus('CLOSED')}
                  >
                    Close Ticket
                  </button>
                </div>
              )}

              <div className="sidebar-info">
                <h4>Assignment</h4>
                <p><strong>Technician:</strong> {selectedTicket.assignedTechnicianEmail || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="tickets-content">
          {activeTab === 'report' ? (
            <div className="report-form-card">
              <h3>Report an Incident</h3>
              <form onSubmit={handleSubmitTicket}>
                <div className="form-group">
                  <label>Resource ID (e.g. ROOM-101, PROJECTOR-05)</label>
                  <input
                    type="text"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    placeholder="Enter resource identifier"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select Category</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="IT/Equipment">IT / Equipment</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Attachments (Max 3 images)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={images.length >= 3}
                  />
                  <div className="image-previews">
                    {images.map((img, idx) => (
                      <div key={idx} className="img-preview">
                        <span>{img.name}</span>
                        <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="primary-btn">Submit Report</button>
              </form>
            </div>
          ) : (
            <div className="tickets-list-card">
              {loading ? <p>Loading tickets...</p> : tickets.length === 0 ? <p>No tickets found.</p> : (
                <div className="table-responsive">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Resource</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td>{t.resourceId}</td>
                          <td>{t.category}</td>
                          <td><span className={`status-badge ${getStatusClass(t.status)}`}>{t.status}</span></td>
                          <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="view-btn" onClick={() => handleViewTicket(t)}>View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tickets;
