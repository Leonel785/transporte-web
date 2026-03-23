package com.transporte.sistema.service.impl;

import com.transporte.sistema.dto.request.ActualizarEstadoEncomiendaRequest;
import com.transporte.sistema.dto.request.EncomiendaRequest;
import com.transporte.sistema.dto.response.*;
import com.transporte.sistema.entity.*;
import com.transporte.sistema.enums.EstadoEncomienda;
import com.transporte.sistema.exception.NegocioException;
import com.transporte.sistema.exception.RecursoNoEncontradoException;
import com.transporte.sistema.repository.*;
import com.transporte.sistema.service.EncomiendaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EncomiendaServiceImpl implements EncomiendaService {

    private final EncomiendaRepository             encomiendaRepository;
    private final ClienteRepository                clienteRepository;
    private final SucursalRepository               sucursalRepository;
    private final ViajeRepository                  viajeRepository;
    private final MovimientoEncomiendaRepository   movimientoRepository;
    private final UsuarioRepository                usuarioRepository;
    private final PagoRepository                   pagoRepository;

    // ── Métodos existentes ───────────────────────────────────────────────────

    @Override
    @Transactional
    public EncomiendaResponse registrar(EncomiendaRequest request) {
        if (request.getRemitenteId().equals(request.getDestinatarioId()))
            throw new NegocioException("El remitente y destinatario no pueden ser la misma persona");

        Cliente remitente   = clienteRepository.findById(request.getRemitenteId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Remitente", request.getRemitenteId()));
        Cliente destinatario = clienteRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Destinatario", request.getDestinatarioId()));
        Sucursal origen     = sucursalRepository.findById(request.getSucursalOrigenId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sucursal origen", request.getSucursalOrigenId()));
        Sucursal destino    = sucursalRepository.findById(request.getSucursalDestinoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sucursal destino", request.getSucursalDestinoId()));

        if (origen.getId().equals(destino.getId()))
            throw new NegocioException("La sucursal de origen y destino no pueden ser iguales");

        BigDecimal costo = calcularCosto(request.getPesoKg(), request.getVolumenM3());

        Pago pago = Pago.builder()
                .monto(costo)
                .fechaPago(LocalDateTime.now())
                .metodo(request.getMetodoPago())
                .activo(true)
                .build();
        pagoRepository.save(pago);

        Viaje viaje = null;
        if (request.getViajeId() != null) {
            viaje = viajeRepository.findById(request.getViajeId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", request.getViajeId()));
        }

        Usuario cajero = obtenerUsuarioActual();

        Encomienda encomienda = Encomienda.builder()
                .numeroGuia("TEMP")
                .pago(pago)
                .remitente(remitente)
                .destinatario(destinatario)
                .sucursalOrigen(origen)
                .sucursalDestino(destino)
                .viaje(viaje)
                .descripcionContenido(request.getDescripcionContenido())
                .pesoKg(request.getPesoKg())
                .volumenM3(request.getVolumenM3())
                .valorDeclarado(request.getValorDeclarado())
                .costo(costo)
                .metodoPago(request.getMetodoPago())
                .estado(EstadoEncomienda.RECIBIDO)
                .cajeroRegistro(cajero)
                .activo(true)
                .observaciones(request.getObservaciones())
                .build();

        Encomienda guardada = encomiendaRepository.save(encomienda);
        String numeroGuia = String.format("GUI-%s-%06d",
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()),
                guardada.getId());
        guardada.setNumeroGuia(numeroGuia);
        guardada = encomiendaRepository.save(guardada);

        registrarMovimiento(guardada, null, EstadoEncomienda.RECIBIDO,
                origen, "Encomienda registrada en " + origen.getNombre(), cajero);

        log.info("Encomienda {} registrada", numeroGuia);
        return toResponse(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public EncomiendaResponse obtenerPorId(Long id) {
        return toResponse(encomiendaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Encomienda", id)));
    }

    @Override
    @Transactional(readOnly = true)
    public EncomiendaResponse obtenerPorGuia(String numeroGuia) {
        return toResponse(encomiendaRepository.findByNumeroGuia(numeroGuia)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Encomienda con guía " + numeroGuia + " no encontrada")));
    }

    @Override
    @Transactional
    public EncomiendaResponse actualizarEstado(Long id, ActualizarEstadoEncomiendaRequest request) {
        Encomienda encomienda = encomiendaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Encomienda", id));
        EstadoEncomienda estadoAnterior = encomienda.getEstado();
        validarTransicionEstado(estadoAnterior, request.getNuevoEstado());

        Sucursal sucursalActual = null;
        if (request.getSucursalActualId() != null) {
            sucursalActual = sucursalRepository.findById(request.getSucursalActualId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Sucursal", request.getSucursalActualId()));
        }

        encomienda.setEstado(request.getNuevoEstado());
        Usuario responsable = obtenerUsuarioActual();
        encomiendaRepository.save(encomienda);
        registrarMovimiento(encomienda, estadoAnterior, request.getNuevoEstado(),
                sucursalActual, request.getObservacion(), responsable);
        return toResponse(encomienda);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EncomiendaResponse> listarPorRemitente(Long remitenteId, Pageable pageable) {
        return encomiendaRepository.findByRemitenteIdOrderByCreatedAtDesc(remitenteId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EncomiendaResponse> listarPorSucursalOrigen(Long sucursalId, Pageable pageable) {
        return encomiendaRepository.findBySucursalOrigenIdOrderByCreatedAtDesc(sucursalId, pageable)
                .map(this::toResponse);
    }

    // ── Portal cliente ────────────────────────────────────────────────────────

    /**
     * Encomiendas donde el cliente autenticado es el remitente.
     */
    @Override
    @Transactional(readOnly = true)
    public List<EncomiendaResponse> misEncomiendas(String username) {
        Cliente cliente = clienteRepository.findByUsuarioUsername(username)
                .orElseThrow(() -> new NegocioException(
                        "No se encontró perfil de cliente para: " + username));
        return encomiendaRepository
                .findByRemitenteIdOrderByCreatedAtDesc(cliente.getId(), Pageable.unpaged())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Movimientos de una encomienda — accesible por el cliente si es su remitente.
     */
    @Override
    @Transactional(readOnly = true)
    public List<MovimientoEncomiendaResponse> obtenerMovimientos(Long encomiendaId, String username) {
        Encomienda encomienda = encomiendaRepository.findById(encomiendaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Encomienda", encomiendaId));

        // Verificar que pertenece al cliente autenticado
        if (username != null && encomienda.getRemitente().getUsuario() != null) {
            if (!encomienda.getRemitente().getUsuario().getUsername().equals(username)) {
                throw new NegocioException("No tienes permiso para ver esta encomienda");
            }
        }

        return movimientoRepository
                .findByEncomiendaIdOrderByFechaHoraAsc(encomiendaId)
                .stream()
                .map(m -> MovimientoEncomiendaResponse.builder()
                        .id(m.getId())
                        .fechaHora(m.getFechaHora())
                        .sucursalActual(m.getSucursalActual() != null
                                ? m.getSucursalActual().getNombre() : "En tránsito")
                        .estadoAnterior(m.getEstadoAnterior())
                        .estadoNuevo(m.getEstadoNuevo())
                        .observacion(m.getObservacion())
                        .usuarioResponsable(m.getUsuarioResponsable() != null
                                ? m.getUsuarioResponsable().getNombres() : null)
                        .build())
                .toList();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void registrarMovimiento(Encomienda e, EstadoEncomienda anterior,
                                     EstadoEncomienda nuevo, Sucursal sucursal,
                                     String obs, Usuario responsable) {
        movimientoRepository.save(MovimientoEncomienda.builder()
                .encomienda(e)
                .fechaHora(LocalDateTime.now())
                .sucursalActual(sucursal)
                .estadoAnterior(anterior)
                .estadoNuevo(nuevo)
                .observacion(obs)
                .usuarioResponsable(responsable)
                .build());
    }

    private void validarTransicionEstado(EstadoEncomienda actual, EstadoEncomienda nuevo) {
        boolean valido = switch (actual) {
            case RECIBIDO       -> nuevo == EstadoEncomienda.EN_ALMACEN || nuevo == EstadoEncomienda.EN_TRANSITO;
            case EN_ALMACEN     -> nuevo == EstadoEncomienda.EN_TRANSITO;
            case EN_TRANSITO    -> nuevo == EstadoEncomienda.EN_DESTINO;
            case EN_DESTINO     -> nuevo == EstadoEncomienda.LISTO_ENTREGA;
            case LISTO_ENTREGA  -> nuevo == EstadoEncomienda.ENTREGADO || nuevo == EstadoEncomienda.DEVUELTO;
            case ENTREGADO, DEVUELTO, PERDIDO -> false;
        };
        if (!valido)
            throw new NegocioException("Transición inválida: " + actual + " → " + nuevo);
    }

    private BigDecimal calcularCosto(BigDecimal pesoKg, BigDecimal volumenM3) {
        BigDecimal tarifaBase = pesoKg.multiply(BigDecimal.valueOf(5.0));
        return tarifaBase.max(BigDecimal.valueOf(10.0));
    }

    private Usuario obtenerUsuarioActual() {
        try {
            String username = SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            return usuarioRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    public EncomiendaResponse toResponse(Encomienda e) {
        return EncomiendaResponse.builder()
                .id(e.getId())
                .numeroGuia(e.getNumeroGuia())
                .remitente(toClienteResponse(e.getRemitente()))
                .destinatario(toClienteResponse(e.getDestinatario()))
                .sucursalOrigen(toSucursalResponse(e.getSucursalOrigen()))
                .sucursalDestino(toSucursalResponse(e.getSucursalDestino()))
                .descripcionContenido(e.getDescripcionContenido())
                .pesoKg(e.getPesoKg())
                .costo(e.getCosto())
                .metodoPago(e.getMetodoPago())
                .estado(e.getEstado())
                .codigoQr(e.getCodigoQr())
                .movimientos(e.getMovimientos().stream()
                        .map(m -> MovimientoEncomiendaResponse.builder()
                                .id(m.getId())
                                .fechaHora(m.getFechaHora())
                                .sucursalActual(m.getSucursalActual() != null
                                        ? m.getSucursalActual().getNombre() : "En tránsito")
                                .estadoAnterior(m.getEstadoAnterior())
                                .estadoNuevo(m.getEstadoNuevo())
                                .observacion(m.getObservacion())
                                .usuarioResponsable(m.getUsuarioResponsable() != null
                                        ? m.getUsuarioResponsable().getNombres() : null)
                                .build())
                        .toList())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private ClienteResponse toClienteResponse(Cliente c) {
        if (c == null) return null;
        return ClienteResponse.builder()
                .id(c.getId()).dniRuc(c.getDniRuc())
                .nombreCompleto(c.getNombreCompleto())
                .telefono(c.getTelefono()).build();
    }

    private SucursalResponse toSucursalResponse(Sucursal s) {
        if (s == null) return null;
        return SucursalResponse.builder()
                .id(s.getId()).codigo(s.getCodigo())
                .nombre(s.getNombre()).ciudad(s.getCiudad()).build();
    }
}
