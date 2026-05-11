package com.transporte.sistema.dto.request;

import com.transporte.sistema.enums.MetodoPago;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/** DTO para registrar una nueva encomienda */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncomiendaRequest {

    @NotNull(message = "El remitente es obligatorio")
    private Long remitenteId;

    @NotNull(message = "El destinatario es obligatorio")
    private Long destinatarioId;

    @NotNull(message = "La sucursal origen es obligatoria")
    private Long sucursalOrigenId;

    @NotNull(message = "La sucursal destino es obligatoria")
    private Long sucursalDestinoId;

    /** Viaje en el que se despachará (puede asignarse después) */
    private Long viajeId;

    @NotBlank(message = "La descripción del contenido es obligatoria")
    @Size(max = 300)
    private String descripcionContenido;

    @NotNull(message = "El peso es obligatorio")
    @DecimalMin(value = "0.001", message = "El peso debe ser mayor a cero")
    private BigDecimal pesoKg;

    @DecimalMin(value = "0.0001")
    private BigDecimal volumenM3;

    @DecimalMin(value = "0.00")
    private BigDecimal valorDeclarado;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    @Size(max = 500)
    private String observaciones;
}
