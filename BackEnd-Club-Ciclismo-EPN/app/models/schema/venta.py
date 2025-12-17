from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CartItemSchema(BaseModel):
    id_recurso: int
    quantity: int
    precio_venta: float
    nombre: str

class CheckoutSchema(BaseModel):
    customer_name: str
    customer_phone: str = "N/A"
    items: List[CartItemSchema]
    total: float

# Esquema para ver un ITEM individual dentro de una orden
class SaleOrderItemRead(BaseModel):
    id_item: int
    resource_id: int
    quantity: int
    unit_price: float
    subtotal: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

# Esquema para ver la ORDEN completa (Cabecera + Items)
class SaleOrderRead(BaseModel):
    id_sale: int
    customer_name: str
    customer_phone: Optional[str] = None
    total_amount: float
    status: str
    created_at: datetime
    items: List[SaleOrderItemRead] # Aquí anidamos los items
    
    class Config:
        from_attributes = True