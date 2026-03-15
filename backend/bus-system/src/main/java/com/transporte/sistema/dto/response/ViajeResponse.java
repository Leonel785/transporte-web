package com.transporte.sistema.dto.response;
import com.transporte.sistema.enums.EstadoViaje;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ViajeResponse {
    private Long id;
    private RutaResponse ruta;
    private BusResponse bus;
    private String choferNombre;
    private LocalDateTime fechaHoraSalida;
    private LocalDateTime fechaHoraLlegadaEstimada;
    private BigDecimal precioAdulto;
    private BigDecimal precioNino;
    private EstadoViaje estado;
    private Integer asientosDisponibles;
    private Integer totalAsientos;
}
