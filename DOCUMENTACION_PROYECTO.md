# Documentación completa del proyecto RestSoft

Este documento explica **todo el código** del proyecto para que puedas exponerlo con claridad. Incluye backend (API), frontend (React) y la función de cada archivo y bloque importante.

---

## 1. Visión general del proyecto

**RestSoft** es un sistema para restaurantes, bares y cafés que permite:

- **Elegir rol**: Administrador o Usuario.
- **Iniciar sesión / Registrarse**: Los admins se registran en `localStorage`; los usuarios (empleados) inician sesión contra la lista de empleados que crea el admin.
- **Salón**: Gestionar mesas, tomar pedidos (mesa, delivery, mostrador), enviar pedidos al backend, sacar la cuenta y ver QR de pago.
- **Estadísticas**: Ver todos los pedidos (salón, delivery, mostrador) con filtros.
- **Empleados** (solo admin): Dar de alta empleados que luego pueden iniciar sesión como “Usuario”.
- **Gestión de productos** (solo admin): Ver productos por categoría y abrir el formulario para agregar nuevos.
- **Agregar producto**: Formulario que envía POST a la API para crear un producto.

**Tecnologías:**

- **Backend**: Python, FastAPI, SQLite, Pydantic.
- **Frontend**: React (Vite o CRA), React Router, Lucide React (iconos).

**Estructura de carpetas:**

```
PROYECTO-FINAL-DE-PROGRAMACION/
├── backend/
│   ├── main.py          # API REST (productos, pedidos, BD)
│   └── negocio.db       # Base SQLite (generada al ejecutar)
├── public/
│   └── index.html       # HTML base (div#root)
├── src/
│   ├── index.jsx        # Punto de entrada React
│   ├── index.css        # Estilos globales (body, reset)
│   ├── App.jsx          # Componente raíz y flujo de la app
│   ├── App.css          # Estilos del contenedor .app
│   └── components/      # Todos los componentes
│       ├── RoleSelector.jsx / .css
│       ├── Auth.jsx / .css
│       ├── Navegador.jsx / .css
│       ├── Salon.jsx / .css
│       ├── Estadisticas.jsx / .css
│       ├── Empleados.jsx / .css
│       ├── ConfigurarMesas.jsx / .css
│       ├── GestorProductos.jsx / .css
│       ├── AgregarProducto.jsx / .css
│       ├── Footer.jsx / .css
│       └── productIcons.jsx
└── DOCUMENTACION_PROYECTO.md  # Este archivo
```

---

## 2. Backend (API) – `backend/main.py`

El backend es una **API REST** con FastAPI. Gestiona productos y pedidos y usa una base de datos **SQLite** en el archivo `negocio.db`.

### 2.1 Inicialización de la base de datos

- **`init_db()`**: Se ejecuta al arrancar la app. Crea las tablas si no existen:
  - **productos**: `producto_id`, `nombre`, `descripcion`, `precio`, `imagen`, `categoria`, `fecha_creacion`.
  - **pedidos**: `pedido_id`, `nombre_cliente`, `direccion`, `total`, `fecha_pedido`, `origen`, `telefono`, `camarero`, `comentario`, `cargado_por`.
  - **pedido_detalle**: cada ítem de un pedido (`pedido_id`, `producto_id`, `cantidad`, `precio_unitario`).
  - **pedidos_salon**: datos extra de pedidos de salón (`pedido_id`, `mesa`, `mozo`, `personas`, `total`, `fecha`).
- También hace **ALTER TABLE** para agregar columnas que puedan faltar en instalaciones viejas (`origen`, `telefono`, `camarero`, etc.).

- **`get_db_connection()`**: Abre una conexión a SQLite y configura `row_factory = sqlite3.Row` para acceder a las columnas por nombre (ej. `row['nombre']`).

### 2.2 CORS y app FastAPI

- Se crea la app con `FastAPI()` y se agrega **CORSMiddleware** con `allow_origins=["*"]` para que el frontend (puerto distinto) pueda llamar a la API sin bloqueos del navegador.

### 2.3 Modelos Pydantic

- **Productos**: `nombre`, `descripcion`, `precio`, `imagen`, `categoria`. Se usa para validar el JSON al **crear** un producto.
- **DetallePedido**: `producto_id`, `cantidad`. Un ítem dentro de un pedido.
- **Pedido**: `nombre_cliente`, `direccion`, `detalles` (lista de `DetallePedido`), y opcionales: `origen`, `telefono`, `camarero`, `comentario`, `cargado_por`, `mesa`, `mozo`, `personas`. Valida el body al **crear** un pedido.
- **ProductoUpdate**: todos los campos opcionales. Se usa para **actualizar** un producto (PATCH/PUT).

### 2.4 Endpoints

| Método y ruta | Función | Qué hace |
|---------------|---------|----------|
| **GET /** | `root()` | Mensaje de bienvenida de la API. |
| **POST /productos** | `agregar_productos(producto)` | Inserta un producto en `productos` y devuelve `producto_id`. |
| **GET /productos** | `mostrar_productos()` | Devuelve la lista completa de productos. |
| **GET /productos/{producto_id}** | `mostrar_producto_individual(producto_id)` | Devuelve un producto por ID; 404 si no existe. |
| **PUT /productos/{producto_id}** | `actualizar_producto(producto_id, producto)` | Actualiza solo los campos enviados en el body. |
| **POST /pedidos** | `cargar_pedido(pedido)` | Crea el pedido: valida productos, calcula total, inserta en `pedidos` y `pedido_detalle`. Si `origen == 'salon'`, además inserta en `pedidos_salon` (mesa, mozo, personas). Devuelve `pedido_id` y `total`. |
| **GET /pedidos** | `mostrar_pedidos()` | Lista todos los pedidos con sus ítems (JOIN con `pedido_detalle` y `productos`). Para pedidos de salón, completa con datos de `pedidos_salon`. |
| **GET /pedidos_salon** | `mostrar_pedidos_salon()` | Lista filas de `pedidos_salon` con los ítems de cada pedido. |
| **DELETE /pedidos/{pedido_id}** | `eliminar_pedido(pedido_id)` | Borra el pedido y sus detalles (primero `pedido_detalle`, luego `pedidos`). |

Para exponer la API en desarrollo suele usarse:  
`uvicorn main:app --reload` (desde la carpeta `backend`).

---

## 3. Frontend – Punto de entrada y estilos globales

### 3.1 `src/index.jsx`

- **Qué hace**: Es el **punto de entrada** del frontend.
- Importa React, ReactDOM, `index.css` y el componente `App`.
- **`ReactDOM.render(...)`**: Monta `<App />` dentro de `<React.StrictMode>` en el elemento del DOM con `id="root"` (definido en `public/index.html`).

### 3.2 `src/index.css`

- **Reset básico**: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- **body**: Fuente del sistema, antialiasing, `background-color: #0f172a`, `color: #e2e8f0`, `line-height: 1.6`. Define el tema oscuro por defecto de la app.

### 3.3 `src/App.css`

- Estilos del contenedor principal **`.app`**: `min-height: 100vh`, `background-color: #0f172a`, `color: #e2e8f0`. Mantiene el mismo tema oscuro en toda la aplicación.

---

## 4. Componente raíz – `src/App.jsx`

**Responsabilidad**: Definir el **flujo de la aplicación** (quién ve qué) y el estado global mínimo necesario.

### 4.1 Estado en App

- **selectedRole**: `'admin'` o `'user'`. Se lee al inicio de `localStorage` (`selectedRole`). Si no hay valor, se muestra el selector de rol.
- **currentUser**: Objeto del usuario logueado (nombre, email, teléfono, rol, etc.). Se lee de `localStorage` (`currentUser`). Si no hay rol pero sí usuario guardado, igual se pide elegir rol primero.
- **currentPage**: `'salon' | 'estadisticas' | 'empleados'`. Indica qué “página” se muestra debajo del Navegador.
- **showAgregarProducto**: booleano para mostrar/ocultar el modal de Agregar Producto.
- **showGestor**: booleano para mostrar/ocultar el panel de Gestión de Productos.

### 4.2 Handlers

- **handleSelectRole(role)**: Guarda el rol en `localStorage` y en `selectedRole`.
- **handleBackToRole()**: Borra `selectedRole` del `localStorage` y pone `setSelectedRole(null)` para volver al selector de rol.
- **handleAuth(user)**: Recibe el usuario (nombre, email, etc.), le agrega el `role` actual, lo guarda en `localStorage` como `currentUser` y actualiza `currentUser` en estado.
- **handleLogout()**: Limpia `currentUser` y `selectedRole` del `localStorage` y del estado, y vuelve la página a `'salon'`.

### 4.3 Flujo de pantallas (render condicional)

1. **Si no hay `selectedRole`**  
   Se renderiza solo **RoleSelector** (pantalla para elegir Admin o Usuario).

2. **Si hay rol pero no hay `currentUser`**  
   Se renderiza **Auth** (login/registro según rol), con `onAuth`, `role` y `onBack` (volver al selector de rol).

3. **Si hay usuario logueado**  
   Se renderiza:
   - **BrowserRouter** (necesario para `useNavigate` en Navegador).
   - **Navegador**: barra superior con logo, iconos de secciones (Pedidos, Estadísticas, Empleados, Agregar productos si es admin), contacto/ayuda, Salir. Recibe `currentUser`, `onLogout`, `onPageChange`, `currentPage`, `onOpenAgregar` (abre el Gestor de Productos).
   - **Routes** con una sola **Route** `path="/"` cuyo `element` depende de `currentPage`:
     - `salon` → **Salon** + **Footer**
     - `estadisticas` → **Estadisticas** + **Footer**
     - `empleados` y `currentUser.role === 'admin'` → **Empleados** + **Footer**
     - `empleados` y usuario no admin → **Salon** + **Footer** (el usuario solo ve pedidos).
   - Si **showGestor** es true → **GestorProductos** (onClose, onOpenAgregar que cierra gestor y abre Agregar Producto).
   - Si **showAgregarProducto** es true → **AgregarProducto** (onClose, onProductAdded que cierra el modal).

Así, **todo el código que “decide” qué pantalla ver** está en `App.jsx`: no hay rutas por URL para cada sección, solo un `Route path="/"` y estado `currentPage`.

---

## 5. Selector de rol – `RoleSelector.jsx` / `RoleSelector.css`

- **Props**: `onSelectRole(role)` — función que recibe `'admin'` o `'user'`.
- **Qué hace**: Pantalla de bienvenida en dos columnas:
  - **Izquierda**: Logo “RestSoft”, título “Transformá tu negocio gastronómico con RestSoft”, y lista de características (gestión de mesas/delivery/mostrador, estadísticas, productos, seguimiento de pedidos). Estilo oscuro con gradiente.
  - **Derecha**: Título “Ingresá a tu cuenta”, dos botones:
    - **Administrador**: llama `onSelectRole('admin')`.
    - **Usuario**: llama `onSelectRole('user')`.
- **CSS**: Layout flex (en móvil columna), colores y espaciado para que la izquierda sea “hero” y la derecha el formulario de selección.

---

## 6. Autenticación – `Auth.jsx` / `Auth.css`

- **Props**: `onAuth(user)`, `role` (`'admin'` | `'user'`), `onBack()`.
- **Qué hace**:
  - **Modo admin**: pestañas Login / Registro.  
    - **Registro**: nombre, email, contraseña, teléfono (con selector de país), nombre del negocio. Valida y guarda en `localStorage` bajo la clave `users` (array). Luego llama `onAuth` con los datos del usuario (sin contraseña en el objeto que se guarda como `currentUser`).  
    - **Login**: email y contraseña; busca en `users`; si coincide, llama `onAuth` con ese usuario.  
    - Incluye flujo de “Olvidé contraseña” (genera código de 6 dígitos y lo muestra; no envía email real).
  - **Modo user**: solo Login. Busca en `localStorage` en la clave `employees` (lista de empleados creados por el admin). Si el email y contraseña coinciden, llama `onAuth` con ese empleado y `role: 'user'`.
- **Botón “Volver”**: llama `onBack()` para regresar al selector de rol.
- **CSS**: Fondo claro, card centrado, inputs y botones con estilos coherentes (azul para primarios).

---

## 7. Navegador (barra superior) – `Navegador.jsx` / `Navegador.css`

- **Props**: `currentUser`, `onLogout`, `onPageChange(page)`, `currentPage`, `onOpenAgregar`.
- **Qué hace**:
  - **Logo**: iconos Hamburger + Coffee y el nombre del negocio (`currentUser?.businessName` o “RestSoft”).
  - **Navegación desktop**: lista de botones que llaman `onPageChange`:
    - Pedidos (salon), Estadísticas, Empleados, Agregar productos (solo si `currentUser?.role === 'admin'`).
  - **Agregar productos**: botón que llama `onOpenAgregar()` (en App abre el Gestor de Productos).
  - **Derecha**: nombre y teléfono del usuario, botón de Ayuda/Contacto (desplegable con link a WhatsApp), botón Salir (llama `onLogout` y `navigate('/')`), y en móvil el botón del menú hamburguesa.
  - **Menú móvil**: al abrir, repite los mismos ítems de navegación en columna; al elegir uno se llama `onPageChange` y se cierra el menú.
- **CSS**: Header con gradiente oscuro, borde inferior teal, estilos para `.nav-li`, `.nav-li-active`, botones de contacto y logout. Media queries para ocultar nav desktop y mostrar menú móvil en pantallas pequeñas.

---

## 8. Salón (pedidos) – `Salon.jsx` / `Salon.css`

Es el **núcleo** de la app: mesas, delivery y mostrador.

### 8.1 Estado principal

- **products, loading, error**: productos cargados desde `GET http://localhost:8000/productos`; empleados desde `localStorage` (`employees`).
- **tablasCount, tables**: número de mesas (guardado en `localStorage` como `mesasCount`) y array de mesas. Cada mesa: `id`, `open`, `order` (ítems con producto_id, nombre, precio, quantity), `mozo`, `personas`, `occupied`, `lastOrder`, `currentPedidoId`, `paid`.
- **activeTableId**: mesa seleccionada; al elegir una se abre el panel lateral.
- **mode**: `'salon' | 'delivery' | 'mostrador'`.
- **showConfigMesas**: muestra el modal de ConfigurarMesas.
- **showProductsModal, productsModalContext**: si el modal de productos está abierto y en qué contexto (`'table' | 'delivery' | 'mostrador'`).
- **productComments**: comentarios por producto (para pedidos de mesa).
- **deliveryFormData / mostradorFormData**: datos del formulario (cliente, dirección, ítems, etc.).
- **deliveryOrders, mostradorOrders**: listas de pedidos obtenidas de `GET /pedidos` filtradas por `origen`.

### 8.2 Funciones importantes

- **createTables(count)**: genera un array de `count` mesas con estructura inicial.
- **handleUpdateTableCount(newCount)**: actualiza `mesasCount` en `localStorage`, recrea las mesas y cierra el modal de configuración.
- **openTable(tableId)**: marca la mesa como abierta y pone `activeTableId = tableId`.
- **closeSidebar()**: limpia `activeTableId` y cierra el modal de productos.
- **addProductToTable(product)**: agrega o incrementa el producto en la mesa activa.
- **addProductFromModal(product)**: según `productsModalContext`, agrega el producto a la mesa activa, a `deliveryFormData.order` o a `mostradorFormData.order`.
- **updateTableField(tableId, field, value)**: actualiza un campo de la mesa (ej. mozo, personas).
- **updateQuantity(tableId, productId, delta)**: sube o baja la cantidad de un ítem en la mesa.
- **sendOrderToBackend(tableId, { showInvoice })**:  
  - Arma el payload con `nombre_cliente`, `direccion`, `detalles` (producto_id, cantidad), `origen: 'salon'`, `mesa`, `mozo`, `personas`, `cargado_por`.  
  - Hace `POST http://localhost:8000/pedidos`.  
  - Si responde bien: actualiza la mesa (occupied, lastOrder, order vacío, currentPedidoId), cierra el panel y opcionalmente muestra modal de factura.
- Para **delivery** y **mostrador**: al “Enviar” se hace `POST /pedidos` con los datos del formulario y `origen: 'delivery'` o `'mostrador'`; luego se resetea el formulario y se recargan las listas de pedidos.

### 8.3 Interfaz

- **Selector de modo**: Salón / Delivery / Mostrador.
- **Salón**: grilla de mesas (table-card). Al hacer clic en una mesa se abre el panel lateral con: datos de la mesa (mozo, personas), lista del pedido, botones “Enviar pedido” y “Sacar la cuenta”, y botón “Abrir mesa” que abre el **modal de productos** a pantalla completa para agregar ítems.
- **Delivery / Mostrador**: lista de pedidos existentes + botón “Nuevo pedido”. Al crear uno nuevo aparece el panel con formulario (cliente, dirección o camarero, etc.), botón “Agregar productos” (abre el mismo modal de productos) y lista del pedido con botón Enviar.
- **Modal de productos**: overlay a pantalla completa con categorías (pizza, sandwich, wrap) y productos con precio y botón “+”. En contexto mesa se puede agregar comentario por producto.
- **ConfigurarMesas**: se abre desde un botón de configuración; usa el componente ConfigurarMesas.
- **Modales de factura / cuenta / QR**: muestran total, ítems y opcionalmente QR de pago (alias y URL de ejemplo).

### 8.4 CSS (Salon.css)

- Tema oscuro: fondos `#0f172a`, `#1e293b`, acentos teal `#0d9488`, texto claro.
- Estilos para `.salon-section`, `.tables-grid`, `.table-card`, `.salon-sidebar`, `.order-data-card`, `.delivery-inputs`, `.mostrador-inputs`, `.products-modal-overlay`, `.products-modal`, etc. Incluye estilos para el modal de productos a pantalla completa, botones, inputs y cards de pedidos delivery/mostrador.

---

## 9. Estadísticas – `Estadisticas.jsx` / `Estadisticas.css`

- **Estado**: `pedidos` (array de la API), `loading`, `error`, `filtro` (`'todos' | 'salon' | 'delivery' | 'mostrador'`).
- **useEffect**: hace `GET http://localhost:8000/pedidos` y guarda el resultado en `pedidos`.
- **pedidosFiltrados**: según `filtro`, filtra por `origen` o muestra todos.
- **Render**: título “Control de Pedidos”, botones de filtro (Todos, Mesas, Delivery, Mostrador) y lista de tarjetas por pedido mostrando: ID, origen, total, fechas, cliente, dirección, ítems. Usa íconos (Utensils, Truck, Coffee) según el origen.
- **CSS**: Fondo claro, cards blancas, bordes y colores para estados y títulos.

---

## 10. Empleados – `Empleados.jsx` / `Empleados.css`

- **Props**: `businessName` (nombre del negocio a mostrar).
- **Estado**: `employees` (array), `showForm` (mostrar/ocultar formulario), `newEmployee` (campos del formulario), `error`, `success`.
- **Persistencia**: empleados en `localStorage` bajo la clave `employees` (array de objetos con id, name, email, password, phone, createdAt).
- **handleAddEmployee**: valida nombre, email, contraseña (mínimo 6 caracteres), comprueba que el email no exista, agrega el empleado al array, guarda en `localStorage`, muestra mensaje de éxito y cierra el formulario.
- **handleDeleteEmployee(id)**: confirma y elimina el empleado del array y actualiza `localStorage`.
- **Render**: título “Gestión de Empleados” y nombre del negocio; botón “Agregar Empleado” que alterna el formulario; formulario con nombre, email, contraseña, teléfono y “Guardar”; lista de empleados con nombre, email, teléfono, fecha de alta y botón eliminar.
- **CSS**: Contenedor claro, cards y formulario con estilos similares al resto de la app (azul/verde para botones).

---

## 11. Configurar mesas – `ConfigurarMesas.jsx` / `ConfigurarMesas.css`

- **Props**: `currentTableCount`, `onConfirm(newCount)`, `onClose`.
- **Estado**: `cantidad` (número de mesas a configurar), `error`.
- **Validación**: entre 1 y 100 mesas; si no, muestra mensaje de error.
- **Render**: overlay y modal con título “Configurar Número de Mesas”, input numérico, texto de resumen (mesas actuales vs nuevas, advertencia si se reducen mesas) y botones Cancelar y Confirmar.
- **onConfirm**: App usa este valor para actualizar `mesasCount` en `localStorage` y en Salon para recrear las mesas.

---

## 12. Gestor de productos – `GestorProductos.jsx` / `GestorProductos.css`

- **Props**: `onClose`, `onOpenAgregar` (abre el modal de Agregar Producto).
- **Estado**: `products` (de la API), `loading`, `error`.
- **useEffect**: `GET http://localhost:8000/productos` y guarda en `products`.
- **Categorías**: se construyen a partir de una lista base (pizza, sandwich, wrap, bebida, postre) más las categorías que aparecen en los productos; se muestran todas expandidas.
- **Render**: overlay que **no tapa la barra superior** (top: 72px), panel a pantalla completa con:
  - Cabecera: título “Gestión de Productos”, subtítulo, botón “Agregar producto” (llama `onOpenAgregar`) y botón cerrar (llama `onClose`).
  - Cuerpo: por cada categoría, un bloque con título y cantidad de productos, y una grilla de tarjetas (nombre, descripción, precio, costo, icono con `getProductIcon`).
- **CSS**: Tema oscuro alineado con Salon; panel full viewport debajo del header; grid responsivo de productos.

---

## 13. Agregar producto – `AgregarProducto.jsx` / `AgregarProducto.css`

- **Props**: `onClose`, `onProductAdded()` (se llama al agregar con éxito; en App cierra el modal).
- **Estado**: `formData` (nombre, categoria, precio, costo, descripcion), `error`, `success`, `loading`.
- **Categorías**: pizza, sandwich, wrap, bebida, postre (select).
- **handleSubmit**: valida campos obligatorios y números; hace `POST http://localhost:8000/productos` con body JSON (nombre, categoria, precio, descripcion; el backend no tiene campo `costo` en el modelo Productos, pero el frontend puede enviarlo si en el futuro se agrega). Si la respuesta es OK, muestra éxito y tras 1.5 s llama `onProductAdded()`.
- **Render**: overlay y modal con formulario (inputs y select), mensajes de error/éxito y botones Cancelar y Guardar.
- **CSS**: Modal centrado, inputs y botones estilizados (azul para primario).

---

## 14. Footer – `Footer.jsx` / `Footer.css`

- Componente simple: un `<footer>` con clase `.footer` que muestra “© 2025 RestSoft. Todos los derechos reservados.”
- **CSS**: Fondo oscuro `#0f172a`, texto claro, padding y opcionalmente borde superior para separar del contenido.

---

## 15. Utilidad – `productIcons.jsx`

- **Función**: `getProductIcon(categoria, nombre, size)`.
- **Qué hace**: Devuelve un `<span>` con un emoji según la categoría (pizza 🍕, sandwich 🥪, wrap 🌯, bebida 🥤, postre 🍰) o, si no hay categoría, intenta inferirla por el `nombre`. Si no hay match, devuelve un emoji genérico 🍽️. El tamaño se controla con `fontSize` en estilo inline.
- **Uso**: En **Salon** (modal de productos) y en **GestorProductos** para mostrar un icono por producto sin depender de la imagen en la base de datos.

---

## 16. Cómo convertir este documento a PDF

Puedes usar cualquiera de estas opciones:

1. **VS Code / Cursor**: Instalar extensión “Markdown PDF” y, con este archivo abierto, clic derecho → “Markdown PDF: Export (pdf)”.
2. **Pandoc** (línea de comandos):  
   `pandoc DOCUMENTACION_PROYECTO.md -o DOCUMENTACION_PROYECTO.pdf`
3. **Sitios web**: Subir el `.md` a un conversor online de Markdown a PDF.
4. **Impresión**: Abrir el `.md` en un visor que renderice Markdown (p. ej. vista previa de GitHub o extensión de Markdown) y usar “Imprimir” → “Guardar como PDF”.

Con esto tienes **todo el proyecto explicado** en un solo documento para estudiar y exponer; al exportarlo a PDF podrás usarlo como material de apoyo o entrega.
