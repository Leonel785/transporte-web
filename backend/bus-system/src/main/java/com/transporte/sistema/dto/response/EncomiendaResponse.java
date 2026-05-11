package com.transporte.sistema.dto.response;
import com.transporte.sistema.enums.EstadoEncomienda;
import com.transporte.sistema.enums.MetodoPago;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EncomiendaResponse {
    private Long id;
    private String numeroGuia;
    private ClienteResponse remitente;
    private ClienteResponse destinatario;
    private SucursalResponse sucursalOrigen;
    private SucursalResponse sucursalDestino;
    private String descripcionContenido;
    private BigDecimal pesoKg;
    private BigDecimal costo;
    private MetodoPago metodoPago;
    private EstadoEncomienda estado;
    private String codigoQr;
    private List<MovimientoEncomiendaResponse> movimientos;
    private LocalDateTime createdAt;
}
