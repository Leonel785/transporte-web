package com.transporte.sistema.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** DTO para programar un nuevo viaje */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViajeRequest {

    @NotNull(message = "La ruta es obligatoria")
    private Long rutaId;

    @NotNull(message = "El bus es obligatorio")
    private Long busId;

    private Long choferId;

    @NotNull(message = "La fecha/hora de salida es obligatoria")
    @FutureOrPresent(message = "La fecha de salida debe ser presente o futura")
    private LocalDateTime fechaHoraSalida;

    private LocalDateTime fechaHoraLlegadaEstimada;

    @NotNull(message = "El precio para adulto es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a cero")
    private BigDecimal precioAdulto;

    @DecimalMin(value = "0.01")
    private BigDecimal precioNino;

    @Size(max = 500)
    private String observaciones;
}
