package com.transporte.sistema.service.impl;

import com.transporte.sistema.dto.request.ViajeRequest;
import com.transporte.sistema.dto.response.AsientoResponse;
import com.transporte.sistema.dto.response.BusResponse;
import com.transporte.sistema.dto.response.RutaResponse;
import com.transporte.sistema.dto.response.SucursalResponse;
import com.transporte.sistema.dto.response.ViajeResponse;
import com.transporte.sistema.entity.*;
import com.transporte.sistema.enums.EstadoAsiento;
import com.transporte.sistema.enums.EstadoViaje;
import com.transporte.sistema.enums.TipoAsiento;
import com.transporte.sistema.exception.NegocioException;
import com.transporte.sistema.exception.RecursoNoEncontradoException;
import com.transporte.sistema.repository.*;
import com.transporte.sistema.service.ViajeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViajeServiceImpl implements ViajeService {

    private final ViajeRepository viajeRepository;
    private final RutaRepository rutaRepository;
    private final BusRepository busRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsientoRepository asientoRepository;

    @Override
    @Transactional
    public ViajeResponse crear(ViajeRequest request) {
        Ruta ruta = rutaRepository.findById(request.getRutaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Ruta", request.getRutaId()));
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Bus", request.getBusId()));

        // Verificar que el bus no tenga conflicto de horario (±2 horas)
        LocalDateTime inicio = request.getFechaHoraSalida().minusHours(2);
        LocalDateTime fin    = request.getFechaHoraSalida().plusHours(2);
        List<Viaje> conflictos = viajeRepository.findByBusIdEnRango(bus.getId(), inicio, fin);
        if (!conflictos.isEmpty()) {
            throw new NegocioException("El bus " + bus.getPlaca() +
                    " ya tiene un viaje programado en ese horario");
        }

        Usuario chofer = null;
        if (request.getChoferId() != null) {
            chofer = usuarioRepository.findById(request.getChoferId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Chofer", request.getChoferId()));
        }

        Viaje viaje = Viaje.builder()
                .ruta(ruta)
                .bus(bus)
                .chofer(chofer)
                .fechaHoraSalida(request.getFechaHoraSalida())
                .fechaHoraLlegadaEstimada(request.getFechaHoraLlegadaEstimada())
                .precioAdulto(request.getPrecioAdulto())
                .precioNino(request.getPrecioNino())
                .estado(EstadoViaje.PROGRAMADO)
                .observaciones(request.getObservaciones())
                .activo(true)
                .build();

        Viaje guardado = viajeRepository.save(viaje);
        generarAsientos(guardado, bus);

        log.info("Viaje {} creado con {} asientos", guardado.getId(), bus.getCapacidadAsientos());
        return toResponse(guardado, (long) bus.getCapacidadAsientos());
    }

    /**
     * Genera los asientos del viaje según capacidad del bus.
     * Distribución estándar: 4 columnas (col 1,4 = ventana; col 2,3 = pasillo).
     */
    private void generarAsientos(Viaje viaje, Bus bus) {
        int total    = bus.getCapacidadAsientos();
        int columnas = 4;
        List<Asiento> asientos = new ArrayList<>(total);

        for (int i = 1; i <= total; i++) {
            int fila = (int) Math.ceil((double) i / columnas);
            int col  = ((i - 1) % columnas) + 1;
            TipoAsiento tipo = (col == 1 || col == 4) ? TipoAsiento.VENTANA : TipoAsiento.PASILLO;

            asientos.add(Asiento.builder()
                    .viaje(viaje)
                    .numeroAsiento(String.valueOf(i))
                    .fila(fila)
                    .columna(col)
                    .piso(1)
                    .tipo(tipo)
                    .estado(EstadoAsiento.DISPONIBLE)
                    .activo(true)
                    .build());
        }
        asientoRepository.saveAll(asientos);
    }

    @Override
    @Transactional(readOnly = true)
    public ViajeResponse obtenerPorId(Long id) {
        Viaje viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id));
        long disponibles = asientoRepository.countDisponiblesByViajeId(id);
        return toResponse(viaje, disponibles);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ViajeResponse> buscarDisponibles(Long origenId, Long destinoId,
                                                  LocalDateTime desde, Pageable pageable) {
        return viajeRepository.buscarDisponibles(origenId, destinoId, desde, pageable)
                .map(v -> {
                    long disponibles = asientoRepository.countDisponiblesByViajeId(v.getId());
                    return toResponse(v, disponibles);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<AsientoResponse> obtenerAsientos(Long viajeId) {
        if (!viajeRepository.existsById(viajeId))
            throw new RecursoNoEncontradoException("Viaje", viajeId);
        return asientoRepository.findByViajeId(viajeId)
                .stream()
                .map(this::toAsientoResponse)
                .toList();
    }

    @Override
    @Transactional
    public ViajeResponse cambiarEstado(Long id, EstadoViaje nuevoEstado) {
        Viaje viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id));
        validarTransicionEstado(viaje.getEstado(), nuevoEstado);
        viaje.setEstado(nuevoEstado);
        if (nuevoEstado == EstadoViaje.FINALIZADO) {
            viaje.setFechaHoraLlegadaReal(LocalDateTime.now());
        }
        Viaje guardado = viajeRepository.save(viaje);
        long disponibles = asientoRepository.countDisponiblesByViajeId(id);
        return toResponse(guardado, disponibles);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ViajeResponse> listarPorChofer(Long choferId, Pageable pageable) {
        return viajeRepository.findByChoferIdOrderByFechaHoraSalidaDesc(choferId, pageable)
                .map(v -> toResponse(v, asientoRepository.countDisponiblesByViajeId(v.getId())));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Viaje viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id));
        if (viaje.getEstado() == EstadoViaje.EN_CURSO)
            throw new NegocioException("No se puede eliminar un viaje en curso");
        viaje.softDelete();
        viajeRepository.save(viaje);
    }

    private void validarTransicionEstado(EstadoViaje actual, EstadoViaje nuevo) {
        boolean valido = switch (actual) {
            case PROGRAMADO -> nuevo == EstadoViaje.EN_CURSO   || nuevo == EstadoViaje.CANCELADO;
            case EN_CURSO   -> nuevo == EstadoViaje.FINALIZADO || nuevo == EstadoViaje.CANCELADO;
            case FINALIZADO, CANCELADO -> false;
        };
        if (!valido)
            throw new NegocioException("Transición de estado inválida: " + actual + " → " + nuevo);
    }

    // ── Mapeo a DTOs ─────────────────────────────────────────────────────────

    public ViajeResponse toResponse(Viaje v, long asientosDisponibles) {
        return ViajeResponse.builder()
                .id(v.getId())
                .ruta(toRutaResponse(v.getRuta()))
                .bus(toBusResponse(v.getBus()))
                .choferNombre(v.getChofer() != null
                        ? v.getChofer().getNombres() + " " + v.getChofer().getApellidos() : null)
                .fechaHoraSalida(v.getFechaHoraSalida())
                .fechaHoraLlegadaEstimada(v.getFechaHoraLlegadaEstimada())
                .precioAdulto(v.getPrecioAdulto())
                .precioNino(v.getPrecioNino())
                .estado(v.getEstado())
                .asientosDisponibles((int) asientosDisponibles)
                .totalAsientos(v.getBus().getCapacidadAsientos())
                .build();
    }

    private RutaResponse toRutaResponse(Ruta r) {
        if (r == null) return null;
        return RutaResponse.builder()
                .id(r.getId()).codigo(r.getCodigo())
                .origen(toSucursalResponse(r.getOrigen()))
                .destino(toSucursalResponse(r.getDestino()))
                .distanciaKm(r.getDistanciaKm())
                .duracionHorasEstimada(r.getDuracionHorasEstimada())
                .precioBase(r.getPrecioBase())
                .build();
    }

    private SucursalResponse toSucursalResponse(Sucursal s) {
        if (s == null) return null;
        return SucursalResponse.builder()
                .id(s.getId()).codigo(s.getCodigo()).nombre(s.getNombre())
                .ciudad(s.getCiudad()).departamento(s.getDepartamento())
                .esTerminal(s.getEsTerminal())
                .build();
    }

    private BusResponse toBusResponse(Bus b) {
        if (b == null) return null;
        return BusResponse.builder()
                .id(b.getId()).placa(b.getPlaca()).marca(b.getMarca())
                .modelo(b.getModelo()).capacidadAsientos(b.getCapacidadAsientos())
                .numPisos(b.getNumPisos()).tipo(b.getTipo())
                .build();
    }

    public AsientoResponse toAsientoResponse(Asiento a) {
        return AsientoResponse.builder()
                .id(a.getId()).numeroAsiento(a.getNumeroAsiento())
                .fila(a.getFila()).columna(a.getColumna())
                .piso(a.getPiso()).tipo(a.getTipo()).estado(a.getEstado())
                .build();
    }
}
