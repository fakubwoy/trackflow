# TrackFlow CRM

A comprehensive Customer Relationship Management system for sales pipeline and order tracking.

## 🚀 Features

### Lead Management
- Kanban-style pipeline view (New → Contacted → Qualified → Proposal → Won/Lost)  
- Detailed lead profiles with contact info, company, and notes  
- Automated follow-up reminders  
- Drag-and-drop stage progression  

### Order Tracking
- Automatic order creation from Won leads  
- 4-stage order workflow (Received → Development → Ready → Dispatched)  
- Courier and tracking number management  
- Document attachments for orders  

### Productivity Tools
- Smart reminder system with overdue alerts  
- Dashboard with real-time sales metrics  
- Document management for leads/orders  
- Responsive design for mobile use  

## 🛠️ Setup

### Prerequisites
- Python 3.10+
- Node.js 16+
- PostgreSQL (recommended) or SQLite

### Backend Setup
```bash
# Clone repository
git clone https://github.com/fakubwoy/trackflow.git
cd trackflow/backend

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload
```
### Frontend Setup
```bash
cd ../frontend
npm install

# Start development server
npm run dev
```
## 🏗️ Architecture

### Tech Stack
- Frontend: React 18 + Vite
- Backend: FastAPI + SQLAlchemy + Pydantic
- Database: SQLite
