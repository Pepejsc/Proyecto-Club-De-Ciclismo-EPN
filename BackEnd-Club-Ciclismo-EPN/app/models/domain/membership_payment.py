# app/models/domain/membership_payment.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum
from datetime import datetime

class PaymentStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PaymentMethod(enum.Enum):
    CASH = "CASH"
    TRANSFER = "TRANSFER" 
    CARD = "CARD"
    PAYPAL = "PAYPAL"

class MembershipPayment(Base):
    __tablename__ = "membership_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(Enum(PaymentMethod))
    transaction_id = Column(String(100))
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    membership = relationship("Membership", back_populates="payments")