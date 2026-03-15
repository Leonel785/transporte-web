-- =============================================================================
-- SISTEMA DE TRANSPORTE INTERPROVINCIAL
-- Base de datos: PostgreSQL 14+
-- Esquema:       public
-- Descripción:   DDL completo + datos iniciales (roles, admin, sucursal)
-- =============================================================================

-- Crear la base de datos (ejecutar como superusuario si no existe)
-- CREATE DATABASE transporte_db ENCODING 'UTF8' LC_COLLATE='es_PE.UTF-8' LC_CTYPE='es_PE.UTF-8' TEMPLATE=template0;
-- \c transporte_db

-- Extensión para UUID (opcional, por si se quiere migrar PKs a UUID en el futuro)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- LIMPIAR ESQUEMA (útil para re-ejecutar en desarrollo)
-- =============================================================================
DROP TABLE IF EXISTS movimientos_encomienda  CASCADE;
DROP TABLE IF EXISTS encomiendas             CASCADE;
DROP TABLE IF EXISTS boletos                 CASCADE;
DROP TABLE IF EXISTS asientos                CASCADE;
DROP TABLE IF EXISTS viajes                  CASCADE;
DROP TABLE IF EXISTS rutas                   CASCADE;
DROP TABLE IF EXISTS buses                   CASCADE;
DROP TABLE IF EXISTS pagos                   CASCADE;
DROP TABLE IF EXISTS clientes                CASCADE;
DROP TABLE IF EXISTS usuarios                CASCADE;
DROP TABLE IF EXISTS sucursales              CASCADE;
DROP TABLE IF EXISTS roles                   CASCADE;

-- =============================================================================
-- 1. ROLES
-- =============================================================================
CREATE TABLE roles (
    id          BIGSERIAL       PRIMARY KEY,
    nombre      VARCHAR(30)     NOT NULL UNIQUE,    -- ROLE_ADMIN | ROLE_CAJERO | ROLE_CHOFER | ROLE_CLIENTE
    descripcion VARCHAR(200)
);

COMMENT ON TABLE  roles        IS 'Roles de acceso del sistema';
COMMENT ON COLUMN roles.nombre IS 'Debe coincidir con el enum RolNombre del backend';

-- =============================================================================
-- 2. SUCURSALES / TERMINALES
-- =============================================================================
CREATE TABLE sucursales (
    id           BIGSERIAL       PRIMARY KEY,
    codigo       VARCHAR(20)     NOT NULL UNIQUE,
    nombre       VARCHAR(150)    NOT NULL,
    direccion    VARCHAR(300),
    ciudad       VARCHAR(100)    NOT NULL,
    provincia    VARCHAR(100),
    departamento VARCHAR(100)    NOT NULL,
    telefono     VARCHAR(20),
    email        VARCHAR(150),
    es_terminal  BOOLEAN         NOT NULL DEFAULT FALSE,
    latitud      DOUBLE PRECISION,
    longitud     DOUBLE PRECISION,
    -- Auditoría (BaseEntity)
    created_at   TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    deleted_at   TIMESTAMP,
    activo       BOOLEAN         NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE  sucursales             IS 'Terminales y puntos de venta/recojo';
COMMENT ON COLUMN sucursales.es_terminal IS 'TRUE = terminal principal, FALSE = agencia/punto de venta';

-- =============================================================================
-- 3. USUARIOS (empleados y clientes con portal)
-- =============================================================================
CREATE TABLE usuarios (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(80)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombres       VARCHAR(150) NOT NULL,
    apellidos     VARCHAR(150),
    email         VARCHAR(150) UNIQUE,
    telefono      VARCHAR(20),
    rol_id        BIGINT       NOT NULL REFERENCES roles(id),
    sucursal_id   BIGINT       REFERENCES sucursales(id),
    dni_ruc       VARCHAR(15),
    primer_login  BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Auditoría
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_usuarios_username   ON usuarios(username);
CREATE INDEX idx_usuarios_rol_id     ON usuarios(rol_id);
CREATE INDEX idx_usuarios_sucursal   ON usuarios(sucursal_id);

COMMENT ON COLUMN usuarios.password_hash IS 'BCrypt hash de la contraseña (strength=12)';
COMMENT ON COLUMN usuarios.primer_login  IS 'TRUE = debe cambiar contraseña en el primer acceso';

-- =============================================================================
-- 4. CLIENTES (personas y empresas)
-- =============================================================================
CREATE TABLE clientes (
    id           BIGSERIAL    PRIMARY KEY,
    dni_ruc      VARCHAR(15)  NOT NULL UNIQUE,   -- 8 dígitos DNI o 11 dígitos RUC
    nombres      VARCHAR(150),                    -- Solo PERSONA
    apellidos    VARCHAR(150),                    -- Solo PERSONA
    razon_social VARCHAR(250),                    -- Solo EMPRESA
    telefono     VARCHAR(20),
    email        VARCHAR(150),
    direccion    VARCHAR(300),
    distrito     VARCHAR(100),
    ciudad       VARCHAR(100),
    tipo_cliente VARCHAR(20)  NOT NULL CHECK (tipo_cliente IN ('PERSONA','EMPRESA')),
    usuario_id   BIGINT       REFERENCES usuarios(id),
    -- Auditoría
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    deleted_at   TIMESTAMP,
    activo       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_cliente_tipo CHECK (
        (tipo_cliente = 'PERSONA' AND nombres IS NOT NULL) OR
        (tipo_cliente = 'EMPRESA' AND razon_social IS NOT NULL)
    )
);

CREATE INDEX idx_clientes_dni_ruc    ON clientes(dni_ruc);
CREATE INDEX idx_clientes_tipo       ON clientes(tipo_cliente);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);

COMMENT ON COLUMN clientes.usuario_id IS 'Vinculación opcional al portal self-service';

-- =============================================================================
-- 5. BUSES / VEHÍCULOS
-- =============================================================================
CREATE TABLE buses (
    id                 BIGSERIAL    PRIMARY KEY,
    placa              VARCHAR(10)  NOT NULL UNIQUE,
    marca              VARCHAR(80)  NOT NULL,
    modelo             VARCHAR(80),
    anio_fabricacion   INTEGER,
    capacidad_asientos INTEGER      NOT NULL CHECK (capacidad_asientos > 0),
    num_pisos          INTEGER      NOT NULL DEFAULT 1 CHECK (num_pisos IN (1,2)),
    tipo               VARCHAR(20)  NOT NULL CHECK (tipo IN ('ECONOMICO','SEMI_CAMA','CAMA','CAMA_SUITE')),
    foto_url           VARCHAR(500),
    observaciones      VARCHAR(500),
    -- Auditoría
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    deleted_at         TIMESTAMP,
    activo             BOOLEAN      NOT NULL DEFAULT TRUE
);

COMMENT ON COLUMN buses.tipo IS 'Categoría de servicio: ECONOMICO | SEMI_CAMA | CAMA | CAMA_SUITE';

-- =============================================================================
-- 6. RUTAS (fijas, entre dos sucursales)
-- =============================================================================
CREATE TABLE rutas (
    id                      BIGSERIAL       PRIMARY KEY,
    codigo                  VARCHAR(30)     NOT NULL UNIQUE,
    sucursal_origen_id      BIGINT          NOT NULL REFERENCES sucursales(id),
    sucursal_destino_id     BIGINT          NOT NULL REFERENCES sucursales(id),
    distancia_km            NUMERIC(8,2),
    duracion_horas_estimada NUMERIC(4,1),
    precio_base             NUMERIC(10,2),
    descripcion             VARCHAR(300),
    -- Auditoría
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP,
    deleted_at              TIMESTAMP,
    activo                  BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_ruta_origen_destino CHECK (sucursal_origen_id <> sucursal_destino_id)
);

CREATE INDEX idx_rutas_origen_destino ON rutas(sucursal_origen_id, sucursal_destino_id);

-- =============================================================================
-- 7. PAGOS
-- =============================================================================
CREATE TABLE pagos (
    id          BIGSERIAL       PRIMARY KEY,
    monto       NUMERIC(10,2)   NOT NULL CHECK (monto > 0),
    fecha_pago  TIMESTAMP       NOT NULL,
    metodo      VARCHAR(30)     NOT NULL CHECK (metodo IN (
                    'EFECTIVO','YAPE','PLIN','TARJETA_CREDITO',
                    'TARJETA_DEBITO','TRANSFERENCIA','CONTRA_ENTREGA')),
    estado      VARCHAR(20)     NOT NULL DEFAULT 'COMPLETADO'
                    CHECK (estado IN ('PENDIENTE','COMPLETADO','FALLIDO','REEMBOLSADO')),
    referencia  VARCHAR(200),   -- Nro operación Yape/voucher tarjeta
    cajero_id   BIGINT          REFERENCES usuarios(id),
    observacion VARCHAR(300),
    -- Auditoría
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    activo      BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_pagos_cajero_id  ON pagos(cajero_id);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);

-- =============================================================================
-- 8. VIAJES (instancia de ruta con fecha, bus y chofer)
-- =============================================================================
CREATE TABLE viajes (
    id                          BIGSERIAL       PRIMARY KEY,
    ruta_id                     BIGINT          NOT NULL REFERENCES rutas(id),
    bus_id                      BIGINT          NOT NULL REFERENCES buses(id),
    chofer_id                   BIGINT          REFERENCES usuarios(id),
    fecha_hora_salida           TIMESTAMP       NOT NULL,
    fecha_hora_llegada_estimada TIMESTAMP,
    fecha_hora_llegada_real     TIMESTAMP,
    precio_adulto               NUMERIC(10,2)   NOT NULL CHECK (precio_adulto > 0),
    precio_nino                 NUMERIC(10,2),
    estado                      VARCHAR(20)     NOT NULL DEFAULT 'PROGRAMADO'
                                    CHECK (estado IN ('PROGRAMADO','EN_CURSO','FINALIZADO','CANCELADO')),
    observaciones               VARCHAR(500),
    -- Auditoría
    created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP,
    deleted_at                  TIMESTAMP,
    activo                      BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_viajes_ruta_id          ON viajes(ruta_id);
CREATE INDEX idx_viajes_bus_id           ON viajes(bus_id);
CREATE INDEX idx_viajes_chofer_id        ON viajes(chofer_id);
CREATE INDEX idx_viajes_fecha_salida     ON viajes(fecha_hora_salida);
CREATE INDEX idx_viajes_estado           ON viajes(estado);
-- Índice para búsqueda de viajes disponibles (query más frecuente)
CREATE INDEX idx_viajes_busqueda         ON viajes(ruta_id, estado, fecha_hora_salida)
    WHERE activo = TRUE AND estado = 'PROGRAMADO';

-- =============================================================================
-- 9. ASIENTOS (generados automáticamente al crear un viaje)
-- =============================================================================
CREATE TABLE asientos (
    id              BIGSERIAL   PRIMARY KEY,
    viaje_id        BIGINT      NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
    numero_asiento  VARCHAR(10) NOT NULL,
    fila            INTEGER,
    columna         INTEGER,
    piso            INTEGER     NOT NULL DEFAULT 1 CHECK (piso IN (1,2)),
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('VENTANA','PASILLO','CAMA_DOBLE')),
    estado          VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
                        CHECK (estado IN ('DISPONIBLE','RESERVADO','VENDIDO','BLOQUEADO')),
    -- Auditoría
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_asiento_viaje_numero UNIQUE (viaje_id, numero_asiento)
);

CREATE INDEX idx_asientos_viaje_id ON asientos(viaje_id);
CREATE INDEX idx_asientos_estado   ON asientos(viaje_id, estado);

-- =============================================================================
-- 10. BOLETOS (pasajes vendidos)
-- =============================================================================
CREATE TABLE boletos (
    id              BIGSERIAL       PRIMARY KEY,
    numero_boleto   VARCHAR(30)     NOT NULL UNIQUE,   -- BOL-YYYYMMDD-000001
    viaje_id        BIGINT          NOT NULL REFERENCES viajes(id),
    asiento_id      BIGINT          NOT NULL UNIQUE REFERENCES asientos(id),  -- 1:1
    cliente_id      BIGINT          NOT NULL REFERENCES clientes(id),
    precio_pagado   NUMERIC(10,2)   NOT NULL CHECK (precio_pagado > 0),
    estado          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVO'
                        CHECK (estado IN ('ACTIVO','USADO','CANCELADO','REEMBOLSADO')),
    codigo_qr       VARCHAR(500),
    qr_imagen_url   VARCHAR(500),
    pago_id         BIGINT          UNIQUE REFERENCES pagos(id),
    cajero_id       BIGINT          REFERENCES usuarios(id),
    fecha_hora_uso  TIMESTAMP,
    observaciones   VARCHAR(300),
    -- Auditoría
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_boletos_viaje_id    ON boletos(viaje_id);
CREATE INDEX idx_boletos_cliente_id  ON boletos(cliente_id);
CREATE INDEX idx_boletos_numero      ON boletos(numero_boleto);
CREATE INDEX idx_boletos_estado      ON boletos(estado);

COMMENT ON COLUMN boletos.asiento_id IS 'UNIQUE: un asiento solo puede tener un boleto activo';
COMMENT ON COLUMN boletos.codigo_qr  IS 'Igual al numero_boleto; se valida en el abordaje';

-- =============================================================================
-- 11. ENCOMIENDAS (paquetes enviados por los buses)
-- =============================================================================
CREATE TABLE encomiendas (
    id                   BIGSERIAL       PRIMARY KEY,
    numero_guia          VARCHAR(30)     NOT NULL UNIQUE,  -- GUI-YYYYMMDD-000001
    remitente_id         BIGINT          NOT NULL REFERENCES clientes(id),
    destinatario_id      BIGINT          NOT NULL REFERENCES clientes(id),
    sucursal_origen_id   BIGINT          NOT NULL REFERENCES sucursales(id),
    sucursal_destino_id  BIGINT          NOT NULL REFERENCES sucursales(id),
    viaje_id             BIGINT          REFERENCES viajes(id),
    descripcion_contenido VARCHAR(300)   NOT NULL,
    peso_kg              NUMERIC(8,3)    NOT NULL CHECK (peso_kg > 0),
    volumen_m3           NUMERIC(8,4),
    valor_declarado      NUMERIC(10,2)   DEFAULT 0,
    costo                NUMERIC(10,2)   NOT NULL CHECK (costo >= 0),
    metodo_pago          VARCHAR(30)     NOT NULL CHECK (metodo_pago IN (
                             'EFECTIVO','YAPE','PLIN','TARJETA_CREDITO',
                             'TARJETA_DEBITO','TRANSFERENCIA','CONTRA_ENTREGA')),
    estado               VARCHAR(30)     NOT NULL DEFAULT 'RECIBIDO'
                             CHECK (estado IN (
                                 'RECIBIDO','EN_ALMACEN','EN_TRANSITO',
                                 'EN_DESTINO','LISTO_ENTREGA','ENTREGADO',
                                 'DEVUELTO','PERDIDO')),
    pago_id              BIGINT          UNIQUE REFERENCES pagos(id),
    cajero_registro_id   BIGINT          REFERENCES usuarios(id),
    cajero_entrega_id    BIGINT          REFERENCES usuarios(id),
    observaciones        VARCHAR(500),
    codigo_qr            VARCHAR(500),
    -- Auditoría
    created_at           TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP,
    deleted_at           TIMESTAMP,
    activo               BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_encomienda_origen_destino CHECK (sucursal_origen_id <> sucursal_destino_id),
    CONSTRAINT chk_encomienda_remitente      CHECK (remitente_id <> destinatario_id)
);

CREATE INDEX idx_encomiendas_numero_guia  ON encomiendas(numero_guia);
CREATE INDEX idx_encomiendas_remitente    ON encomiendas(remitente_id);
CREATE INDEX idx_encomiendas_destinatario ON encomiendas(destinatario_id);
CREATE INDEX idx_encomiendas_estado       ON encomiendas(estado);
CREATE INDEX idx_encomiendas_sucursal_ori ON encomiendas(sucursal_origen_id);
CREATE INDEX idx_encomiendas_viaje        ON encomiendas(viaje_id);

-- =============================================================================
-- 12. MOVIMIENTOS DE ENCOMIENDA (tracking inmutable)
-- =============================================================================
CREATE TABLE movimientos_encomienda (
    id                    BIGSERIAL   PRIMARY KEY,
    encomienda_id         BIGINT      NOT NULL REFERENCES encomiendas(id) ON DELETE CASCADE,
    fecha_hora            TIMESTAMP   NOT NULL DEFAULT NOW(),
    sucursal_actual_id    BIGINT      REFERENCES sucursales(id),  -- NULL = en tránsito
    estado_anterior       VARCHAR(30) CHECK (estado_anterior IN (
                              'RECIBIDO','EN_ALMACEN','EN_TRANSITO','EN_DESTINO',
                              'LISTO_ENTREGA','ENTREGADO','DEVUELTO','PERDIDO')),
    estado_nuevo          VARCHAR(30) NOT NULL CHECK (estado_nuevo IN (
                              'RECIBIDO','EN_ALMACEN','EN_TRANSITO','EN_DESTINO',
                              'LISTO_ENTREGA','ENTREGADO','DEVUELTO','PERDIDO')),
    observacion           VARCHAR(500),
    usuario_responsable_id BIGINT     REFERENCES usuarios(id)
);

CREATE INDEX idx_movimientos_encomienda_id ON movimientos_encomienda(encomienda_id);
CREATE INDEX idx_movimientos_fecha_hora    ON movimientos_encomienda(fecha_hora);

COMMENT ON TABLE movimientos_encomienda IS 'Registro inmutable de tracking. NO tiene soft delete.';

-- =============================================================================
-- DATOS INICIALES
-- =============================================================================

-- Roles del sistema (deben coincidir con el enum RolNombre del backend)
INSERT INTO roles (nombre, descripcion) VALUES
    ('ROLE_ADMIN',   'Administrador del sistema - acceso total'),
    ('ROLE_CAJERO',  'Cajero de sucursal - vende boletos y registra encomiendas'),
    ('ROLE_CHOFER',  'Chofer de bus - consulta viajes y escanea boletos'),
    ('ROLE_CLIENTE', 'Cliente portal - consulta sus boletos y encomiendas');

-- Sucursal matriz
INSERT INTO sucursales (codigo, nombre, ciudad, departamento, es_terminal, activo, created_at) VALUES
    ('MATRIZ', 'Terminal Principal - Lima', 'Lima', 'Lima', TRUE, TRUE, NOW());

-- Usuario administrador inicial
-- Password: admin123  (BCrypt hash con strength=12)
INSERT INTO usuarios (
    username, password_hash, nombres, apellidos, email,
    rol_id, sucursal_id, primer_login, activo, created_at
) VALUES (
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqnXBbNg.XVvXPF0U.GMo7HVKK',
    'Administrador', 'Sistema', 'admin@transporte.com',
    (SELECT id FROM roles WHERE nombre = 'ROLE_ADMIN'),
    (SELECT id FROM sucursales WHERE codigo = 'MATRIZ'),
    FALSE, TRUE, NOW()
);

-- Sucursales de ejemplo (Peru)
INSERT INTO sucursales (codigo, nombre, ciudad, provincia, departamento, es_terminal, activo, created_at) VALUES
    ('LIM-01',  'Terminal Javier Prado',    'Lima',     'Lima',       'Lima',       TRUE,  TRUE, NOW()),
    ('AYA-01',  'Terminal Ayacucho',        'Ayacucho', 'Huamanga',   'Ayacucho',   TRUE,  TRUE, NOW()),
    ('CUS-01',  'Terminal Cusco',           'Cusco',    'Cusco',      'Cusco',      TRUE,  TRUE, NOW()),
    ('HUC-01',  'Terminal Huancayo',        'Huancayo', 'Huancayo',   'Junin',      TRUE,  TRUE, NOW()),
    ('ICA-01',  'Terminal Ica',             'Ica',      'Ica',        'Ica',        TRUE,  TRUE, NOW()),
    ('ARE-01',  'Terminal Arequipa',        'Arequipa', 'Arequipa',   'Arequipa',   TRUE,  TRUE, NOW()),
    ('PIU-01',  'Terminal Piura',           'Piura',    'Piura',      'Piura',      TRUE,  TRUE, NOW()),
    ('TRU-01',  'Terminal Trujillo',        'Trujillo', 'Trujillo',   'La Libertad',TRUE,  TRUE, NOW());

-- Buses de ejemplo
INSERT INTO buses (placa, marca, modelo, anio_fabricacion, capacidad_asientos, num_pisos, tipo, activo, created_at) VALUES
    ('ABC-123', 'Scania',  'K410',  2022, 44, 1, 'SEMI_CAMA',  TRUE, NOW()),
    ('DEF-456', 'Volvo',   'B13R',  2021, 44, 1, 'CAMA',       TRUE, NOW()),
    ('GHI-789', 'Scania',  'K360',  2023, 60, 2, 'ECONOMICO',  TRUE, NOW()),
    ('JKL-012', 'Mercedes','O500',  2020, 40, 1, 'CAMA_SUITE', TRUE, NOW()),
    ('MNO-345', 'Volvo',   'B420R', 2022, 44, 1, 'CAMA',       TRUE, NOW());

-- Rutas de ejemplo
INSERT INTO rutas (codigo, sucursal_origen_id, sucursal_destino_id, distancia_km, duracion_horas_estimada, precio_base, activo, created_at)
SELECT
    'LIM-AYA-01',
    (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
    (SELECT id FROM sucursales WHERE codigo = 'AYA-01'),
    560.00, 9.0, 45.00, TRUE, NOW()
UNION ALL SELECT
    'LIM-CUS-01',
    (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
    (SELECT id FROM sucursales WHERE codigo = 'CUS-01'),
    1160.00, 22.0, 90.00, TRUE, NOW()
UNION ALL SELECT
    'LIM-HUC-01',
    (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
    (SELECT id FROM sucursales WHERE codigo = 'HUC-01'),
    300.00, 7.0, 35.00, TRUE, NOW()
UNION ALL SELECT
    'LIM-ARE-01',
    (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
    (SELECT id FROM sucursales WHERE codigo = 'ARE-01'),
    1030.00, 16.0, 75.00, TRUE, NOW()
UNION ALL SELECT
    'LIM-ICA-01',
    (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
    (SELECT id FROM sucursales WHERE codigo = 'ICA-01'),
    300.00, 4.5, 30.00, TRUE, NOW()
UNION ALL SELECT
    'AYA-CUS-01',
    (SELECT id FROM sucursales WHERE codigo = 'AYA-01'),
    (SELECT id FROM sucursales WHERE codigo = 'CUS-01'),
    620.00, 12.0, 55.00, TRUE, NOW();

-- Usuarios de ejemplo (cajero y chofer)
INSERT INTO usuarios (username, password_hash, nombres, apellidos, email, rol_id, sucursal_id, dni_ruc, primer_login, activo, created_at)
VALUES
    ('cajero01',
     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqnXBbNg.XVvXPF0U.GMo7HVKK',
     'María', 'García López', 'cajero01@transporte.com',
     (SELECT id FROM roles WHERE nombre = 'ROLE_CAJERO'),
     (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
     '45678901', TRUE, TRUE, NOW()),
    ('chofer01',
     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqnXBbNg.XVvXPF0U.GMo7HVKK',
     'Carlos', 'Quispe Mamani', 'chofer01@transporte.com',
     (SELECT id FROM roles WHERE nombre = 'ROLE_CHOFER'),
     (SELECT id FROM sucursales WHERE codigo = 'LIM-01'),
     '32156789', TRUE, TRUE, NOW());

-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

-- Vista: disponibilidad de asientos por viaje
CREATE OR REPLACE VIEW v_disponibilidad_viajes AS
SELECT
    v.id                        AS viaje_id,
    r.codigo                    AS ruta_codigo,
    so.nombre                   AS origen,
    sd.nombre                   AS destino,
    v.fecha_hora_salida,
    v.precio_adulto,
    v.estado,
    b.placa,
    b.tipo                      AS tipo_bus,
    b.capacidad_asientos        AS total_asientos,
    COUNT(a.id) FILTER (WHERE a.estado = 'DISPONIBLE') AS asientos_disponibles,
    COUNT(a.id) FILTER (WHERE a.estado = 'VENDIDO')    AS asientos_vendidos
FROM viajes v
JOIN rutas r       ON v.ruta_id = r.id
JOIN sucursales so ON r.sucursal_origen_id = so.id
JOIN sucursales sd ON r.sucursal_destino_id = sd.id
JOIN buses b       ON v.bus_id = b.id
LEFT JOIN asientos a ON a.viaje_id = v.id
WHERE v.activo = TRUE
GROUP BY v.id, r.codigo, so.nombre, sd.nombre,
         v.fecha_hora_salida, v.precio_adulto, v.estado,
         b.placa, b.tipo, b.capacidad_asientos;

COMMENT ON VIEW v_disponibilidad_viajes IS 'Disponibilidad de asientos en tiempo real por viaje';

-- Vista: tracking de encomiendas (última posición conocida)
CREATE OR REPLACE VIEW v_tracking_encomiendas AS
SELECT
    e.id,
    e.numero_guia,
    cr.nombres || ' ' || COALESCE(cr.apellidos, '')  AS remitente,
    cd.nombres || ' ' || COALESCE(cd.apellidos, '')  AS destinatario,
    so.nombre                                         AS sucursal_origen,
    sd.nombre                                         AS sucursal_destino,
    e.descripcion_contenido,
    e.peso_kg,
    e.costo,
    e.estado,
    e.metodo_pago,
    ultimo_mov.fecha_hora                             AS ultima_actualizacion,
    ultimo_mov.sucursal_nombre                        AS ubicacion_actual,
    e.created_at                                      AS fecha_registro
FROM encomiendas e
JOIN clientes cr    ON e.remitente_id = cr.id
JOIN clientes cd    ON e.destinatario_id = cd.id
JOIN sucursales so  ON e.sucursal_origen_id = so.id
JOIN sucursales sd  ON e.sucursal_destino_id = sd.id
LEFT JOIN LATERAL (
    SELECT
        m.fecha_hora,
        COALESCE(s.nombre, 'En tránsito') AS sucursal_nombre
    FROM movimientos_encomienda m
    LEFT JOIN sucursales s ON m.sucursal_actual_id = s.id
    WHERE m.encomienda_id = e.id
    ORDER BY m.fecha_hora DESC
    LIMIT 1
) ultimo_mov ON TRUE
WHERE e.activo = TRUE;

COMMENT ON VIEW v_tracking_encomiendas IS 'Estado actual y última ubicación de cada encomienda';

-- Vista: reporte de ventas diarias
CREATE OR REPLACE VIEW v_ventas_diarias AS
SELECT
    DATE(b.created_at)        AS fecha,
    s.nombre                  AS sucursal,
    COUNT(b.id)               AS boletos_vendidos,
    SUM(b.precio_pagado)      AS ingresos_boletos,
    COUNT(b.id) FILTER (WHERE b.estado = 'CANCELADO') AS cancelaciones
FROM boletos b
JOIN viajes v   ON b.viaje_id = v.id
JOIN rutas r    ON v.ruta_id = r.id
JOIN sucursales s ON r.sucursal_origen_id = s.id
WHERE b.activo = TRUE
GROUP BY DATE(b.created_at), s.nombre
ORDER BY fecha DESC, ingresos_boletos DESC;

-- =============================================================================
-- ÍNDICES ADICIONALES DE PERFORMANCE
-- =============================================================================

-- Para el endpoint de tracking público (buscar por número de guía)
CREATE INDEX idx_encomiendas_numero_guia_activo
    ON encomiendas(numero_guia) WHERE activo = TRUE;

-- Para el endpoint de boletos activos de un cliente
CREATE INDEX idx_boletos_cliente_activo
    ON boletos(cliente_id, created_at DESC) WHERE activo = TRUE;

-- Para la búsqueda de viajes disponibles (query más frecuente del sistema)
CREATE INDEX idx_viajes_disponibles
    ON viajes(ruta_id, fecha_hora_salida, estado)
    WHERE activo = TRUE AND estado = 'PROGRAMADO';

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
DO $$
DECLARE
    tabla  TEXT;
    tablas TEXT[] := ARRAY[
        'roles','sucursales','usuarios','clientes','buses',
        'rutas','pagos','viajes','asientos','boletos',
        'encomiendas','movimientos_encomienda'
    ];
BEGIN
    FOREACH tabla IN ARRAY tablas LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tabla
        ) THEN
            RAISE EXCEPTION 'TABLA FALTANTE: %', tabla;
        END IF;
    END LOOP;
    RAISE NOTICE '✅ Todas las tablas creadas correctamente';
    RAISE NOTICE '   Usuarios iniciales → admin/admin123 | cajero01/admin123 | chofer01/admin123';
    RAISE NOTICE '   ⚠️  Cambiar contraseñas en producción';
END $$;
