package com.transporte.sistema.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.transporte.sistema.dto.request.BoletoRequest;
import com.transporte.sistema.dto.response.AsientoResponse;
import com.transporte.sistema.dto.response.BoletoResponse;
import com.transporte.sistema.dto.response.ClienteResponse;
import com.transporte.sistema.dto.response.ViajeResponse;
import com.transporte.sistema.entity.*;
import com.transporte.sistema.enums.EstadoAsiento;
import com.transporte.sistema.enums.EstadoBoleto;
import com.transporte.sistema.enums.EstadoPago;
import com.transporte.sistema.enums.EstadoViaje;
import com.transporte.sistema.exception.NegocioException;
import com.transporte.sistema.exception.RecursoNoEncontradoException;
import com.transporte.sistema.repository.*;
import com.transporte.sistema.service.BoletoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoletoServiceImpl implements BoletoService {

    private final BoletoRepository    boletoRepository;
    private final ViajeRepository     viajeRepository;
    private final AsientoRepository   asientoRepository;
    private final ClienteRepository   clienteRepository;
    private final PagoRepository      pagoRepository;
    private final UsuarioRepository   usuarioRepository;

    // ── Métodos existentes ───────────────────────────────────────────────────

    @Override
    @Transactional
    public BoletoResponse vender(BoletoRequest request) {
        Viaje viaje = viajeRepository.findById(request.getViajeId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", request.getViajeId()));
        if (viaje.getEstado() != EstadoViaje.PROGRAMADO)
            throw new NegocioException("Solo se pueden vender boletos para viajes PROGRAMADOS");

        Asiento asiento = asientoRepository.findById(request.getAsientoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Asiento", request.getAsientoId()));
        if (!asiento.getViaje().getId().equals(viaje.getId()))
            throw new NegocioException("El asiento no pertenece al viaje indicado");
        if (asiento.getEstado() != EstadoAsiento.DISPONIBLE)
            throw new NegocioException("El asiento " + asiento.getNumeroAsiento() + " ya no está disponible");

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", request.getClienteId()));

        Pago pago = Pago.builder()
                .monto(viaje.getPrecioAdulto())
                .fechaPago(LocalDateTime.now())
                .metodo(request.getMetodoPago())
                .estado(EstadoPago.COMPLETADO)
                .referencia(request.getReferenciaPago())
                .activo(true)
                .build();
        pagoRepository.save(pago);

        Usuario cajero = obtenerUsuarioActual();
        return crearYGuardarBoleto(viaje, asiento, cliente, pago, cajero, request.getObservaciones());
    }

    /**
     * Compra de pasaje desde el portal del cliente.
     * El cliente queda registrado automáticamente por su username del JWT.
     */
    @Override
    @Transactional
    public BoletoResponse comprarPasaje(BoletoRequest request, String username) {
        // Obtener el cliente vinculado al usuario autenticado
        Cliente cliente = clienteRepository.findByUsuarioUsername(username)
                .orElseThrow(() -> new NegocioException(
                        "No se encontró un perfil de cliente para el usuario: " + username));

        // Sobreescribir clienteId con el del usuario autenticado (seguridad)
        Viaje viaje = viajeRepository.findById(request.getViajeId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", request.getViajeId()));
        if (viaje.getEstado() != EstadoViaje.PROGRAMADO)
            throw new NegocioException("Este viaje ya no está disponible para reservas");

        Asiento asiento = asientoRepository.findById(request.getAsientoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Asiento", request.getAsientoId()));
        if (!asiento.getViaje().getId().equals(viaje.getId()))
            throw new NegocioException("El asiento no pertenece al viaje indicado");
        if (asiento.getEstado() != EstadoAsiento.DISPONIBLE)
            throw new NegocioException("El asiento " + asiento.getNumeroAsiento() + " ya fue reservado");

        Pago pago = Pago.builder()
                .monto(viaje.getPrecioAdulto())
                .fechaPago(LocalDateTime.now())
                .metodo(request.getMetodoPago())
                .estado(EstadoPago.COMPLETADO)
                .referencia(request.getReferenciaPago())
                .activo(true)
                .build();
        pagoRepository.save(pago);

        BoletoResponse boleto = crearYGuardarBoleto(viaje, asiento, cliente, pago, null, request.getObservaciones());
        log.info("Pasaje comprado por cliente {} para viaje {} asiento {}",
                username, viaje.getId(), asiento.getNumeroAsiento());
        return boleto;
    }

    /**
     * Historial de boletos del cliente autenticado.
     */
    @Override
    @Transactional(readOnly = true)
    public List<BoletoResponse> misBoletos(String username) {
        Cliente cliente = clienteRepository.findByUsuarioUsername(username)
                .orElseThrow(() -> new NegocioException(
                        "No se encontró perfil de cliente para: " + username));
        return boletoRepository
                .findByClienteIdOrderByCreatedAtDesc(cliente.getId(), Pageable.unpaged())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BoletoResponse obtenerPorId(Long id) {
        return toResponse(boletoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Boleto", id)));
    }

    @Override
    @Transactional(readOnly = true)
    public BoletoResponse obtenerPorNumero(String numeroBoleto) {
        return toResponse(boletoRepository.findByNumeroBoleto(numeroBoleto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Boleto con número " + numeroBoleto + " no encontrado")));
    }

    @Override
    @Transactional
    public BoletoResponse escanearQr(String codigoQr) {
        Boleto boleto = boletoRepository.findByNumeroBoleto(codigoQr)
                .orElseThrow(() -> new NegocioException("QR inválido o boleto no encontrado"));
        if (boleto.getEstado() != EstadoBoleto.ACTIVO)
            throw new NegocioException("El boleto ya fue usado o está cancelado. Estado: " + boleto.getEstado());
        boleto.setEstado(EstadoBoleto.USADO);
        boleto.setFechaHoraUso(LocalDateTime.now());
        return toResponse(boletoRepository.save(boleto));
    }

    @Override
    @Transactional
    public BoletoResponse cancelar(Long id, String motivo) {
        Boleto boleto = boletoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Boleto", id));
        if (boleto.getEstado() == EstadoBoleto.USADO)
            throw new NegocioException("No se puede cancelar un boleto ya utilizado");
        if (boleto.getEstado() == EstadoBoleto.CANCELADO)
            throw new NegocioException("El boleto ya está cancelado");
        boleto.setEstado(EstadoBoleto.CANCELADO);
        boleto.setObservaciones(motivo);
        boleto.getAsiento().setEstado(EstadoAsiento.DISPONIBLE);
        asientoRepository.save(boleto.getAsiento());
        return toResponse(boletoRepository.save(boleto));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoletoResponse> listarPorCliente(Long clienteId, Pageable pageable) {
        return boletoRepository.findByClienteIdOrderByCreatedAtDesc(clienteId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoletoResponse> listarPorViaje(Long viajeId, Pageable pageable) {
        return boletoRepository.findByViajeId(viajeId, pageable).map(this::toResponse);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private BoletoResponse crearYGuardarBoleto(Viaje viaje, Asiento asiento,
                                                Cliente cliente, Pago pago,
                                                Usuario cajero, String observaciones) {
        Boleto boleto = Boleto.builder()
                .numeroBoleto("TEMP")
                .viaje(viaje)
                .asiento(asiento)
                .cliente(cliente)
                .precioPagado(viaje.getPrecioAdulto())
                .estado(EstadoBoleto.ACTIVO)
                .pago(pago)
                .cajero(cajero)
                .observaciones(observaciones)
                .activo(true)
                .build();

        Boleto guardado = boletoRepository.save(boleto);
        String numeroBoleto = generarNumeroBoleto(guardado.getId());
        guardado.setNumeroBoleto(numeroBoleto);
        guardado.setCodigoQr(numeroBoleto);
        guardado.setQrImagenUrl(generarQrBase64(numeroBoleto));

        asiento.setEstado(EstadoAsiento.VENDIDO);
        asientoRepository.save(asiento);

        return toResponse(boletoRepository.save(guardado));
    }

    private String generarNumeroBoleto(Long id) {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("BOL-%s-%06d", fecha, id);
    }

    private String generarQrBase64(String contenido) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(contenido, BarcodeFormat.QR_CODE, 200, 200);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            return "data:image/png;base64," +
                    Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            log.error("Error generando QR para {}: {}", contenido, e.getMessage());
            return null;
        }
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

    public BoletoResponse toResponse(Boleto b) {
        Viaje v  = b.getViaje();
        Asiento a = b.getAsiento();
        Cliente c = b.getCliente();

        return BoletoResponse.builder()
                .id(b.getId())
                .numeroBoleto(b.getNumeroBoleto())
                .viaje(ViajeResponse.builder()
                        .id(v.getId())
                        .fechaHoraSalida(v.getFechaHoraSalida())
                        .fechaHoraLlegadaEstimada(v.getFechaHoraLlegadaEstimada())
                        .precioAdulto(v.getPrecioAdulto())
                        .estado(v.getEstado())
                        .build())
                .asiento(AsientoResponse.builder()
                        .id(a.getId())
                        .numeroAsiento(a.getNumeroAsiento())
                        .fila(a.getFila())
                        .columna(a.getColumna())
                        .tipo(a.getTipo())
                        .estado(a.getEstado())
                        .build())
                .cliente(ClienteResponse.builder()
                        .id(c.getId())
                        .dniRuc(c.getDniRuc())
                        .nombreCompleto(c.getNombreCompleto())
                        .telefono(c.getTelefono())
                        .build())
                .precioPagado(b.getPrecioPagado())
                .estado(b.getEstado())
                .codigoQr(b.getCodigoQr())
                .qrImagenUrl(b.getQrImagenUrl())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
