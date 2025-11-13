# IMPORTANTE!!
# Instalación de dependencias del proyecto
# Para instalar todas las dependencias necesarias, desde la terminal, ejecuta el siguiente comando en la raíz del proyecto:
#
#     pip install -r requirements.txt
#
# Este comando instalará automáticamente todas las librerías listadas en el archivo
# requirements.txt, incluyendo FastAPI, Uvicorn (para ejecutar el servidor) y otras
# dependencias requeridas por la aplicación.

# Por ultimo ejecuta el comando uvicorn main:app --reload para levantar el servidor de la api

#  Importamos todas las librerias que utilizaremos
from fastapi import FastAPI, HTTPException
import sqlite3
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional



# La variable DB_NAME almacena el nombre del archivo de la base de datos SQLite
# "negocio.db" es el archivo donde se guardan todas las tablas y registros del proyecto

DB_NAME = "negocio.db"

# Esta funcion inicializa la conxion a la base de datos de SQLite y crea las tablas necesarias para el proyecto (productos, pedidos, pedido_detalle)
def init_db():
    """Inicializa la base de datos y crea la tabla si no existe"""
    conn = sqlite3.connect(DB_NAME) # Conexion a la base de datos
    cursor = conn.cursor() # El cursor prepara la conexión (conn) para poder enviar consultas y recibir resultados desde SQLite.

    # creacion Tabla PRODUCTOS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS productos (
            producto_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            precio REAL NOT NULL,
            imagen TEXT,
            categoria TEXT NOT NULL,
            fecha_creacion TEXT NOT NULL
        )
    """)
    
    # creacion Tabla PEDIDOS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedidos (
            pedido_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_cliente TEXT NOT NULL,
            direccion TEXT NOT NULL,
            total REAL NOT NULL,
            fecha_pedido TEXT NOT NULL
        )
    """)
    
    # creacion Tabla PEDIDO_DETALLE
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedido_detalle (
            detalle_id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id),
            FOREIGN KEY (producto_id) REFERENCES productos(producto_id)
        )
    """)

    conn.commit() # Se guardan los cambios 
    conn.close() # importante cerrar la conexion de la base de datos
    print("Base de datos inicializada")


def get_db_connection():
    """Obtiene una conexión a la base de datos"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# instancia de FastApi
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ejecutamos la funcion que prepara la base de datos
init_db()

# Creamos un objeto Productos con sus respectivos atributos, utilizando el BaseModel de FastApi
class Productos(BaseModel): 
    nombre: str
    descripcion: str
    precio: float
    imagen: str
    categoria: str

# Creamos un Objeto DetallePedido con sus respectivos atributos
class DetallePedido(BaseModel): 
    producto_id : int
    cantidad: int

# Creamos un Objeto Pedido con sus respectivos atributos
class Pedido(BaseModel): 
    nombre_cliente: str
    direccion: str
    detalles: list[DetallePedido]

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    imagen: Optional[str] = None
    categoria: Optional[str] = None


# Enpoint Raiz
@app.get("/")
def root(): 
    return {
        "mensaje" : "Esta es la api de nuestra pagina"
    }

# Enpoint que utiliza una operacion POST para agregar productos 
@app.post("/productos" , status_code=201)
def agregar_productos(producto: Productos): 
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(""" INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, fecha_creacion) 
    VALUES(?, ?, ?, ?, ?, ?)""" , 
    (producto.nombre,
     producto.descripcion, 
     producto.precio, 
     producto.imagen, 
     producto.categoria,
     datetime.now().isoformat() # operador que obtiene la fecha en la que se realiza el put
    )) # ejecuta codigo SQL, inserta los valores de los atributos para que sean agregados a las tablas
    
    producto_id = cursor.lastrowid # obtiene el id del ultimo objeto agregado
    conn.commit()
    conn.close()
    return {
        "mensaje": "Producto creado exitosamente",
        "producto_id": producto_id
    } # mostramos mensaje de exito 
    
    

# Enpoint que uitliza una operacion GET para obtener los datos de los productos
@app.get("/productos", status_code=200)
def mostrar_productos(): 
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(""" SELECT * FROM productos """) # Consulta SQL 
    productos = [dict(row) for row in cursor.fetchall()] # Convierte los resultados de la consulta en un diccionario
    conn.close()
    return productos


# Enpoint que utiliza una operacion GET para obtener los datos de un producto en especifico segun su id
@app.get("/productos/{producto_id}", status_code=200)
def mostrar_producto_individual(producto_id : int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(""" SELECT * FROM productos WHERE producto_id = ? """, (producto_id,)) # Consulta de SQL 
    productoIndividual = cursor.fetchone()
    conn.close()  
    if productoIndividual is None: 
        raise HTTPException(status_code=404, detail={"No se encontro el producto"}) # Manejo de errores
    return dict(productoIndividual)

# Endpoint que utiliza la operacion POST para cargar los datos de los pedidos y sus detalles
@app.post("/pedidos")
def cargar_pedido(pedido: Pedido):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    total = 0 # Variable que se utilizara para calcular almacenar el total de la compra
    for item in pedido.detalles: 
        # Buscar el precio del producto
        cursor.execute(
            "SELECT precio FROM productos WHERE producto_id = ?",
            (item.producto_id,)
        )
        producto = cursor.fetchone()
        if producto is None:
            conn.close()
            raise HTTPException(
                status_code=404, 
                detail=f"Producto con ID {item.producto_id} no encontrado"
            )
        total += producto['precio'] * item.cantidad # Operacion que calcula el precio total del pedido

    # Se agregan los datos a la tabla pedidos
    cursor.execute(""" INSERT INTO pedidos (nombre_cliente, direccion, total, fecha_pedido)
                    VALUES (?, ?, ?, ? )""", 
                    (pedido.nombre_cliente,
                    pedido.direccion,
                    total, # Resultado de nuestra operacion
                    datetime.now().isoformat()))
    pedido_id = cursor.lastrowid

    # Bucle que busca el precio unitario e inserta los datos a la tabla de detalles_pedido
    for item in pedido.detalles: 
        cursor.execute(""" SELECT precio FROM productos WHERE producto_id = ?""", (item.producto_id,)) 
        precio = cursor.fetchone()['precio']

        cursor.execute(""" INSERT INTO pedido_detalle(pedido_id, producto_id, cantidad, precio_unitario)
                    VALUES (?, ?, ?, ?)""", 
                    (pedido_id, 
                    item.producto_id,
                    item.cantidad,
                    precio
                    ))
    conn.commit()
    conn.close()

    # Mensaje de Exito 
    return {
        "mensaje" : "Pedido Creado Correctamente",
        "pedido_id": pedido_id,
        "total": total
    }

@app.put("/productos/{producto_id}", status_code=200)
def actualizar_producto(producto_id: int, producto: ProductoUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar que el producto existe
    cursor.execute("SELECT * FROM productos WHERE producto_id = ?", (producto_id,))
    producto_existente = cursor.fetchone()
    
    if producto_existente is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Construir la query dinámicamente solo con los campos que se enviaron
    campos_actualizar = []
    valores = []
    
    if producto.nombre is not None:
        campos_actualizar.append("nombre = ?")
        valores.append(producto.nombre)
    
    if producto.descripcion is not None:
        campos_actualizar.append("descripcion = ?")
        valores.append(producto.descripcion)
    
    if producto.precio is not None:
        campos_actualizar.append("precio = ?")
        valores.append(producto.precio)
    
    if producto.imagen is not None:
        campos_actualizar.append("imagen = ?")
        valores.append(producto.imagen)
    
    if producto.categoria is not None:
        campos_actualizar.append("categoria = ?")
        valores.append(producto.categoria)
    
    # Si no hay campos para actualizar
    if not campos_actualizar:
        conn.close()
        return {"mensaje": "No se proporcionaron campos para actualizar"}
    
    # Construir y ejecutar la query
    valores.append(producto_id)  # Agregar el ID al final para el WHERE
    query = f"UPDATE productos SET {', '.join(campos_actualizar)} WHERE producto_id = ?"
    
    cursor.execute(query, tuple(valores))
    
    conn.commit()
    conn.close()
    
    return {
        "mensaje": "Producto actualizado exitosamente",
        "producto_id": producto_id
    }

# Endpoint que utiliza la operacion GET para obtener los datos de los pedidos y sus detalles
@app.get("/pedidos")
def mostrar_pedidos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(""" SELECT * FROM pedidos""")
    pedidos = [dict(row) for row in cursor.fetchall()]

    # Bucle que realiza un JOIN de las tablas pedidos y detalle_pedidos, para que visualmente el resultado sea mas completo
    for pedido in pedidos:
        cursor.execute("""
            SELECT 
                pd.producto_id,
                pd.cantidad,
                pd.precio_unitario,
                p.nombre,
                p.categoria
            FROM pedido_detalle pd
            JOIN productos p ON pd.producto_id = p.producto_id
            WHERE pd.pedido_id = ?
        """, (pedido['pedido_id'],))
        
        pedido['items'] = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return pedidos

@app.delete("/pedidos/{pedido_id}")
def eliminar_pedido(pedido_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM pedidos WHERE pedido_id = ?", (pedido_id,))
    pedido = cursor.fetchone()

    if pedido is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    cursor.execute("DELETE FROM pedido_detalle WHERE pedido_id = ?", (pedido_id,))
    
    # Eliminar el pedido (DESPUÉS)
    cursor.execute("DELETE FROM pedidos WHERE pedido_id = ?", (pedido_id,))
    
    conn.commit()
    conn.close()

    return {
        "mensaje": "Pedido cancelado exitosamente",
        "pedido_id": pedido_id
    }