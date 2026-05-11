# 🚌 Sistema Web INTIWATANA

> Sistema de gestión de venta de pasajes, registro de encomiendas y programación de viajes para **E.T. INTIWATANA S.R.L.** — Ayacucho, Perú.

---

## 📋 Tabla de contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos previos](#requisitos-previos)
- [Configuración del backend](#configuración-del-backend)
- [Configuración del frontend](#configuración-del-frontend)
- [Base de datos](#base-de-datos)
- [Variables de entorno](#variables-de-entorno)
- [Usuarios por defecto](#usuarios-por-defecto)
- [Endpoints principales de la API](#endpoints-principales-de-la-api)
- [Módulos del sistema](#módulos-del-sistema)
- [Ramas del repositorio](#ramas-del-repositorio)

---

## Descripción

INTIWATANA es un sistema web full-stack desarrollado para digitalizar y automatizar los procesos operativos de la empresa de transportes E.T. INTIWATANA S.R.L. Reemplaza el registro manual en cuadernos y talonarios físicos por una plataforma centralizada con roles diferenciados, control de asientos en tiempo real, tracking de encomiendas y generación de reportes.

**Problemas que resuelve:**
- Eliminación del registro manual de pasajes (reducción de ~12 min a <3 min por venta)
- Trazabilidad completa de encomiendas mediante código de guía único
- Control de disponibilidad de asientos en tiempo real sin duplicaciones
- Reportes de ventas e ingresos accesibles desde el dashboard administrativo

---

## Tecnologías

### Backend
| Tecnología | Versión |
|---|---|
| Java | 17 |
| Spring Boot | 3.3.0 |
| Spring Security + JWT | — |
| Spring Data JPA / Hibernate | — |
| PostgreSQL | 14+ |
| Lombok | — |
| Maven | — |

### Frontend
| Tecnología | Versión |
|---|---|
| React | 19.x |
| Vite | 8.x |
| React Router DOM | 6.x |
| Lucide React | 1.x |

---

## Estructura del repositorio

```
transporte-web/
├── backend/
│   └── bus-system/                  # Proyecto Spring Boot (Maven)
│       ├── src/main/java/com/transporte/sistema/
│       │   ├── config/              # SecurityConfig, JacksonConfig, DataInitializer
│       │   ├── controller/          # AuthController, ViajeController, BoletoController,
│       │   │                        # EncomiendaController, BusController, RutaController,
│       │   │                        # ClienteController, PagoController, AsientoController,
│       │   │                        # UsuarioController, SucursalController, RolController
│       │   ├── dto/
│       │   │   ├── request/         # DTOs de entrada (LoginRequest, BoletoRequest, ...)
│       │   │   └── response/        # DTOs de salida (BoletoResponse, ViajeResponse, ...)
│       │   ├── entity/              # Entidades JPA: Viaje, Boleto, Encomienda, Bus,
│       │   │                        # Ruta, Cliente, Asiento, Pago, Usuario, Sucursal
│       │   ├── enums/               # EstadoAsiento, EstadoBoleto, EstadoEncomienda,
│       │   │                        # EstadoViaje, MetodoPago, RolNombre, TipoBus, ...
│       │   ├── exception/           # GlobalExceptionHandler, excepciones personalizadas
│       │   ├── repository/          # Interfaces JpaRepository por entidad
│       │   ├── security/            # JwtUtil, JwtAuthenticationFilter, UserDetailsServiceImpl
│       │   └── service/             # Interfaces e implementaciones de servicio
│       ├── src/main/resources/
│       │   ├── application.yml      # Configuración principal
│       │   └── schema.sql           # Script DDL completo de la BD
│       ├── .env.example             # Plantilla de variables de entorno
│       └── pom.xml
│
├── frontend/
│   └── Web-Intiwatana/              # Proyecto React + Vite
│       ├── src/
│       │   ├── components/          # AdminDashboard, ClienteDashboard, ChoferDashboard,
│       │   │                        # PasajesPage, BoletoVirtual, Login, CrudUsuarios,
│       │   │                        # CrudAsientos, LogoSVG
│       │   ├── context/
│       │   │   └── AuthContext.jsx  # Gestión global de autenticación JWT
│       │   ├── App.jsx              # Rutas principales y datos de destinos
│       │   └── main.jsx
│       ├── public/assets/img/rutas/ # Imágenes de destinos (Vilcas, Accomarca, ...)
│       ├── package.json
│       └── vite.config.js
│
├── postman/                         # Colección Postman para pruebas de la API
└── logs/                            # Logs de la aplicación (generados en runtime)
```

---

## Requisitos previos

- **Java 17** o superior (`java -version`)
- **Maven 3.8+** (`mvn -version`)
- **Node.js 18+** y **npm 9+** (`node -v` / `npm -v`)
- **PostgreSQL 14+** corriendo localmente
- Git

---

## Configuración del backend

### 1. Clonar el repositorio

```bash
git clone https://github.com/Leonel785/transporte-web.git
cd transporte-web
git checkout develop
```

### 2. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE transporte_bd;
```

### 3. Configurar las variables de entorno

```bash
cd backend/bus-system
cp .env.example .env
```

Editar `.env` con los valores reales (ver sección [Variables de entorno](#variables-de-entorno)).

### 4. Ejecutar el backend

```bash
cd backend/bus-system
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.

> Al iniciar por primera vez, `DataInitializer` crea automáticamente los roles, la sucursal matriz y los usuarios por defecto. El esquema de BD se gestiona con `ddl-auto: update`.

---

## Configuración del frontend

```bash
cd frontend/Web-Intiwatana
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

> El frontend apunta al backend en `http://localhost:8080` por defecto. Si cambiás el puerto del backend, actualizá la URL base en el `ApiClient` / `AuthContext`.

---

## Base de datos

El archivo `backend/bus-system/src/main/resources/schema.sql` contiene el DDL completo. Las tablas principales son:

| Tabla | Descripción |
|---|---|
| `roles` | Roles del sistema (ADMIN, CAJERO, CHOFER, CLIENTE) |
| `sucursales` | Terminales y agencias de la empresa |
| `usuarios` | Personal del sistema con rol y sucursal asignados |
| `clientes` | Pasajeros y remitentes de encomiendas |
| `buses` | Flota de unidades con capacidad y tipo |
| `rutas` | Origen, destino, distancia y precio base |
| `viajes` | Programación de servicios (bus + ruta + fecha + hora) |
| `asientos` | Asientos por viaje con estado (DISPONIBLE/OCUPADO/RESERVADO) |
| `boletos` | Pasajes vendidos con número correlativo `BOL-XXXXXXXX` |
| `encomiendas` | Paquetes registrados con código de guía `GUI-XXXXXXXX` |
| `movimientos_encomienda` | Historial de estados del paquete (tracking) |
| `pagos` | Registro de transacciones asociadas a boletos/encomiendas |

---

## Variables de entorno

Crear el archivo `.env` en `backend/bus-system/` a partir de `.env.example`:

```env
# Servidor
SERVER_PORT=8080

# Base de datos
DB_URL=jdbc:postgresql://localhost:5432/transporte_bd
DB_USERNAME=postgres
DB_PASSWORD=TU_PASSWORD_AQUI

# JPA — usar 'validate' en producción
JPA_DDL_AUTO=update

# JWT — generar secret seguro para producción:
# python3 -c "import base64,secrets;print(base64.b64encode(secrets.token_bytes(32)).decode())"
JWT_SECRET=GENERA_UN_SECRET_SEGURO_AQUI
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_MS=604800000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> ⚠️ **Nunca subas el `.env` real al repositorio.** Está incluido en `.gitignore`.

---

## Usuarios por defecto

Creados automáticamente por `DataInitializer` al primer arranque:

| Usuario | Contraseña | Rol | Acceso |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | Panel completo: usuarios, rutas, buses, viajes, reportes |
| `cajero1` | `cajero123` | CAJERO | Venta de pasajes, registro de encomiendas |
| `chofer1` | `chofer123` | CHOFER | Dashboard de viajes asignados |

> ⚠️ **Cambiar las contraseñas antes de desplegar en producción.**

---

## Endpoints principales de la API

Base URL: `http://localhost:8080/api`

### Autenticación
```
POST   /api/auth/login              # Obtener token JWT
POST   /api/auth/register           # Registrar cliente
```

### Viajes
```
GET    /api/viajes                  # Listar viajes disponibles
GET    /api/viajes?origen=X&destino=Y&fecha=YYYY-MM-DD
POST   /api/viajes                  # Programar viaje (ADMIN)
PUT    /api/viajes/{id}             # Actualizar viaje
DELETE /api/viajes/{id}             # Eliminar viaje
```

### Boletos (Pasajes)
```
POST   /api/boletos                 # Registrar venta de pasaje
GET    /api/boletos/viaje/{id}      # Boletos de un viaje
GET    /api/boletos/{id}            # Detalle de un boleto
```

### Asientos
```
GET    /api/asientos/viaje/{id}     # Estado de asientos por viaje
PUT    /api/asientos/{id}           # Actualizar estado de asiento
```

### Encomiendas
```
POST   /api/encomiendas             # Registrar encomienda
GET    /api/encomiendas/tracking/{codigo}  # Consulta pública por código GUI-XXXXXXXX
PUT    /api/encomiendas/{id}/estado # Actualizar estado (CAJERO/ADMIN)
GET    /api/encomiendas             # Listar encomiendas (ADMIN/CAJERO)
```

### Catálogo
```
GET/POST/PUT/DELETE  /api/rutas
GET/POST/PUT/DELETE  /api/buses
GET/POST/PUT/DELETE  /api/clientes
GET/POST/PUT/DELETE  /api/usuarios
GET/POST/PUT/DELETE  /api/sucursales
```

> La colección Postman completa está en `postman/collections/`.

---

## Módulos del sistema

### 🔐 Autenticación
Login con JWT. Token incluido en cabecera `Authorization: Bearer <token>`. Expiración: 24 horas. El endpoint de tracking de encomiendas es público (sin token).

### 🎫 Venta de Pasajes
Selección de ruta → lista de viajes disponibles → mapa visual de asientos → registro del cliente → generación del boleto con código `BOL-XXXXXXXX`. Operación atómica: registra el boleto y actualiza el asiento en la misma transacción.

### 📦 Encomiendas
Registro con datos de remitente y destinatario → generación automática de código `GUI-XXXXXXXX` → seguimiento de estados: `RECIBIDO → CARGADO_EN_BUS → EN_TRANSITO → LLEGADO_A_DESTINO → ENTREGADO`.

### 🗺️ Programación de Viajes
El administrador asigna ruta + bus + fecha + hora. El sistema valida que el bus no tenga conflicto de horario y genera los asientos automáticamente según la capacidad del bus.

### 📊 Dashboard Administrativo
Métricas de ventas, listado de boletos y encomiendas, gestión de usuarios, rutas y buses. Accesible solo con rol `ADMIN`.

### 🌐 Landing Page Pública
Página de inicio con las rutas disponibles (Vilcas Huamán, Accomarca, Huarcas, Andabamba, Chiribamba, Manallasacc, Pongococha, Vischongo), horarios, precios y terminales. Consulta de encomiendas por código de guía sin necesidad de cuenta.

---

## Ramas del repositorio

| Rama | Propósito |
|---|---|
| `main` | Código estable / producción |
| `develop` | Rama de desarrollo activa (rama por defecto) |

**Historial de commits principales en `develop`:**
- `login implementado en el backend`
- `login en frontend`
- `funcional login frontend`
- `admins panel`
- `funcionalidad de crud admin`
- `todo mejorado`
- `encomiendas y reserva de buses implementadas`

---

## Autor

**Leonel Campos Huamán** — [@Leonel785](https://github.com/Leonel785)

Proyecto desarrollado para **E.T. INTIWATANA S.R.L.** como parte del curso de Gestión de Proyectos en TI — Ingeniería de Sistemas de Información, Escuela Superior La Pontificia, Ayacucho 2026.
