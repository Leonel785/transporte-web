package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.RutaRequest;
import com.transporte.sistema.dto.response.ApiResponse;
import com.transporte.sistema.dto.response.RutaResponse;
import com.transporte.sistema.dto.response.SucursalResponse;
import com.transporte.sistema.entity.Ruta;
import com.transporte.sistema.exception.ConflictoException;
import com.transporte.sistema.exception.RecursoNoEncontradoException;
import com.transporte.sistema.repository.RutaRepository;
import com.transporte.sistema.repository.SucursalRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CRUD de rutas. Los GETs son públicos (usados en portal de consulta).
 */
@RestController
@RequestMapping("/api/v1/rutas")
@RequiredArgsConstructor
public class RutaController {

    private final RutaRepository rutaRepository;
    private final SucursalRepository sucursalRepository;

    @GetMapping
    public ResponseEntity<List<RutaResponse>> listar() {
        List<RutaResponse> rutas = rutaRepository.findAll().stream()
                .filter(r -> r.getActivo() != null && r.getActivo())
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(rutas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RutaResponse> obtener(@PathVariable Long id) {
        Ruta ruta = rutaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ruta", id));
        return ResponseEntity.ok(toResponse(ruta));
    }

    @GetMapping("/origen/{origenId}")
    public ResponseEntity<List<RutaResponse>> listarPorOrigen(@PathVariable Long origenId) {
        return ResponseEntity.ok(
                rutaRepository.findByOrigenIdAndActivoTrue(origenId).stream()
                        .map(this::toResponse).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RutaResponse> crear(@Valid @RequestBody RutaRequest request) {
        if (rutaRepository.existsByCodigo(request.getCodigo()))
            throw new ConflictoException("Ya existe una ruta con código: " + request.getCodigo());

        var origen = sucursalRepository.findById(request.getOrigenId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sucursal origen", request.getOrigenId()));
        var destino = sucursalRepository.findById(request.getDestinoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sucursal destino", request.getDestinoId()));

        Ruta ruta = Ruta.builder()
                .codigo(request.getCodigo())
                .origen(origen)
                .destino(destino)
                .distanciaKm(request.getDistanciaKm())
                .duracionHorasEstimada(request.getDuracionHorasEstimada())
                .precioBase(request.getPrecioBase())
                .descripcion(request.getDescripcion())
                .activo(true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(rutaRepository.save(ruta)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        Ruta ruta = rutaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ruta", id));
        ruta.softDelete();
        rutaRepository.save(ruta);
        return ResponseEntity.ok(ApiResponse.ok("Ruta eliminada", null));
    }

    private RutaResponse toResponse(Ruta r) {
        SucursalResponse origen = r.getOrigen() != null ? SucursalResponse.builder()
                .id(r.getOrigen().getId()).codigo(r.getOrigen().getCodigo())
                .nombre(r.getOrigen().getNombre()).ciudad(r.getOrigen().getCiudad())
                .departamento(r.getOrigen().getDepartamento())
                .esTerminal(r.getOrigen().getEsTerminal()).build() : null;

        SucursalResponse destino = r.getDestino() != null ? SucursalResponse.builder()
                .id(r.getDestino().getId()).codigo(r.getDestino().getCodigo())
                .nombre(r.getDestino().getNombre()).ciudad(r.getDestino().getCiudad())
                .departamento(r.getDestino().getDepartamento())
                .esTerminal(r.getDestino().getEsTerminal()).build() : null;

        return RutaResponse.builder()
                .id(r.getId()).codigo(r.getCodigo())
                .origen(origen).destino(destino)
                .distanciaKm(r.getDistanciaKm())
                .duracionHorasEstimada(r.getDuracionHorasEstimada())
                .precioBase(r.getPrecioBase())
                .build();
    }
}
