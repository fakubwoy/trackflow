from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
import os
import shutil
from pathlib import Path

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./trackflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    company = Column(String, nullable=False)
    product_interest = Column(String, nullable=False)
    stage = Column(String, default="New")  # New, Contacted, Qualified, Proposal Sent, Won, Lost
    follow_up_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = relationship("Order", back_populates="lead")
    documents = relationship("Document", back_populates="lead")
    reminders = relationship("Reminder", back_populates="lead")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    stage = Column(String, default="Order Received")  # Order Received, In Development, Ready to Dispatch, Dispatched
    courier = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    dispatch_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    lead = relationship("Lead", back_populates="orders")
    documents = relationship("Document", back_populates="order")
    reminders = relationship("Reminder", back_populates="order")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    lead = relationship("Lead", back_populates="documents")
    order = relationship("Order", back_populates="documents")

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    reminder_date = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lead = relationship("Lead", back_populates="reminders")
    order = relationship("Order", back_populates="reminders")

# Pydantic models
class LeadBase(BaseModel):
    name: str
    contact: str
    company: str
    product_interest: str
    stage: str = "New"
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    stage: str = "Order Received"
    courier: Optional[str] = None
    tracking_number: Optional[str] = None
    dispatch_date: Optional[datetime] = None
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    lead_id: int

class OrderUpdate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    lead_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    reminder_date: datetime
    is_completed: bool = False

class ReminderCreate(ReminderBase):
    lead_id: Optional[int] = None
    order_id: Optional[int] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reminder_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

class ReminderResponse(ReminderBase):
    id: int
    lead_id: Optional[int]
    order_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_leads: int
    open_leads: int
    won_leads: int
    lost_leads: int
    conversion_rate: float
    orders_received: int
    orders_in_development: int
    orders_ready_to_dispatch: int
    orders_dispatched: int
    pending_reminders: int

# Create tables
Base.metadata.create_all(bind=engine)

# Create uploads directory
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

app = FastAPI(title="TrackFlow CRM API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Lead endpoints
@app.get("/api/leads", response_model=List[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    return db.query(Lead).all()

@app.get("/api/leads/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@app.post("/api/leads", response_model=LeadResponse)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = Lead(**lead.dict())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    # Auto-create order if lead is marked as Won
    if lead.stage == "Won":
        db_order = Order(lead_id=db_lead.id, stage="Order Received")
        db.add(db_order)
        db.commit()
    
    return db_lead

@app.put("/api/leads/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead: LeadUpdate, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    for key, value in lead.dict().items():
        setattr(db_lead, key, value)
    
    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)
    
    # Auto-create order if lead is marked as Won and no order exists
    if lead.stage == "Won" and not db_lead.orders:
        db_order = Order(lead_id=db_lead.id, stage="Order Received")
        db.add(db_order)
        db.commit()
    
    return db_lead

@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db.delete(db_lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

# Order endpoints
@app.get("/api/orders", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/api/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Check if lead exists
    lead = db.query(Lead).filter(Lead.id == order.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db_order = Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/api/orders/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    for key, value in order.dict().items():
        if value is not None:
            setattr(db_order, key, value)
    
    db_order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_order)
    return db_order

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}

# Reminder endpoints
@app.get("/api/reminders", response_model=List[ReminderResponse])
def get_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).all()

@app.post("/api/reminders", response_model=ReminderResponse)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = Reminder(**reminder.dict())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.put("/api/reminders/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: int, reminder: ReminderUpdate, db: Session = Depends(get_db)):
    db_reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    for key, value in reminder.dict().items():
        if value is not None:
            setattr(db_reminder, key, value)
    
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@app.delete("/api/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    db_reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(db_reminder)
    db.commit()
    return {"message": "Reminder deleted successfully"}

# File upload endpoint
@app.post("/api/upload/{entity_type}/{entity_id}")
async def upload_file(entity_type: str, entity_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if entity_type not in ["lead", "order"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    # Create unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{entity_type}_{entity_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
    file_path = uploads_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save to database
    db_document = Document(
        filename=file.filename,
        file_path=str(file_path),
        lead_id=entity_id if entity_type == "lead" else None,
        order_id=entity_id if entity_type == "order" else None
    )
    db.add(db_document)
    db.commit()
    
    return {"message": "File uploaded successfully", "filename": unique_filename}

@app.get("/debug/documents")
def debug_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete physical file
    try:
        os.remove(document.file_path)
    except OSError:
        pass  # File might not exist
    
    # Delete from database
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

@app.get("/api/documents/{entity_type}/{entity_id}")
def get_documents(entity_type: str, entity_id: int, db: Session = Depends(get_db)):
    if entity_type not in ["lead", "order"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    if entity_type == "lead":
        documents = db.query(Document).filter(Document.lead_id == entity_id).all()
    else:
        documents = db.query(Document).filter(Document.order_id == entity_id).all()
    
    # Return empty array instead of error if no documents
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "file_path": doc.file_path,
            "uploaded_at": doc.uploaded_at
        }
        for doc in documents
    ] if documents else []
    
# Dashboard stats endpoint
@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_leads = db.query(Lead).count()
    open_leads = db.query(Lead).filter(Lead.stage.notin_(["Won", "Lost"])).count()
    won_leads = db.query(Lead).filter(Lead.stage == "Won").count()
    lost_leads = db.query(Lead).filter(Lead.stage == "Lost").count()
    
    conversion_rate = (won_leads / total_leads * 100) if total_leads > 0 else 0
    
    orders_received = db.query(Order).filter(Order.stage == "Order Received").count()
    orders_in_development = db.query(Order).filter(Order.stage == "In Development").count()
    orders_ready_to_dispatch = db.query(Order).filter(Order.stage == "Ready to Dispatch").count()
    orders_dispatched = db.query(Order).filter(Order.stage == "Dispatched").count()
    
    pending_reminders = db.query(Reminder).filter(
        Reminder.is_completed == False,
        Reminder.reminder_date <= datetime.utcnow()
    ).count()
    
    return DashboardStats(
        total_leads=total_leads,
        open_leads=open_leads,
        won_leads=won_leads,
        lost_leads=lost_leads,
        conversion_rate=round(conversion_rate, 2),
        orders_received=orders_received,
        orders_in_development=orders_in_development,
        orders_ready_to_dispatch=orders_ready_to_dispatch,
        orders_dispatched=orders_dispatched,
        pending_reminders=pending_reminders
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)