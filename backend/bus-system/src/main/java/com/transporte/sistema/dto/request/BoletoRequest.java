package com.transporte.sistema.dto.request;

import com.transporte.sistema.enums.MetodoPago;
import jakarta.validation.constraints.*;
import lombok.*;

/** DTO para vender un boleto */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoletoRequest {

    @NotNull(message = "El viaje es obligatorio")
    private Long viajeId;

    @NotNull(message = "El asiento es obligatorio")
    private Long asientoId;

    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    /** Referencia de pago Yape/Plin/Tarjeta */
    @Size(max = 200)
    private String referenciaPago;

    @Size(max = 300)
    private String observaciones;
}
