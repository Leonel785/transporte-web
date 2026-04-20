package com.transporte.sistema.service.impl;

import com.transporte.sistema.dto.request.ViajeRequest;
import com.transporte.sistema.dto.response.*;
import com.transporte.sistema.entity.*;
import com.transporte.sistema.enums.EstadoAsiento;
import com.transporte.sistema.enums.EstadoViaje;
import com.transporte.sistema.enums.TipoAsiento;
import com.transporte.sistema.exception.ConflictoException;
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
@SuppressWarnings("DataFlowIssue")
public class ViajeServiceImpl implements ViajeService {

    private final ViajeRepository   viajeRepository;
    private final RutaRepository    rutaRepository;
    private final BusRepository     busRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsientoRepository asientoRepository;
    private final BoletoRepository  boletoRepository;

    // ── Crear viaje ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ViajeResponse crear(ViajeRequest request) {
        Ruta ruta = rutaRepository.findById(request.getRutaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Ruta", request.getRutaId()));
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Bus", request.getBusId()));

        validarDisponibilidadBus(bus.getId(),
                request.getFechaHoraSalida(),
                request.getFechaHoraLlegadaEstimada(),
                null);

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

        viaje = viajeRepository.save(viaje);
        generarAsientos(viaje, bus);

        log.info("Viaje creado: id={} | {} → {} | {}",
                viaje.getId(),
                ruta.getOrigen().getCiudad(),
                ruta.getDestino().getCiudad(),
                viaje.getFechaHoraSalida());

        return toResponse(viaje);
    }

    // ── Actualizar viaje ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public ViajeResponse actualizar(Long id, ViajeRequest request) {
        Viaje viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id));

        Ruta ruta = rutaRepository.findById(request.getRutaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Ruta", request.getRutaId()));
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Bus", request.getBusId()));

        validarDisponibilidadBus(bus.getId(),
                request.getFechaHoraSalida(),
                request.getFechaHoraLlegadaEstimada(),
                id);

        Usuario chofer = null;
        if (request.getChoferId() != null) {
            chofer = usuarioRepository.findById(request.getChoferId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Chofer", request.getChoferId()));
        }

        viaje.setRuta(ruta);
        viaje.setBus(bus);
        viaje.setChofer(chofer);
        viaje.setFechaHoraSalida(request.getFechaHoraSalida());
        viaje.setFechaHoraLlegadaEstimada(request.getFechaHoraLlegadaEstimada());
        viaje.setPrecioAdulto(request.getPrecioAdulto());
        viaje.setPrecioNino(request.getPrecioNino());
        if (request.getObservaciones() != null) viaje.setObservaciones(request.getObservaciones());

        // ── FIX: aplicar cambio de estado si viene en el request ──────────
        if (request.getEstado() != null && request.getEstado() != viaje.getEstado()) {
            validarTransicionEstado(viaje.getEstado(), request.getEstado());
            viaje.setEstado(request.getEstado());
            if (request.getEstado() == EstadoViaje.FINALIZADO) {
                viaje.setFechaHoraLlegadaReal(LocalDateTime.now());
            }
        }

        log.info("Viaje actualizado: id={} | estado={}", id, viaje.getEstado());
        return toResponse(viajeRepository.save(viaje));
    }

    // ── Consultas ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ViajeResponse> listar() {
        return viajeRepository.findAll().stream()
                .filter(v -> !Boolean.FALSE.equals(v.getActivo()))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ViajeResponse obtenerPorId(Long id) {
        return toResponse(viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id)));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ViajeResponse> buscarDisponibles(
            Long origenId, Long destinoId, LocalDateTime desde, Pageable pageable) {
        return viajeRepository.buscarDisponibles(origenId, destinoId, desde, pageable)
                .map(this::toResponseLigero);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AsientoResponse> obtenerAsientos(Long viajeId) {
        viajeRepository.findById(viajeId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", viajeId));
        return asientoRepository.findByViajeId(viajeId)
                .stream()
                .map(this::toAsientoResponse)
                .toList();
    }

    // ── Cambio de estado ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public ViajeResponse cambiarEstado(Long id, EstadoViaje nuevoEstado) {
        Viaje viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id));

        validarTransicionEstado(viaje.getEstado(), nuevoEstado);

        viaje.setEstado(nuevoEstado);
        if (nuevoEstado == EstadoViaje.FINALIZADO && viaje.getFechaHoraLlegadaEstimada() != null) {
            viaje.setFechaHoraLlegadaReal(LocalDateTime.now());
        }
        log.info("Viaje {} cambió estado: {} → {}", id, viaje.getEstado(), nuevoEstado);
        return toResponse(viajeRepository.save(viaje));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ViajeResponse> listarPorChofer(Long choferId, Pageable pageable) {
        return viajeRepository.findByChoferIdOrderByFechaHoraSalidaDesc(choferId, pageable)
                .map(this::toResponse);
    }

    // ── Eliminar ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void eliminar(Long id) {
        Viaje viaje = viajeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Viaje", id));

        if (viaje.getEstado() == EstadoViaje.EN_CURSO) {
            throw new NegocioException("No se puede eliminar un viaje en curso");
        }

        long boletosActivos = boletoRepository.countByViajeIdAndEstadoActivo(viaje.getId());
        if (boletosActivos > 0) {
            throw new NegocioException(
                    "No se puede eliminar el viaje porque tiene " + boletosActivos + " boleto(s) activo(s)");
        }

        viaje.softDelete();
        viajeRepository.save(viaje);
        log.info("Viaje {} eliminado (soft delete)", id);
    }

    // ── Validaciones privadas ────────────────────────────────────────────────

    private void validarDisponibilidadBus(Long busId, LocalDateTime inicio,
                                           LocalDateTime fin, Long excludeViajeId) {
        if (inicio == null || fin == null) return;
        if (inicio.isAfter(fin)) {
            throw new NegocioException("La fecha de salida debe ser anterior a la llegada estimada");
        }
        List<Viaje> solapados = viajeRepository.findByBusIdEnRango(busId, inicio, fin);
        solapados.removeIf(v -> v.getId().equals(excludeViajeId));
        if (!solapados.isEmpty()) {
            throw new ConflictoException(
                    "El bus ya tiene un viaje en ese horario (id: " + solapados.get(0).getId() + ")");
        }
    }

    /**
     * Transiciones permitidas:
     *   PROGRAMADO → EN_CURSO | CANCELADO
     *   EN_CURSO   → FINALIZADO | CANCELADO
     *   FINALIZADO | CANCELADO → ninguno
     */
    private void validarTransicionEstado(EstadoViaje actual, EstadoViaje nuevo) {
        boolean valida = switch (actual) {
            case PROGRAMADO -> nuevo == EstadoViaje.EN_CURSO   || nuevo == EstadoViaje.CANCELADO;
            case EN_CURSO   -> nuevo == EstadoViaje.FINALIZADO || nuevo == EstadoViaje.CANCELADO;
            case FINALIZADO, CANCELADO -> false;
        };
        if (!valida) {
            throw new NegocioException(
                    "Transición de estado inválida: " + actual + " → " + nuevo);
        }
    }

    // ── Generación de asientos ───────────────────────────────────────────────

    private void generarAsientos(Viaje viaje, Bus bus) {
        int total    = bus.getCapacidadAsientos();
        int columnas = 4;
        List<Asiento> lista = new ArrayList<>(total);

        for (int i = 1; i <= total; i++) {
            int fila = (int) Math.ceil((double) i / columnas);
            int col  = ((i - 1) % columnas) + 1;

            TipoAsiento tipo = (col == 1 || col == 4) ? TipoAsiento.VENTANA : TipoAsiento.PASILLO;

            String letra = switch (col) {
                case 1 -> "A";
                case 2 -> "B";
                case 3 -> "C";
                case 4 -> "D";
                default -> String.valueOf(col);
            };

            lista.add(Asiento.builder()
                    .viaje(viaje)
                    .numeroAsiento(fila + letra)
                    .fila(fila)
                    .columna(col)
                    .piso(1)
                    .tipo(tipo)
                    .estado(EstadoAsiento.DISPONIBLE)
                    .activo(true)
                    .build());
        }
        asientoRepository.saveAll(lista);
        log.info("Generados {} asientos para viaje {}", lista.size(), viaje.getId());
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private ViajeResponse toResponse(Viaje v) {
        if (v == null) return null;

        long disponibles = 0;
        try {
            disponibles = asientoRepository.countDisponiblesByViajeId(v.getId());
        } catch (Exception e) {
            log.warn("No se pudo contar asientos del viaje {}: {}", v.getId(), e.getMessage());
        }

        Bus bus   = v.getBus();
        Ruta ruta = v.getRuta();

        return ViajeResponse.builder()
                .id(v.getId())
                .ruta(toRutaResponse(ruta))
                .bus(toBusResponse(bus))
                .choferId(v.getChofer() != null ? v.getChofer().getId() : null)
                .choferNombre(v.getChofer() != null
                        ? v.getChofer().getNombres() + " " + v.getChofer().getApellidos()
                        : null)
                .fechaHoraSalida(v.getFechaHoraSalida())
                .fechaHoraLlegadaEstimada(v.getFechaHoraLlegadaEstimada())
                .precioAdulto(v.getPrecioAdulto())
                .precioNino(v.getPrecioNino())
                .estado(v.getEstado())
                .asientosDisponibles((int) disponibles)
                .totalAsientos(bus != null && bus.getCapacidadAsientos() != null
                        ? bus.getCapacidadAsientos() : 0)
                .build();
    }

    private ViajeResponse toResponseLigero(Viaje v) {
        if (v == null) return null;
        Bus bus = v.getBus();

        long disponibles = v.getAsientos() != null
                ? v.getAsientos().stream()
                    .filter(a -> EstadoAsiento.DISPONIBLE.equals(a.getEstado()))
                    .count()
                : 0;

        return ViajeResponse.builder()
                .id(v.getId())
                .ruta(toRutaResponse(v.getRuta()))
                .bus(toBusResponse(bus))
                .choferId(v.getChofer() != null ? v.getChofer().getId() : null)
                .choferNombre(v.getChofer() != null
                        ? v.getChofer().getNombres() + " " + v.getChofer().getApellidos()
                        : null)
                .fechaHoraSalida(v.getFechaHoraSalida())
                .fechaHoraLlegadaEstimada(v.getFechaHoraLlegadaEstimada())
                .precioAdulto(v.getPrecioAdulto())
                .precioNino(v.getPrecioNino())
                .estado(v.getEstado())
                .asientosDisponibles((int) disponibles)
                .totalAsientos(bus != null && bus.getCapacidadAsientos() != null
                        ? bus.getCapacidadAsientos() : 0)
                .build();
    }

    private RutaResponse toRutaResponse(Ruta r) {
        if (r == null) return null;
        return RutaResponse.builder()
                .id(r.getId())
                .codigo(r.getCodigo())
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
                .id(s.getId())
                .codigo(s.getCodigo())
                .nombre(s.getNombre())
                .ciudad(s.getCiudad())
                .departamento(s.getDepartamento())
                .esTerminal(s.getEsTerminal())
                .build();
    }

    private BusResponse toBusResponse(Bus b) {
        if (b == null) return null;
        return BusResponse.builder()
                .id(b.getId())
                .placa(b.getPlaca())
                .marca(b.getMarca())
                .modelo(b.getModelo())
                .capacidadAsientos(b.getCapacidadAsientos())
                .numPisos(b.getNumPisos())
                .tipo(b.getTipo())
                .activo(b.getActivo())
                .build();
    }

    private AsientoResponse toAsientoResponse(Asiento a) {
        return AsientoResponse.builder()
                .id(a.getId())
                .numeroAsiento(a.getNumeroAsiento())
                .fila(a.getFila())
                .columna(a.getColumna())
                .piso(a.getPiso())
                .tipo(a.getTipo())
                .estado(a.getEstado())
                .build();
    }
}