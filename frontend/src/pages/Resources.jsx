import { useState, useEffect } from 'react';
import { resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Resources.css';

const Resources = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    minCapacity: ''
  });

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'LAB',
    capacity: '',
    location: '',
    description: '',
    status: 'ACTIVE'
  });

  const resourceTypes = ['LAB', 'LECTURE_HALL', 'SPORTS_FACILITY', 'EQUIPMENT', 'MEETING_ROOM'];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await resourceAPI.getAll();
      setResources(res.data || []);
    } catch (e) {
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await resourceAPI.search(filters);
      setResources(res.data || []);
    } catch (e) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await resourceAPI.update(editingResource.id, formData);
      } else {
        await resourceAPI.create(formData);
      }
      setShowAdminModal(false);
      fetchResources();
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || 'Failed to save resource';
      alert(errorMsg);
      console.error('Failed to save resource:', e);
    }
  };

  const openEditModal = (res) => {
    setEditingResource(res);
    setFormData({
      name: res.name,
      type: res.type,
      capacity: res.capacity,
      location: res.location,
      description: res.description || '',
      status: res.status
    });
    setShowAdminModal(true);
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData({
      name: '',
      type: 'LAB',
      capacity: '',
      location: '',
      description: '',
      status: 'ACTIVE'
    });
    setShowAdminModal(true);
  };

  return (
    <div className="resources-container">
      <div className="resources-header">
        <div className="header-text">
          <h2>Campus Resources</h2>
          <p>Find and book labs, halls, and equipment for your academic needs.</p>
        </div>
        {isAdmin && (
          <button className="admin-btn-primary" onClick={openCreateModal}>
            + Add New Resource
          </button>
        )}
      </div>

      <div className="search-bar-card">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="filter-group">
            <label>Type</label>
            <select 
              value={filters.type} 
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="">All Types</option>
              {resourceTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Location</label>
            <input 
              type="text" 
              placeholder="e.g. Block A" 
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
          <div className="filter-group">
            <label>Min Capacity</label>
            <input 
              type="number" 
              placeholder="e.g. 30" 
              value={filters.minCapacity}
              onChange={(e) => setFilters({...filters, minCapacity: e.target.value})}
            />
          </div>
          <button type="submit" className="search-submit-btn">Search Resources</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Scanning campus assets...</p>
        </div>
      ) : (
        <div className="resource-grid">
          {resources.map(res => (
            <div key={res.id} className="resource-card">
              <div className="resource-status-badge" data-status={res.status}>
                {res.status}
              </div>
              <div className="resource-type-tag">{res.type}</div>
              <div className="resource-card-content">
                <h3>{res.name}</h3>
                <div className="resource-meta">
                  <span>📍 {res.location}</span>
                  <span>👥 Capacity: {res.capacity}</span>
                </div>
                <p className="resource-desc">{res.description || 'No description available.'}</p>
                
                <div className="resource-card-actions">
                  <button className="book-now-btn">Check Availability</button>
                  {isAdmin && (
                    <button className="edit-res-btn" onClick={() => openEditModal(res)}>Edit</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="no-results">
              <p>No resources found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {showAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="resource-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingResource ? 'Update Resource' : 'Create New Resource'}</h2>
              <button className="close-btn" onClick={() => setShowAdminModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSaveResource}>
              <div className="form-row">
                <div className="form-group">
                  <label>Resource Name</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Capacity</label>
                  <input 
                    type="number" required
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" required
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowAdminModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
