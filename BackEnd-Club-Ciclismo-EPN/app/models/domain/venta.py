from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base 

class SaleOrder(Base):
    __tablename__ = "sales_orders"

    id_sale = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50))
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(50), default="PENDING")
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    items = relationship("SaleOrderItem", back_populates="order")

class SaleOrderItem(Base):
    __tablename__ = "sales_order_items"

    id_item = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales_orders.id_sale"))
    resource_id = Column(Integer, ForeignKey("recursos.id_recurso"))
    resource = relationship("Recurso")
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("SaleOrder", back_populates="items")