package com.transporte.sistema.entity;

import com.transporte.sistema.enums.EstadoEncomienda;
import com.transporte.sistema.enums.MetodoPago;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Encomienda/paquete enviado por los buses interprovinciales.
 * Tiene tracking completo mediante MovimientoEncomienda.
 */
@Entity
@Table(name = "encomiendas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Encomienda extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Número de guía único, ej: "GUI-2024-000001" */
    @Column(name = "numero_guia", nullable = false, unique = true, length = 30)
    private String numeroGuia;

    /** Quien envía el paquete */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitente_id", nullable = false)
    private Cliente remitente;

    /** Quien debe recibir el paquete */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Cliente destinatario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_origen_id", nullable = false)
    private Sucursal sucursalOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_destino_id", nullable = false)
    private Sucursal sucursalDestino;

    /** Viaje en el que viaja la encomienda (asignado al despachar) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viaje_id")
    private Viaje viaje;

    @Column(name = "descripcion_contenido", nullable = false, length = 300)
    private String descripcionContenido;

    @Column(name = "peso_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal pesoKg;

    @Column(name = "volumen_m3", precision = 8, scale = 4)
    private BigDecimal volumenM3;

    /** Valor declarado por el remitente (para seguros) */
    @Column(name = "valor_declarado", precision = 10, scale = 2)
    private BigDecimal valorDeclarado;

    /** Costo del servicio de encomienda */
    @Column(name = "costo", nullable = false, precision = 10, scale = 2)
    private BigDecimal costo;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 30)
    private MetodoPago metodoPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    @Builder.Default
    private EstadoEncomienda estado = EstadoEncomienda.RECIBIDO;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pago_id")
    private Pago pago;

    /** Cajero que registró la encomienda */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cajero_registro_id")
    private Usuario cajeroRegistro;

    /** Cajero que entregó la encomienda */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cajero_entrega_id")
    private Usuario cajeroEntrega;

    /** Historial de movimientos/estados */
    @OneToMany(mappedBy = "encomienda", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<MovimientoEncomienda> movimientos = new ArrayList<>();

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    /** Código QR de la guía */
    @Column(name = "codigo_qr", length = 500)
    private String codigoQr;
}
