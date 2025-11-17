"""
backend/main.py
----------------
API REST simple construida con FastAPI que gestiona productos y pedidos.

Resumen:
- Inicializa una base de datos SQLite (`negocio.db`) con 3 tablas: `productos`, `pedidos` y `pedido_detalle`.
- Expone endpoints para crear/leer/actualizar productos y para crear/listar/eliminar pedidos.
- Usa Pydantic (`BaseModel`) para validar los datos entrantes (payloads JSON).

Uso rápido (desde la raíz del proyecto):
    1. Instalar dependencias: `pip3 install -r requirements.txt`
    2. Levantar servidor en modo desarrollo: `python3 -m uvicorn main:app --reload`

Comentarios en el código: cada función/endpoint tiene un comentario que explica su propósito.
"""

# IMPORTANTE: instalación de dependencias
# Para instalar todas las dependencias necesarias, desde la terminal, ejecuta:
#     pip install -r requirements.txt
# Por último ejecuta el comando `uvicorn main:app --reload` para levantar el servidor de la API

# Importamos todas las librerías que utilizaremos
from fastapi import FastAPI, HTTPException
import sqlite3
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional



# Nombre del archivo SQLite que actúa como base de datos local
DB_NAME = "negocio.db"

# Esta funcion inicializa la conxion a la base de datos de SQLite y crea las tablas necesarias para el proyecto (productos, pedidos, pedido_detalle)
def init_db():
    """Crea las tablas necesarias en la base de datos si no existen.

    Tablas creadas:
    - productos: contiene la información de cada producto (nombre, precio, imagen, etc.)
    - pedidos: cabeceras de pedidos realizados
    - pedido_detalle: items asociados a cada pedido (relación pedidos<->productos)
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

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
            fecha_pedido TEXT NOT NULL,
            origen TEXT
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

    # creacion Tabla PEDIDOS_SALON para almacenar metadatos de pedidos realizados en el salón
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedidos_salon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            mesa INTEGER,
            mozo TEXT,
            personas INTEGER,
            total REAL,
            fecha TEXT,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id)
        )
    """)

    conn.commit()  # Guardar cambios
    conn.close()   # Cerrar conexión
    print("Base de datos inicializada")

    # Si la base ya existía sin la columna 'origen', intentamos agregarla (seguro en sqlite)
    try:
        conn2 = sqlite3.connect(DB_NAME)
        cursor2 = conn2.cursor()
        cursor2.execute("PRAGMA table_info(pedidos)")
        cols = [row[1] for row in cursor2.fetchall()]
        if 'origen' not in cols:
            cursor2.execute("ALTER TABLE pedidos ADD COLUMN origen TEXT")
            conn2.commit()
    except Exception:
        # Si falla por cualquier razón, no rompemos la inicialización
        pass
    finally:
        try:
            conn2.close()
        except Exception:
            pass


def get_db_connection():
    """Devuelve una conexión a la base de datos con `row_factory` configurado.

    `sqlite3.Row` permite acceder a columnas por nombre (row['nombre']) además de por índice.
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# Instancia de la aplicación FastAPI y configuración CORS
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo permitimos cualquier origen; en producción especifica dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar la base de datos (crea tablas si no existen)
init_db()

# Creamos un objeto Productos con sus respectivos atributos, utilizando el BaseModel de FastApi
class Productos(BaseModel):
    """Modelo Pydantic para validar la carga de un nuevo producto.

    Campos:
    - nombre: nombre del producto
    - descripcion: texto descriptivo (opcional en DB, pero aquí se requiere cadena)
    - precio: float
    - imagen: ruta/URL o valor que identifica la imagen
    - categoria: categoría para filtrado (pizza, sandwich, wrap, etc.)
    """
    nombre: str
    descripcion: str
    precio: float
    imagen: str
    categoria: str

# Creamos un Objeto DetallePedido con sus respectivos atributos
class DetallePedido(BaseModel):
    """Modelo para representar un item dentro del pedido (producto + cantidad)."""
    producto_id: int
    cantidad: int

# Creamos un Objeto Pedido con sus respectivos atributos
class Pedido(BaseModel):
    """Modelo que representa un pedido completo enviado desde el frontend.

    - nombre_cliente: nombre de la persona
    - direccion: dirección de entrega
    - detalles: lista de `DetallePedido` con producto_id y cantidad
    """
    nombre_cliente: str
    direccion: str
    detalles: list[DetallePedido]
    origen: Optional[str] = None
    # Campos opcionales específicos para salón (si el frontend los envía)
    mesa: Optional[int] = None
    mozo: Optional[str] = None
    personas: Optional[int] = None

class ProductoUpdate(BaseModel):
    """Modelo para actualizaciones parciales de producto. Los campos son opcionales."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    imagen: Optional[str] = None
    categoria: Optional[str] = None


@app.get("/")
def root():
    """Endpoint raíz. Sirve como verificación de que la API está funcionando."""
    return {"mensaje": "Esta es la api de nuestra pagina"}

@app.post("/productos", status_code=201)
def agregar_productos(producto: Productos):
    """Crea un nuevo producto en la tabla `productos`.

    Recibe un payload JSON validado por `Productos` y lo inserta en la DB.
    Devuelve el `producto_id` creado.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insertar registro usando parámetros (previene inyección SQL)
    cursor.execute(
        """INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, fecha_creacion)
           VALUES(?, ?, ?, ?, ?, ?)""",
        (
            producto.nombre,
            producto.descripcion,
            producto.precio,
            producto.imagen,
            producto.categoria,
            datetime.now().isoformat(),
        ),
    )

    producto_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"mensaje": "Producto creado exitosamente", "producto_id": producto_id}
    
    

@app.get("/productos", status_code=200)
def mostrar_productos():
    """Devuelve la lista completa de productos.

    Convierte cada fila a diccionario para facilitar su uso en el frontend.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos")
    productos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return productos


@app.get("/productos/{producto_id}", status_code=200)
def mostrar_producto_individual(producto_id: int):
    """Devuelve un producto por su `producto_id`.

    Si no existe, devuelve un 404.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos WHERE producto_id = ?", (producto_id,))
    productoIndividual = cursor.fetchone()
    conn.close()
    if productoIndividual is None:
        raise HTTPException(status_code=404, detail={"No se encontro el producto"})
    return dict(productoIndividual)

@app.post("/pedidos")
def cargar_pedido(pedido: Pedido):
    """Crea un pedido a partir del payload recibido.

    Flujo:
    1. Recorre los `detalles` para validar que cada `producto_id` exista y calcular el total.
    2. Inserta la fila en `pedidos` con el total calculado.
    3. Inserta cada item en `pedido_detalle` con el `precio_unitario` actual del producto.

    Si algún producto no existe devuelve 404.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Calcular total y validar existencia de productos
    total = 0
    for item in pedido.detalles:
        cursor.execute("SELECT precio FROM productos WHERE producto_id = ?", (item.producto_id,))
        producto = cursor.fetchone()
        if producto is None:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")
        total += producto["precio"] * item.cantidad

    # Insertar cabecera del pedido (incluye 'origen' si fue enviado)
    cursor.execute(
        """INSERT INTO pedidos (nombre_cliente, direccion, total, fecha_pedido, origen)
           VALUES (?, ?, ?, ?, ?)""",
        (pedido.nombre_cliente, pedido.direccion, total, datetime.now().isoformat(), pedido.origen or ""),
    )
    pedido_id = cursor.lastrowid

    # Insertar detalles del pedido (precio unitario tomado del producto en DB)
    for item in pedido.detalles:
        cursor.execute("SELECT precio FROM productos WHERE producto_id = ?", (item.producto_id,))
        precio = cursor.fetchone()["precio"]
        cursor.execute(
            """INSERT INTO pedido_detalle(pedido_id, producto_id, cantidad, precio_unitario)
               VALUES (?, ?, ?, ?)""",
            (pedido_id, item.producto_id, item.cantidad, precio),
        )

    # Si el pedido proviene del salón, guardamos metadatos en la tabla `pedidos_salon`
    if (pedido.origen or '').lower() == 'salon':
        # Preferimos campos explícitos si el frontend los envía
        mesa_val = None
        mozo_val = None
        personas_val = None
        try:
            import re
            if pedido.mesa is not None:
                mesa_val = int(pedido.mesa)
            else:
                # intentar extraer de nombre_cliente, ej. 'Mesa 5'
                m = re.search(r"Mesa\s*(\d+)", pedido.nombre_cliente or "", re.I)
                if m:
                    mesa_val = int(m.group(1))

            if pedido.mozo:
                mozo_val = pedido.mozo
            else:
                # intentar extraer de direccion "Mozo: X | Personas: Y"
                parts = (pedido.direccion or "").split('|')
                for p in parts:
                    p = p.strip()
                    if p.lower().startswith('mozo:'):
                        mozo_val = p.split(':', 1)[1].strip()
                    if p.lower().startswith('personas:'):
                        try:
                            personas_val = int(p.split(':', 1)[1].strip())
                        except Exception:
                            pass
                if personas_val is None:
                    m2 = re.search(r"Personas:?\s*(\d+)", pedido.direccion or "", re.I)
                    if m2:
                        try:
                            personas_val = int(m2.group(1))
                        except Exception:
                            pass
        except Exception:
            mesa_val = None
            mozo_val = None
            personas_val = None

        cursor.execute(
            """INSERT INTO pedidos_salon (pedido_id, mesa, mozo, personas, total, fecha)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (pedido_id, mesa_val, mozo_val or '', personas_val, total, datetime.now().isoformat()),
        )

    conn.commit()
    conn.close()
    return {"mensaje": "Pedido Creado Correctamente", "pedido_id": pedido_id, "total": total}

@app.put("/productos/{producto_id}", status_code=200)
def actualizar_producto(producto_id: int, producto: ProductoUpdate):
    """Actualiza campos de un producto de forma parcial.

    Construye dinámicamente la cláusula SET de la consulta UPDATE según los campos proporcionados.
    Si no se envía ningún campo devuelve un mensaje informando que no hay cambios.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar existencia
    cursor.execute("SELECT * FROM productos WHERE producto_id = ?", (producto_id,))
    producto_existente = cursor.fetchone()
    if producto_existente is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")

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

    if not campos_actualizar:
        conn.close()
        return {"mensaje": "No se proporcionaron campos para actualizar"}

    valores.append(producto_id)
    query = f"UPDATE productos SET {', '.join(campos_actualizar)} WHERE producto_id = ?"
    cursor.execute(query, tuple(valores))
    conn.commit()
    conn.close()
    return {"mensaje": "Producto actualizado exitosamente", "producto_id": producto_id}

@app.get("/pedidos")
def mostrar_pedidos():
    """Devuelve la lista de pedidos con sus items asociados.

    Para cada pedido hace un JOIN con `pedido_detalle` y `productos` para añadir
    información legible de cada item (nombre y categoría).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pedidos")
    pedidos = [dict(row) for row in cursor.fetchall()]

    for pedido in pedidos:
        cursor.execute(
            """SELECT pd.producto_id, pd.cantidad, pd.precio_unitario, p.nombre, p.categoria
               FROM pedido_detalle pd
               JOIN productos p ON pd.producto_id = p.producto_id
               WHERE pd.pedido_id = ?""",
            (pedido["pedido_id"],),
        )
        pedido["items"] = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return pedidos


@app.get("/pedidos_salon")
def mostrar_pedidos_salon():
    """Devuelve la lista de pedidos realizados en el salón, con metadatos (mesa, mozo, personas)

    Para cada fila en `pedidos_salon` devuelve también los items asociados al pedido (nombre, cantidad, precio_unitario).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pedidos_salon")
    salon_rows = [dict(row) for row in cursor.fetchall()]

    for row in salon_rows:
        pedido_id = row.get('pedido_id')
        cursor.execute(
            """SELECT pd.producto_id, pd.cantidad, pd.precio_unitario, p.nombre, p.categoria
               FROM pedido_detalle pd
               JOIN productos p ON pd.producto_id = p.producto_id
               WHERE pd.pedido_id = ?""",
            (pedido_id,)
        )
        row['items'] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return salon_rows

@app.delete("/pedidos/{pedido_id}")
def eliminar_pedido(pedido_id: int):
    """Elimina un pedido y sus detalles asociados.

    - Verifica existencia del pedido
    - Borra los registros en `pedido_detalle` y luego la fila en `pedidos`
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM pedidos WHERE pedido_id = ?", (pedido_id,))
    pedido = cursor.fetchone()
    if pedido is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # Borrar detalles primero (integridad referencial manual)
    cursor.execute("DELETE FROM pedido_detalle WHERE pedido_id = ?", (pedido_id,))
    # Borrar pedido
    cursor.execute("DELETE FROM pedidos WHERE pedido_id = ?", (pedido_id,))

    conn.commit()
    conn.close()
    return {"mensaje": "Pedido cancelado exitosamente", "pedido_id": pedido_id}