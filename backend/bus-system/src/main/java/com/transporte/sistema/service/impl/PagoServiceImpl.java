package com.transporte.sistema.service.impl;

import com.transporte.sistema.dto.request.CrearPagoRequest;
import com.transporte.sistema.dto.response.PagoResponse;
import com.transporte.sistema.entity.Pago;
import com.transporte.sistema.enums.EstadoPago;
import com.transporte.sistema.exception.NegocioException;
import com.transporte.sistema.repository.PagoRepository;
import com.transporte.sistema.service.PagoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Servicio de pagos.
 *
 * MEJORAS vs versión anterior:
 * - Eliminado el Math.random() que rechazaba pagos al azar (bug en producción)
 * - Validación mejorada: referencia obligatoria para métodos electrónicos
 * - Estructura preparada para integrar con Culqi/Stripe:
 *   implementar el método procesarConPasarela() con la API real
 * - Separación entre procesamiento y persistencia
 */
@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("DataFlowIssue")
public class PagoServiceImpl implements PagoService {

    private final PagoRepository pagoRepository;

    @Override
    @Transactional
    public PagoResponse procesarPago(CrearPagoRequest request) {
        // Validar monto
        if (request.getMonto() == null || request.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new NegocioException("El monto debe ser mayor a cero");
        }

        // Para pagos electrónicos, la referencia es obligatoria
        if (request.getMetodo() != null) {
            switch (request.getMetodo()) {
                case TARJETA_CREDITO, TARJETA_DEBITO, TRANSFERENCIA, YAPE, PLIN -> {
                    if (request.getReferencia() == null || request.getReferencia().isBlank()) {
                        throw new NegocioException(
                            "La referencia es obligatoria para pagos con " + request.getMetodo());
                    }
                }
                // EFECTIVO no requiere referencia
                default -> { /* OK */ }
            }
        }

        // TODO: Para integrar con pasarela real (Culqi, Stripe, etc.):
        // PagoExternoResponse ext = pasarelaService.cobrar(request);
        // if (!ext.isExitoso()) throw new NegocioException("Pago rechazado: " + ext.getMensaje());

        // Por ahora: registrar el pago directamente (flujo controlado por el frontend)
        Pago pago = Pago.builder()
                .monto(request.getMonto())
                .fechaPago(LocalDateTime.now())
                .metodo(request.getMetodo())
                .estado(EstadoPago.COMPLETADO)
                .referencia(request.getReferencia())
                .observacion(request.getObservacion())
                .activo(true)
                .build();

        Pago guardado = pagoRepository.save(pago);

        log.info("Pago registrado: id={} | monto=S/{} | metodo={}",
                guardado.getId(), guardado.getMonto(), guardado.getMetodo());

        return toResponse(guardado);
    }

    private PagoResponse toResponse(Pago p) {
        return PagoResponse.builder()
                .id(p.getId())
                .monto(p.getMonto())
                .fechaPago(p.getFechaPago())
                .metodo(p.getMetodo())
                .estado(p.getEstado())
                .referencia(p.getReferencia())
                .build();
    }
}
