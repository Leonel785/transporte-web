package com.transporte.sistema.enums;

public enum EstadoEncomienda {
    RECIBIDO,           // Registrado en sucursal origen
    EN_ALMACEN,         // En almacén esperando despacho
    EN_TRANSITO,        // En el bus, en camino
    EN_DESTINO,         // Llegó a sucursal destino
    LISTO_ENTREGA,      // Disponible para recoger
    ENTREGADO,          // Entregado al destinatario
    DEVUELTO,           // Devuelto al remitente
    PERDIDO             // Extraviado (estado crítico)
}
