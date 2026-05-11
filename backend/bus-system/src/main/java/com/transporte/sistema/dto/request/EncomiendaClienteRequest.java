package com.transporte.sistema.dto.request;

import com.transporte.sistema.enums.MetodoPago;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EncomiendaClienteRequest {

    @NotNull(message = "La sucursal origen es obligatoria")
    private Long sucursalOrigenId;

    @NotNull(message = "La sucursal destino es obligatoria")
    private Long sucursalDestinoId;

    @NotBlank(message = "El nombre del destinatario es obligatorio")
    @Size(max = 200)
    private String destinatarioNombre;

    @Size(max = 20)
    private String destinatarioTelefono;

    @NotBlank(message = "La descripción del contenido es obligatoria")
    @Size(max = 300)
    private String descripcionContenido;

    @NotNull(message = "El peso es obligatorio")
    @DecimalMin(value = "0.001", message = "El peso debe ser mayor a cero")
    private BigDecimal pesoKg;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    private String referenciaPago;

    @Size(max = 500)
    private String observaciones;

    private BigDecimal costo;
}