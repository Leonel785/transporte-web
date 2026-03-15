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

@Slf4j
@Service
@RequiredArgsConstructor
public class BoletoServiceImpl implements BoletoService {

    private final BoletoRepository boletoRepository;
    private final ViajeRepository viajeRepository;
    private final AsientoRepository asientoRepository;
    private final ClienteRepository clienteRepository;
    private final PagoRepository pagoRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public BoletoResponse vender(BoletoRequest request) {
        // 1. Validar viaje
        Viaje viaje = viajeRepository.findById(request.getViajeId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", request.getViajeId()));
        if (viaje.getEstado() != EstadoViaje.PROGRAMADO)
            throw new NegocioException("Solo se pueden vender boletos para viajes PROGRAMADOS");

        // 2. Validar y reservar asiento
        Asiento asiento = asientoRepository.findById(request.getAsientoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Asiento", request.getAsientoId()));
        if (!asiento.getViaje().getId().equals(viaje.getId()))
            throw new NegocioException("El asiento no pertenece al viaje indicado");
        if (asiento.getEstado() != EstadoAsiento.DISPONIBLE)
            throw new NegocioException("El asiento " + asiento.getNumeroAsiento() + " ya no está disponible");

        // 3. Cliente
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", request.getClienteId()));

        // 4. Pago
        Pago pago = Pago.builder()
                .monto(viaje.getPrecioAdulto())
                .fechaPago(LocalDateTime.now())
                .metodo(request.getMetodoPago())
                .estado(EstadoPago.COMPLETADO)
                .referencia(request.getReferenciaPago())
                .activo(true)
                .build();
        pagoRepository.save(pago);

        // 5. Cajero del contexto de seguridad
        Usuario cajero = obtenerUsuarioActual();

        // 6. Número de boleto único basado en el ID de BD (se actualiza tras primer save)
        Boleto boleto = Boleto.builder()
                .numeroBoleto("TEMP")   // se actualiza tras obtener el ID
                .viaje(viaje)
                .asiento(asiento)
                .cliente(cliente)
                .precioPagado(viaje.getPrecioAdulto())
                .estado(EstadoBoleto.ACTIVO)
                .pago(pago)
                .cajero(cajero)
                .observaciones(request.getObservaciones())
                .activo(true)
                .build();

        Boleto guardado = boletoRepository.save(boleto);

        // 7. Número definitivo usando el ID generado por la BD (garantiza unicidad)
        String numeroBoleto = generarNumeroBoleto(guardado.getId());
        guardado.setNumeroBoleto(numeroBoleto);
        guardado.setCodigoQr(numeroBoleto);
        guardado.setQrImagenUrl(generarQrBase64(numeroBoleto));

        // 8. Marcar asiento como VENDIDO
        asiento.setEstado(EstadoAsiento.VENDIDO);
        asientoRepository.save(asiento);

        guardado = boletoRepository.save(guardado);
        log.info("Boleto {} vendido → viaje {} asiento {}",
                numeroBoleto, viaje.getId(), asiento.getNumeroAsiento());
        return toResponse(guardado);
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
        // Liberar el asiento
        Asiento asiento = boleto.getAsiento();
        asiento.setEstado(EstadoAsiento.DISPONIBLE);
        asientoRepository.save(asiento);
        return toResponse(boletoRepository.save(boleto));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoletoResponse> listarPorCliente(Long clienteId, Pageable pageable) {
        return boletoRepository.findByClienteIdOrderByCreatedAtDesc(clienteId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoletoResponse> listarPorViaje(Long viajeId, Pageable pageable) {
        return boletoRepository.findByViajeId(viajeId, pageable).map(this::toResponse);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Número de boleto único usando el ID de BD + fecha.
     * Ej: BOL-20241201-000042
     * Garantiza unicidad porque el ID es PK autoincremental.
     */
    private String generarNumeroBoleto(Long id) {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("BOL-%s-%06d", fecha, id);
    }

    /** Genera imagen QR en Base64 (PNG 200x200) usando ZXing */
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

    /** Obtiene el usuario autenticado del SecurityContext */
    private Usuario obtenerUsuarioActual() {
        try {
            String username = SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            return usuarioRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    // ── Mapeo a DTO ───────────────────────────────────────────────────────────

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
