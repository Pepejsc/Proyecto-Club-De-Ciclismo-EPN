# app/models/schema/membership.py
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class MembershipBase(BaseModel):
    membership_type: str
    start_date: date
    end_date: date
    status: str
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    medical_conditions: Optional[str] = None
    participation_level: Optional[str] = None

class MembershipCreate(MembershipBase):
    user_id: int

class MembershipResponse(MembershipBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MembershipPaymentResponse(BaseModel):
    id: int
    amount: float
    payment_date: date
    payment_method: Optional[str]
    status: str
    
    class Config:
        from_attributes = True