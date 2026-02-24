"""
backend/main.py
----------------
API REST construida con FastAPI que gestiona productos, pedidos, empleados y categorías.

Tablas:
- productos: catálogo de productos con categoría
- categorias: categorías dinámicas de productos
- pedidos: cabecera de cada pedido (salon, delivery, mostrador)
- pedido_detalle: items de cada pedido
- pedidos_salon: metadatos de pedidos en salón (mesa, mozo, personas)
- pedidos_delivery: metadatos de pedidos delivery (cliente, teléfono, dirección)
- pedidos_mostrador: metadatos de pedidos en mostrador
- empleados: empleados del negocio con rol y baja lógica

Uso rápido:
    1. pip install -r requirements.txt
    2. uvicorn main:app --reload
"""

from fastapi import FastAPI, HTTPException
import sqlite3
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

DB_NAME = "negocio.db"


# ─────────────────────────────────────────────
#  INICIALIZACIÓN DE BASE DE DATOS
# ─────────────────────────────────────────────

def init_db():
    """Crea todas las tablas necesarias si no existen."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # ── CATEGORIAS ──────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categorias (
            categoria_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            descripcion TEXT,
            fecha_creacion TEXT NOT NULL
        )
    """)

    # ── PRODUCTOS ───────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS productos (
            producto_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            precio REAL NOT NULL,
            costo REAL,
            imagen TEXT,
            categoria TEXT NOT NULL,
            fecha_creacion TEXT NOT NULL
        )
    """)

    # ── EMPLEADOS ───────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS empleados (
            empleado_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            dni TEXT UNIQUE,
            email TEXT UNIQUE,
            telefono TEXT,
            rol TEXT NOT NULL,
            activo INTEGER DEFAULT 1,
            fecha_creacion TEXT NOT NULL
        )
    """)

    # ── PEDIDOS (cabecera) ───────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedidos (
            pedido_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_cliente TEXT NOT NULL,
            direccion TEXT NOT NULL,
            total REAL NOT NULL,
            fecha_pedido TEXT NOT NULL,
            origen TEXT,
            telefono TEXT,
            camarero TEXT,
            comentario TEXT,
            cargado_por TEXT
        )
    """)

    # ── PEDIDO_DETALLE ───────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedido_detalle (
            detalle_id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            comentario TEXT,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id),
            FOREIGN KEY (producto_id) REFERENCES productos(producto_id)
        )
    """)

    # ── PEDIDOS_SALON ────────────────────────────
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

    # ── PEDIDOS_DELIVERY ─────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedidos_delivery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            nombre_cliente TEXT,
            telefono TEXT,
            direccion TEXT,
            total REAL,
            fecha TEXT,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id)
        )
    """)

    # ── PEDIDOS_MOSTRADOR ────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedidos_mostrador (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            nombre_cliente TEXT,
            total REAL,
            fecha TEXT,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id)
        )
    """)

    conn.commit()
    conn.close()
    print("Base de datos inicializada correctamente")

    # Agregar columnas faltantes en tablas existentes (migraciones seguras)
    try:
        conn2 = sqlite3.connect(DB_NAME)
        cursor2 = conn2.cursor()

        cursor2.execute("PRAGMA table_info(pedidos)")
        cols = [row[1] for row in cursor2.fetchall()]
        for col in ['origen', 'telefono', 'camarero', 'comentario', 'cargado_por']:
            if col not in cols:
                cursor2.execute(f"ALTER TABLE pedidos ADD COLUMN {col} TEXT")

        cursor2.execute("PRAGMA table_info(productos)")
        cols_prod = [row[1] for row in cursor2.fetchall()]
        if 'costo' not in cols_prod:
            cursor2.execute("ALTER TABLE productos ADD COLUMN costo REAL")

        # Migración: agregar comentario a pedido_detalle si no existe
        cursor2.execute("PRAGMA table_info(pedido_detalle)")
        cols_det = [row[1] for row in cursor2.fetchall()]
        if 'comentario' not in cols_det:
            cursor2.execute("ALTER TABLE pedido_detalle ADD COLUMN comentario TEXT")

        conn2.commit()
    except Exception:
        pass
    finally:
        try:
            conn2.close()
        except Exception:
            pass


def get_db_connection():
    """Devuelve una conexión con row_factory para acceder columnas por nombre."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


# ─────────────────────────────────────────────
#  INSTANCIA Y CORS
# ─────────────────────────────────────────────

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ─────────────────────────────────────────────
#  MODELOS PYDANTIC
# ─────────────────────────────────────────────

class Categoria(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class Productos(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    costo: Optional[float] = None
    imagen: str
    categoria: str

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    costo: Optional[float] = None
    imagen: Optional[str] = None
    categoria: Optional[str] = None

class Empleado(BaseModel):
    nombre: str
    apellido: str
    dni: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol: str  # 'admin', 'mozo', 'cajero', 'cocina', etc.

class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol: Optional[str] = None

class DetallePedido(BaseModel):
    producto_id: int
    cantidad: int
    comentario: Optional[str] = None

class Pedido(BaseModel):
    nombre_cliente: str
    direccion: str
    detalles: list[DetallePedido]
    origen: Optional[str] = None       # 'salon', 'delivery', 'mostrador'
    telefono: Optional[str] = None
    camarero: Optional[str] = None
    comentario: Optional[str] = None
    cargado_por: Optional[str] = None
    # Campos salón
    mesa: Optional[int] = None
    mozo: Optional[str] = None
    personas: Optional[int] = None


# ─────────────────────────────────────────────
#  RAÍZ
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"mensaje": "API del negocio funcionando correctamente"}


# ─────────────────────────────────────────────
#  CATEGORÍAS
# ─────────────────────────────────────────────

@app.post("/categorias", status_code=201)
def crear_categoria(categoria: Categoria):
    """Crea una nueva categoría de productos."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO categorias (nombre, descripcion, fecha_creacion) VALUES (?, ?, ?)",
            (categoria.nombre, categoria.descripcion, datetime.now().isoformat())
        )
        conn.commit()
        categoria_id = cursor.lastrowid
        return {"mensaje": "Categoría creada exitosamente", "categoria_id": categoria_id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    finally:
        conn.close()


@app.get("/categorias", status_code=200)
def listar_categorias():
    """Devuelve todas las categorías disponibles."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categorias ORDER BY nombre ASC")
    categorias = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return categorias


@app.delete("/categorias/{categoria_id}", status_code=200)
def eliminar_categoria(categoria_id: int):
    """Elimina una categoría por su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categorias WHERE categoria_id = ?", (categoria_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    cursor.execute("DELETE FROM categorias WHERE categoria_id = ?", (categoria_id,))
    conn.commit()
    conn.close()
    return {"mensaje": "Categoría eliminada exitosamente"}


# ─────────────────────────────────────────────
#  PRODUCTOS
# ─────────────────────────────────────────────

@app.post("/productos", status_code=201)
def agregar_productos(producto: Productos):
    """Crea un nuevo producto."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO productos (nombre, descripcion, precio, costo, imagen, categoria, fecha_creacion)
           VALUES(?, ?, ?, ?, ?, ?, ?)""",
        (
            producto.nombre,
            producto.descripcion,
            producto.precio,
            producto.costo,
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
    """Devuelve todos los productos. Opcionalmente filtra por categoría usando ?categoria=nombre"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos")
    productos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return productos


@app.get("/productos/categoria/{nombre_categoria}", status_code=200)
def productos_por_categoria(nombre_categoria: str):
    """Devuelve los productos filtrados por categoría."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos WHERE categoria = ?", (nombre_categoria,))
    productos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return productos


@app.get("/productos/{producto_id}", status_code=200)
def mostrar_producto_individual(producto_id: int):
    """Devuelve un producto por su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos WHERE producto_id = ?", (producto_id,))
    producto = cursor.fetchone()
    conn.close()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return dict(producto)


@app.put("/productos/{producto_id}", status_code=200)
def actualizar_producto(producto_id: int, producto: ProductoUpdate):
    """Actualiza campos de un producto de forma parcial."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos WHERE producto_id = ?", (producto_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    campos = []
    valores = []
    if producto.nombre is not None:
        campos.append("nombre = ?"); valores.append(producto.nombre)
    if producto.descripcion is not None:
        campos.append("descripcion = ?"); valores.append(producto.descripcion)
    if producto.precio is not None:
        campos.append("precio = ?"); valores.append(producto.precio)
    if producto.costo is not None:
        campos.append("costo = ?"); valores.append(producto.costo)
    if producto.imagen is not None:
        campos.append("imagen = ?"); valores.append(producto.imagen)
    if producto.categoria is not None:
        campos.append("categoria = ?"); valores.append(producto.categoria)

    if not campos:
        conn.close()
        return {"mensaje": "No se proporcionaron campos para actualizar"}

    valores.append(producto_id)
    cursor.execute(f"UPDATE productos SET {', '.join(campos)} WHERE producto_id = ?", tuple(valores))
    conn.commit()
    conn.close()
    return {"mensaje": "Producto actualizado exitosamente", "producto_id": producto_id}


@app.delete("/productos/{producto_id}", status_code=200)
def eliminar_producto(producto_id: int):
    """Elimina un producto por su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos WHERE producto_id = ?", (producto_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cursor.execute("DELETE FROM productos WHERE producto_id = ?", (producto_id,))
    conn.commit()
    conn.close()
    return {"mensaje": "Producto eliminado exitosamente", "producto_id": producto_id}


# ─────────────────────────────────────────────
#  EMPLEADOS
# ─────────────────────────────────────────────

@app.post("/empleados", status_code=201)
def crear_empleado(empleado: Empleado):
    """Crea un nuevo empleado."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO empleados (nombre, apellido, dni, email, telefono, rol, fecha_creacion)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                empleado.nombre,
                empleado.apellido,
                empleado.dni,
                empleado.email,
                empleado.telefono,
                empleado.rol,
                datetime.now().isoformat()
            )
        )
        conn.commit()
        empleado_id = cursor.lastrowid
        return {"mensaje": "Empleado creado exitosamente", "empleado_id": empleado_id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Ya existe un empleado con ese DNI o email")
    finally:
        conn.close()


@app.get("/empleados", status_code=200)
def listar_empleados():
    """Devuelve todos los empleados activos."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM empleados WHERE activo = 1 ORDER BY apellido ASC")
    empleados = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return empleados


@app.get("/empleados/{empleado_id}", status_code=200)
def obtener_empleado(empleado_id: int):
    """Devuelve un empleado por su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM empleados WHERE empleado_id = ?", (empleado_id,))
    empleado = cursor.fetchone()
    conn.close()
    if empleado is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return dict(empleado)


@app.put("/empleados/{empleado_id}", status_code=200)
def actualizar_empleado(empleado_id: int, empleado: EmpleadoUpdate):
    """Actualiza datos de un empleado de forma parcial."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM empleados WHERE empleado_id = ?", (empleado_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    campos = []
    valores = []
    if empleado.nombre is not None:
        campos.append("nombre = ?"); valores.append(empleado.nombre)
    if empleado.apellido is not None:
        campos.append("apellido = ?"); valores.append(empleado.apellido)
    if empleado.dni is not None:
        campos.append("dni = ?"); valores.append(empleado.dni)
    if empleado.email is not None:
        campos.append("email = ?"); valores.append(empleado.email)
    if empleado.telefono is not None:
        campos.append("telefono = ?"); valores.append(empleado.telefono)
    if empleado.rol is not None:
        campos.append("rol = ?"); valores.append(empleado.rol)

    if not campos:
        conn.close()
        return {"mensaje": "No se proporcionaron campos para actualizar"}

    valores.append(empleado_id)
    cursor.execute(f"UPDATE empleados SET {', '.join(campos)} WHERE empleado_id = ?", tuple(valores))
    conn.commit()
    conn.close()
    return {"mensaje": "Empleado actualizado exitosamente", "empleado_id": empleado_id}


@app.delete("/empleados/{empleado_id}", status_code=200)
def eliminar_empleado(empleado_id: int):
    """Baja lógica del empleado (no se borra, se desactiva)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM empleados WHERE empleado_id = ?", (empleado_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    cursor.execute("UPDATE empleados SET activo = 0 WHERE empleado_id = ?", (empleado_id,))
    conn.commit()
    conn.close()
    return {"mensaje": "Empleado dado de baja exitosamente", "empleado_id": empleado_id}


# ─────────────────────────────────────────────
#  PEDIDOS
# ─────────────────────────────────────────────

@app.post("/pedidos", status_code=201)
def cargar_pedido(pedido: Pedido):
    """Crea un pedido y lo registra en la tabla correspondiente según su origen:
    - salon      → pedidos_salon
    - delivery   → pedidos_delivery
    - mostrador  → pedidos_mostrador
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Validar productos y calcular total
    total = 0
    for item in pedido.detalles:
        cursor.execute("SELECT precio FROM productos WHERE producto_id = ?", (item.producto_id,))
        producto = cursor.fetchone()
        if producto is None:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")
        total += producto["precio"] * item.cantidad

    # Insertar cabecera en pedidos
    cursor.execute(
        """INSERT INTO pedidos (nombre_cliente, direccion, total, fecha_pedido, origen, telefono, camarero, comentario, cargado_por)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            pedido.nombre_cliente,
            pedido.direccion,
            total,
            datetime.now().isoformat(),
            pedido.origen or "",
            pedido.telefono or "",
            pedido.camarero or "",
            pedido.comentario or "",
            pedido.cargado_por or "",
        ),
    )
    pedido_id = cursor.lastrowid

    # Insertar detalles (con comentario por producto si existe)
    for item in pedido.detalles:
        cursor.execute("SELECT precio FROM productos WHERE producto_id = ?", (item.producto_id,))
        precio = cursor.fetchone()["precio"]
        cursor.execute(
            """INSERT INTO pedido_detalle(pedido_id, producto_id, cantidad, precio_unitario, comentario)
               VALUES (?, ?, ?, ?, ?)""",
            (pedido_id, item.producto_id, item.cantidad, precio, item.comentario or None),
        )

    origen = (pedido.origen or "").lower()

    # ── Metadatos según origen ───────────────────
    if origen == "salon":
        import re
        mesa_val = pedido.mesa
        mozo_val = pedido.mozo or ""
        personas_val = pedido.personas

        if mesa_val is None:
            m = re.search(r"Mesa\s*(\d+)", pedido.nombre_cliente or "", re.I)
            if m:
                mesa_val = int(m.group(1))

        if not mozo_val:
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

        cursor.execute(
            """INSERT INTO pedidos_salon (pedido_id, mesa, mozo, personas, total, fecha)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (pedido_id, mesa_val, mozo_val, personas_val, total, datetime.now().isoformat()),
        )

    elif origen == "delivery":
        cursor.execute(
            """INSERT INTO pedidos_delivery (pedido_id, nombre_cliente, telefono, direccion, total, fecha)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                pedido_id,
                pedido.nombre_cliente,
                pedido.telefono or "",
                pedido.direccion or "",
                total,
                datetime.now().isoformat()
            ),
        )

    elif origen == "mostrador":
        cursor.execute(
            """INSERT INTO pedidos_mostrador (pedido_id, nombre_cliente, total, fecha)
               VALUES (?, ?, ?, ?)""",
            (pedido_id, pedido.nombre_cliente, total, datetime.now().isoformat()),
        )

    conn.commit()
    conn.close()
    return {"mensaje": "Pedido creado correctamente", "pedido_id": pedido_id, "total": total}


@app.get("/pedidos", status_code=200)
def mostrar_pedidos():
    """Devuelve todos los pedidos con sus items, ordenados por fecha descendente."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pedidos ORDER BY fecha_pedido DESC")
    pedidos = [dict(row) for row in cursor.fetchall()]

    for pedido in pedidos:
        cursor.execute(
            """SELECT pd.producto_id, pd.cantidad, pd.precio_unitario, pd.comentario, p.nombre, p.categoria
               FROM pedido_detalle pd
               JOIN productos p ON pd.producto_id = p.producto_id
               WHERE pd.pedido_id = ?""",
            (pedido["pedido_id"],),
        )
        pedido["items"] = [dict(row) for row in cursor.fetchall()]

        origen = (pedido.get("origen") or "").lower()

        if origen == "salon":
            cursor.execute("SELECT mesa, mozo, personas FROM pedidos_salon WHERE pedido_id = ?", (pedido["pedido_id"],))
            row = cursor.fetchone()
            if row:
                pedido["mesa"] = row["mesa"]
                pedido["mozo"] = row["mozo"]
                pedido["personas"] = row["personas"]

        elif origen == "delivery":
            cursor.execute("SELECT telefono, direccion FROM pedidos_delivery WHERE pedido_id = ?", (pedido["pedido_id"],))
            row = cursor.fetchone()
            if row:
                pedido["telefono_entrega"] = row["telefono"]
                pedido["direccion_entrega"] = row["direccion"]

    conn.close()
    return pedidos


@app.get("/pedidos/salon", status_code=200)
def mostrar_pedidos_salon():
    """Devuelve todos los pedidos del salón con sus items."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pedidos_salon ORDER BY fecha DESC")
    rows = [dict(row) for row in cursor.fetchall()]

    for row in rows:
        cursor.execute(
            """SELECT pd.producto_id, pd.cantidad, pd.precio_unitario, pd.comentario, p.nombre, p.categoria
               FROM pedido_detalle pd
               JOIN productos p ON pd.producto_id = p.producto_id
               WHERE pd.pedido_id = ?""",
            (row["pedido_id"],)
        )
        row["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return rows


@app.get("/pedidos/delivery", status_code=200)
def mostrar_pedidos_delivery():
    """Devuelve todos los pedidos de delivery con sus items."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pedidos_delivery ORDER BY fecha DESC")
    rows = [dict(row) for row in cursor.fetchall()]

    for row in rows:
        cursor.execute(
            """SELECT pd.producto_id, pd.cantidad, pd.precio_unitario, pd.comentario, p.nombre, p.categoria
               FROM pedido_detalle pd
               JOIN productos p ON pd.producto_id = p.producto_id
               WHERE pd.pedido_id = ?""",
            (row["pedido_id"],)
        )
        row["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return rows


@app.get("/pedidos/mostrador", status_code=200)
def mostrar_pedidos_mostrador():
    """Devuelve todos los pedidos de mostrador con sus items."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pedidos_mostrador ORDER BY fecha DESC")
    rows = [dict(row) for row in cursor.fetchall()]

    for row in rows:
        cursor.execute(
            """SELECT pd.producto_id, pd.cantidad, pd.precio_unitario, pd.comentario, p.nombre, p.categoria
               FROM pedido_detalle pd
               JOIN productos p ON pd.producto_id = p.producto_id
               WHERE pd.pedido_id = ?""",
            (row["pedido_id"],)
        )
        row["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return rows


@app.delete("/pedidos/{pedido_id}", status_code=200)
def eliminar_pedido(pedido_id: int):
    """Elimina un pedido y todos sus detalles asociados."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM pedidos WHERE pedido_id = ?", (pedido_id,))
    pedido = cursor.fetchone()
    if pedido is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    origen = (dict(pedido).get("origen") or "").lower()

    cursor.execute("DELETE FROM pedido_detalle WHERE pedido_id = ?", (pedido_id,))

    if origen == "salon":
        cursor.execute("DELETE FROM pedidos_salon WHERE pedido_id = ?", (pedido_id,))
    elif origen == "delivery":
        cursor.execute("DELETE FROM pedidos_delivery WHERE pedido_id = ?", (pedido_id,))
    elif origen == "mostrador":
        cursor.execute("DELETE FROM pedidos_mostrador WHERE pedido_id = ?", (pedido_id,))

    cursor.execute("DELETE FROM pedidos WHERE pedido_id = ?", (pedido_id,))

    conn.commit()
    conn.close()
    return {"mensaje": "Pedido eliminado exitosamente", "pedido_id": pedido_id}
