import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Users, 
  Package, 
  Bell, 
  BarChart3, 
  Plus, 
  Search,
  Filter,
  Calendar,
  FileText,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Eye,
  Save,
  ArrowRight,
  Phone,
  Mail,
  Building,
  Tag,
  MessageSquare,
  Truck,
  Package2
} from 'lucide-react';
import './App.css';

// API Configuration
const API_BASE_URL = 'https://trackflow-api.onrender.com/api';
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Context for global state
const AppContext = createContext();

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
const uploadDocument = async (entityType, entityId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post(`/upload/${entityType}/${entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const fetchDocuments = async (entityType, entityId) => {
  try {
    const response = await api.get(`/documents/${entityType}/${entityId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteDocument = async (documentId) => {
  try {
    await api.delete(`/documents/${documentId}`);
  } catch (error) {
    throw error;
  }
};
// Main App Component
function App() {
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch data functions
  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      toast.error('Failed to fetch leads');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await api.get('/reminders');
      setReminders(response.data);
    } catch (error) {
      toast.error('Failed to fetch reminders');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchLeads(),
      fetchOrders(),
      fetchReminders(),
      fetchDashboardStats()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const contextValue = {
    leads,
    orders,
    reminders,
    dashboardStats,
    loading,
    fetchLeads,
    fetchOrders,
    fetchReminders,
    fetchDashboardStats,
    fetchAllData,
    uploadDocument,
  fetchDocuments,
  deleteDocument,
    api
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="app">
          <Toaster position="top-right" />
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

// Sidebar Component
function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/leads', icon: Users, label: 'Leads' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/reminders', icon: Bell, label: 'Reminders' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>TrackFlow</h1>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

// Dashboard Component
// Replace the Dashboard component in App.jsx with this updated version:

function Dashboard() {
  const { dashboardStats, loading, fetchDashboardStats } = useApp();
  const location = useLocation();

  // Refresh dashboard data when navigating to dashboard
  useEffect(() => {
    fetchDashboardStats();
  }, [location.pathname]); // This will trigger when route changes to dashboard

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon leads">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Leads</h3>
            <p className="stat-number">{dashboardStats.total_leads || 0}</p>
            <small>{dashboardStats.open_leads || 0} open</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon conversion">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Conversion Rate</h3>
            <p className="stat-number">{dashboardStats.conversion_rate || 0}%</p>
            <small>{dashboardStats.won_leads || 0} won / {dashboardStats.lost_leads || 0} lost</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orders">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Orders</h3>
            <p className="stat-number">{(dashboardStats.orders_received || 0) + (dashboardStats.orders_in_development || 0)}</p>
            <small>{dashboardStats.orders_dispatched || 0} dispatched</small>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon reminders">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending Reminders</h3>
            <p className="stat-number">{dashboardStats.pending_reminders || 0}</p>
            <small>Due now</small>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Order Pipeline</h3>
          <div className="pipeline-stats">
            <div className="pipeline-item">
              <span className="pipeline-label">Received</span>
              <span className="pipeline-value">{dashboardStats.orders_received || 0}</span>
            </div>
            <div className="pipeline-item">
              <span className="pipeline-label">In Development</span>
              <span className="pipeline-value">{dashboardStats.orders_in_development || 0}</span>
            </div>
            <div className="pipeline-item">
              <span className="pipeline-label">Ready to Dispatch</span>
              <span className="pipeline-value">{dashboardStats.orders_ready_to_dispatch || 0}</span>
            </div>
            <div className="pipeline-item">
              <span className="pipeline-label">Dispatched</span>
              <span className="pipeline-value">{dashboardStats.orders_dispatched || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Also, make sure you import useLocation at the top of the file if it's not already imported:
// import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Leads Page Component
function LeadsPage() {
  const { leads, fetchLeads, api } = useApp();
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const leadStages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLead = async (leadData) => {
    try {
      await api.post('/leads', leadData);
      await fetchLeads();
      toast.success('Lead created successfully');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const handleUpdateLead = async (leadId, leadData) => {
    try {
      await api.put(`/leads/${leadId}`, leadData);
      await fetchLeads();
      toast.success('Lead updated successfully');
      setEditingLead(null);
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/leads/${leadId}`);
        await fetchLeads();
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  return (
    <div className="leads-page">
      <div className="page-header">
        <h1>Leads Management</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button
              className={viewMode === 'kanban' ? 'active' : ''}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanView
          leads={filteredLeads}
          stages={leadStages}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
          onEditLead={setEditingLead}
        />
      ) : (
        <ListView
          leads={filteredLeads}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
          onEditLead={setEditingLead}
        />
      )}

      {showModal && (
        <LeadModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateLead}
        />
      )}

      {editingLead && (
        <LeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSubmit={(data) => handleUpdateLead(editingLead.id, data)}
        />
      )}
    </div>
  );
}

// Kanban View Component
function KanbanView({ leads, stages, onUpdateLead, onDeleteLead, onEditLead }) {
  const handleDragStart = (e, lead) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(lead));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    const leadData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (leadData.stage !== newStage) {
      onUpdateLead(leadData.id, { ...leadData, stage: newStage });
    }
  };

  return (
    <div className="kanban-board">
      {stages.map(stage => (
        <div
          key={stage}
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage)}
        >
          <div className="column-header">
            <h3>{stage}</h3>
            <span className="count">{leads.filter(lead => lead.stage === stage).length}</span>
          </div>
          <div className="column-content">
            {leads.filter(lead => lead.stage === stage).map(lead => (
              <div
                key={lead.id}
                className="lead-card"
                draggable
                onDragStart={(e) => handleDragStart(e, lead)}
              >
                <div className="card-header">
                  <h4>{lead.name}</h4>
                  <div className="card-actions">
                    <button onClick={() => onEditLead(lead)}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDeleteLead(lead.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <p><Building size={14} /> {lead.company}</p>
                  <p><Phone size={14} /> {lead.contact}</p>
                  <p><Tag size={14} /> {lead.product_interest}</p>
                  {lead.notes && <p><MessageSquare size={14} /> {lead.notes.substring(0, 50)}...</p>}
                </div>
                {lead.follow_up_date && (
                  <div className="card-footer">
                    <Clock size={12} />
                    <span>Follow up: {new Date(lead.follow_up_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// List View Component
function ListView({ leads, onUpdateLead, onDeleteLead, onEditLead }) {
  return (
    <div className="list-view">
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Product Interest</th>
              <th>Stage</th>
              <th>Follow-up Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.company}</td>
                <td>{lead.contact}</td>
                <td>{lead.product_interest}</td>
                <td>
                  <span className={`stage-badge ${lead.stage.toLowerCase().replace(' ', '-')}`}>
                    {lead.stage}
                  </span>
                </td>
                <td>
                  {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '-'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => onEditLead(lead)} className="btn-icon">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDeleteLead(lead.id)} className="btn-icon danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Lead Modal Component
function LeadModal({ lead, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: lead?.name || '',
    contact: lead?.contact || '',
    company: lead?.company || '',
    product_interest: lead?.product_interest || '',
    stage: lead?.stage || 'New',
    follow_up_date: lead?.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
    notes: lead?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null
    };
    onSubmit(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{lead ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Contact *</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Product Interest *</label>
              <input
                type="text"
                value={formData.product_interest}
                onChange={(e) => setFormData({...formData, product_interest: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-group full-width">
  <label>Documents</label>
  {lead?.id && ( // Only show if lead exists (has an ID)
    <DocumentUpload 
      entityType="lead" 
      entityId={lead.id} 
      onDocumentUploaded={() => {/* optional callback */}}
    />
  )}
</div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} />
              {lead ? 'Update' : 'Create'} Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Orders Page Component
function OrdersPage() {
  const { orders, leads, fetchOrders, api } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const handleCreateOrder = async (orderData) => {
    try {
      await api.post('/orders', orderData);
      await fetchOrders();
      toast.success('Order created successfully');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const handleUpdateOrder = async (orderId, orderData) => {
    try {
      await api.put(`/orders/${orderId}`, orderData);
      await fetchOrders();
      toast.success('Order updated successfully');
      setEditingOrder(null);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await api.delete(`/orders/${orderId}`);
        await fetchOrders();
        toast.success('Order deleted successfully');
      } catch (error) {
        toast.error('Failed to delete order');
      }
    }
  };

  const orderStages = ['Order Received', 'In Development', 'Ready to Dispatch', 'Dispatched'];

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Orders Management</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Add Order
        </button>
      </div>

      <div className="kanban-board">
        {orderStages.map(stage => (
          <div key={stage} className="kanban-column">
            <div className="column-header">
              <h3>{stage}</h3>
              <span className="count">{orders.filter(order => order.stage === stage).length}</span>
            </div>
            <div className="column-content">
              {orders.filter(order => order.stage === stage).map(order => {
                const lead = leads.find(l => l.id === order.lead_id);
                return (
                  <div key={order.id} className="order-card">
                    <div className="card-header">
                      <h4>Order #{order.id}</h4>
                      <div className="card-actions">
                        <button onClick={() => setEditingOrder(order)}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      {lead && (
                        <>
                          <p><Users size={14} /> {lead.name}</p>
                          <p><Building size={14} /> {lead.company}</p>
                          <p><Tag size={14} /> {lead.product_interest}</p>
                        </>
                      )}
                      {order.courier && <p><Truck size={14} /> {order.courier}</p>}
                      {order.tracking_number && <p><Package2 size={14} /> {order.tracking_number}</p>}
                      {order.notes && <p><MessageSquare size={14} /> {order.notes}</p>}
                    </div>
                    {order.dispatch_date && (
                      <div className="card-footer">
                        <Calendar size={12} />
                        <span>Dispatched: {new Date(order.dispatch_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <OrderModal
          leads={leads}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateOrder}
        />
      )}

      {editingOrder && (
        <OrderModal
          order={editingOrder}
          leads={leads}
          onClose={() => setEditingOrder(null)}
          onSubmit={(data) => handleUpdateOrder(editingOrder.id, data)}
        />
      )}
    </div>
  );
}

// Order Modal Component
function OrderModal({ order, leads, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    lead_id: order?.lead_id || '',
    stage: order?.stage || 'Order Received',
    courier: order?.courier || '',
    tracking_number: order?.tracking_number || '',
    dispatch_date: order?.dispatch_date ? order.dispatch_date.split('T')[0] : '',
    notes: order?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      dispatch_date: formData.dispatch_date ? new Date(formData.dispatch_date).toISOString() : null
    };
    onSubmit(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{order ? 'Edit Order' : 'Add New Order'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Lead *</label>
              <select
                value={formData.lead_id}
                onChange={(e) => setFormData({...formData, lead_id: parseInt(e.target.value)})}
                required
              >
                <option value="">Select a lead</option>
                {leads.filter(lead => lead.stage === 'Won').map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} - {lead.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
              >
                <option value="Order Received">Order Received</option>
                <option value="In Development">In Development</option>
                <option value="Ready to Dispatch">Ready to Dispatch</option>
                <option value="Dispatched">Dispatched</option>
              </select>
            </div>
            <div className="form-group">
              <label>Courier</label>
              <input
                type="text"
                value={formData.courier}
                onChange={(e) => setFormData({...formData, courier: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Tracking Number</label>
              <input
                type="text"
                value={formData.tracking_number}
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Dispatch Date</label>
              <input
                type="date"
                value={formData.dispatch_date}
                onChange={(e) => setFormData({...formData, dispatch_date: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-group full-width">
  <label>Documents</label>
  {order?.id && ( // Only show if lead exists (has an ID)
    <DocumentUpload 
      entityType="order" 
      entityId={order.id} 
      onDocumentUploaded={() => {/* optional callback */}}
    />
  )}
</div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} />
              {order ? 'Update' : 'Create'} Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reminders Page Component
function RemindersPage() {
  const { reminders, fetchReminders, api } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const handleCreateReminder = async (reminderData) => {
    try {
      await api.post('/reminders', reminderData);
      await fetchReminders();
      toast.success('Reminder created successfully');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const handleUpdateReminder = async (reminderId, reminderData) => {
    try {
      await api.put(`/reminders/${reminderId}`, reminderData);
      await fetchReminders();
      toast.success('Reminder updated successfully');
      setEditingReminder(null);
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await api.delete(`/reminders/${reminderId}`);
        await fetchReminders();
        toast.success('Reminder deleted successfully');
      } catch (error) {
        toast.error('Failed to delete reminder');
      }
    }
  };

  const handleToggleComplete = async (reminder) => {
    await handleUpdateReminder(reminder.id, { ...reminder, is_completed: !reminder.is_completed });
  };

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h1>Reminders</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Add Reminder
        </button>
      </div>

      <div className="reminders-list">
        {reminders.map(reminder => (
          <div key={reminder.id} className={`reminder-card ${reminder.is_completed ? 'completed' : ''}`}>
            <div className="reminder-content">
                              <div className="reminder-header">
                <h3>{reminder.title}</h3>
                <div className="reminder-actions">
                  <button
                    onClick={() => handleToggleComplete(reminder)}
                    className={`btn-icon ${reminder.is_completed ? 'completed' : ''}`}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button onClick={() => setEditingReminder(reminder)} className="btn-icon">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteReminder(reminder.id)} className="btn-icon danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {reminder.description && (
                <p className="reminder-description">{reminder.description}</p>
              )}
              <div className="reminder-meta">
                <div className="reminder-date">
                  <Calendar size={14} />
                  <span>{new Date(reminder.reminder_date).toLocaleString()}</span>
                </div>
                {new Date(reminder.reminder_date) < new Date() && !reminder.is_completed && (
                  <div className="reminder-overdue">
                    <AlertCircle size={14} />
                    <span>Overdue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ReminderModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateReminder}
        />
      )}

      {editingReminder && (
        <ReminderModal
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onSubmit={(data) => handleUpdateReminder(editingReminder.id, data)}
        />
      )}
    </div>
  );
}

// Reminder Modal Component
function ReminderModal({ reminder, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: reminder?.title || '',
    description: reminder?.description || '',
    reminder_date: reminder?.reminder_date ? 
      new Date(reminder.reminder_date).toISOString().slice(0, 16) : 
      new Date().toISOString().slice(0, 16),
    is_completed: reminder?.is_completed || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      reminder_date: new Date(formData.reminder_date).toISOString()
    };
    onSubmit(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{reminder ? 'Edit Reminder' : 'Add New Reminder'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Reminder Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.reminder_date}
              onChange={(e) => setFormData({...formData, reminder_date: e.target.value})}
              required
            />
          </div>
          {reminder && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_completed}
                  onChange={(e) => setFormData({...formData, is_completed: e.target.checked})}
                />
                <span>Completed</span>
              </label>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} />
              {reminder ? 'Update' : 'Create'} Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function DocumentUpload({ entityType, entityId, onDocumentUploaded }) {
  const { uploadDocument, fetchDocuments, deleteDocument } = useApp();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  
  useEffect(() => {
    const loadDocuments = async () => {
      if (!entityId) return;
      
      setLoadingDocs(true);
      try {
        const docs = await fetchDocuments(entityType, entityId);
        setDocuments(docs || []);
      } catch (error) {
        // Don't show error for 404 - just means no documents exist
        if (error.response?.status !== 404) {
          toast.error('Failed to load documents');
        }
      } finally {
        setLoadingDocs(false);
      }
    };

    loadDocuments();
  }, [entityType, entityId, fetchDocuments]);
const handleViewDocument = (filePath) => {
    // Extract just the filename from the full path
    const filename = filePath.split('/').pop();
    // Construct the URL to your backend's static files - remove /api from the path
    const fileUrl = `https://trackflow-api.onrender.com/uploads/${filename}`;
    // Open in new tab
    window.open(fileUrl, '_blank');
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !entityId) {
      toast.error('Please save the lead/order before uploading documents');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(entityType, entityId, file);
      // Don't call loadDocuments here - let the useEffect handle it
      toast.success('Document uploaded successfully');
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId);
        await loadDocuments();
        toast.success('Document deleted successfully');
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-section">
        <label className="upload-btn">
          <FileText size={16} />
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {documents.length > 0 && (
        <div className="documents-list">
          <h4>Documents</h4>
          {documents.map(doc => (
            <div key={doc.id} className="document-item">
              <div 
                className="document-info"
                onClick={() => handleViewDocument(doc.file_path)}
                style={{ cursor: 'pointer' }}
              >
                <FileText size={14} />
                <span>{doc.filename}</span>
                <small>{new Date(doc.uploaded_at).toLocaleDateString()}</small>
              </div>
              <div className="document-actions">
                <button
                  onClick={() => handleViewDocument(doc.file_path)}
                  className="btn-icon"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="btn-icon danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default App;