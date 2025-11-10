from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
from database import engine, get_db

# Crear las tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bar & Grill API",
    description="API para gestión de restaurante",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== ENDPOINTS DE PRODUCTOS ==========

@app.get("/")
def read_root():
    return {"message": "Bar & Grill API - Bienvenido"}

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener todos los productos disponibles"""
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.get("/products/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Obtener un producto por ID"""
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_product

@app.get("/products/category/{category}", response_model=List[schemas.Product])
def read_products_by_category(category: str, db: Session = Depends(get_db)):
    """Obtener productos por categoría (pizzas, sandwiches, wraps)"""
    products = crud.get_products_by_category(db, category=category)
    return products

@app.post("/products/", response_model=schemas.Product, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """Crear un nuevo producto"""
    return crud.create_product(db=db, product=product)

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    """Actualizar un producto existente"""
    db_product = crud.update_product(db=db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Eliminar (desactivar) un producto"""
    db_product = crud.delete_product(db=db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado exitosamente"}

# ========== ENDPOINTS DE ÓRDENES ==========

@app.get("/orders/", response_model=List[schemas.Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener todas las órdenes"""
    orders = crud.get_orders(db, skip=skip, limit=limit)
    return orders

@app.get("/orders/{order_id}", response_model=schemas.Order)
def read_order(order_id: int, db: Session = Depends(get_db)):
    """Obtener una orden por ID"""
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return db_order

@app.post("/orders/", response_model=schemas.Order, status_code=201)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Crear una nueva orden"""
    return crud.create_order(db=db, order=order)

@app.patch("/orders/{order_id}/status", response_model=schemas.Order)
def update_order_status(order_id: int, order_update: schemas.OrderUpdate, db: Session = Depends(get_db)):
    """Actualizar el estado de una orden"""
    db_order = crud.update_order_status(db=db, order_id=order_id, status=order_update.status)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return db_order

# ========== ENDPOINT PARA INICIALIZAR DATOS DE PRUEBA ==========

@app.post("/init-data/")
def initialize_data(db: Session = Depends(get_db)):
    """Crear productos de prueba en la base de datos"""
    
    # Verificar si ya hay productos
    existing_products = crud.get_products(db)
    if existing_products:
        return {"message": "La base de datos ya tiene productos"}
    
    # Productos de prueba
    products_data = [
        # Pizzas
        schemas.ProductCreate(name="Pizza Margarita", description="Salsa de tomate, mozzarella fresca y albahaca", price=8500, category="pizzas", image="🍕"),
        schemas.ProductCreate(name="Pizza Pepperoni", description="Pepperoni, mozzarella y orégano", price=9500, category="pizzas", image="🍕"),
        schemas.ProductCreate(name="Pizza Cuatro Quesos", description="Mozzarella, gorgonzola, parmesano y provolone", price=10500, category="pizzas", image="🍕"),
        schemas.ProductCreate(name="Pizza Hawaiana", description="Jamón, piña y mozzarella", price=9000, category="pizzas", image="🍕"),
        
        # Sandwiches
        schemas.ProductCreate(name="Sandwich Clásico", description="Jamón, queso, lechuga y tomate", price=5500, category="sandwiches", image="🥪"),
        schemas.ProductCreate(name="Sandwich Vegetariano", description="Vegetales grillados, hummus y rúcula", price=6000, category="sandwiches", image="🥪"),
        schemas.ProductCreate(name="Sandwich de Pollo", description="Pollo grillado, queso cheddar y salsa BBQ", price=6500, category="sandwiches", image="🥪"),
        schemas.ProductCreate(name="Sandwich Completo", description="Carne, huevo, queso, lechuga y tomate", price=7000, category="sandwiches", image="🥪"),
        
        # Wraps
        schemas.ProductCreate(name="Wrap César", description="Pollo, lechuga romana, parmesano y aderezo césar", price=6500, category="wraps", image="🌯"),
        schemas.ProductCreate(name="Wrap Mexicano", description="Carne, frijoles, guacamole y pico de gallo", price=7000, category="wraps", image="🌯"),
        schemas.ProductCreate(name="Wrap Vegano", description="Falafel, hummus, vegetales frescos", price=6500, category="wraps", image="🌯"),
        schemas.ProductCreate(name="Wrap BBQ", description="Pollo BBQ, cebolla caramelizada y queso", price=7500, category="wraps", image="🌯"),
    ]
    
    for product_data in products_data:
        crud.create_product(db, product_data)
    
    return {"message": "Datos de prueba creados exitosamente", "products": len(products_data)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)