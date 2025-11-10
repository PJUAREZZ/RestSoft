from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Schemas para Products
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image: str = "🍕"
    available: int = 1

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schemas para OrderItems
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    product: Optional[Product] = None
    
    class Config:
        from_attributes = True

# Schemas para Orders
class OrderBase(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    total: float

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: str

class Order(OrderBase):
    id: int
    status: str
    created_at: datetime
    items: List[OrderItem] = []
    
    class Config:
        from_attributes = True