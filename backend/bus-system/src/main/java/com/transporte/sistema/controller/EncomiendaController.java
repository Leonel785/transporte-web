package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.ActualizarEstadoEncomiendaRequest;
import com.transporte.sistema.dto.request.EncomiendaRequest;
import com.transporte.sistema.dto.response.EncomiendaResponse;
import com.transporte.sistema.service.EncomiendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Gestión de encomiendas: registro, tracking y entrega.
 * El endpoint de tracking es público para que el destinatario consulte sin login.
 */
@RestController
@RequestMapping("/api/v1/encomiendas")
@RequiredArgsConstructor
public class EncomiendaController {

    private final EncomiendaService encomiendaService;

    /**
     * Tracking público por número de guía.
     * Ejemplo: GET /api/v1/encomiendas/tracking/GUI-20241201-000001
     */
    @GetMapping("/tracking/{numeroGuia}")
    public ResponseEntity<EncomiendaResponse> tracking(@PathVariable String numeroGuia) {
        return ResponseEntity.ok(encomiendaService.obtenerPorGuia(numeroGuia));
    }

    /** Obtener encomienda por ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<EncomiendaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(encomiendaService.obtenerPorId(id));
    }

    /** Listar encomiendas por remitente */
    @GetMapping("/remitente/{remitenteId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<Page<EncomiendaResponse>> listarPorRemitente(
            @PathVariable Long remitenteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(encomiendaService.listarPorRemitente(
                remitenteId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    /** Listar encomiendas recibidas en una sucursal */
    @GetMapping("/sucursal/{sucursalId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<Page<EncomiendaResponse>> listarPorSucursal(
            @PathVariable Long sucursalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(encomiendaService.listarPorSucursalOrigen(
                sucursalId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    /**
     * Registrar nueva encomienda en caja.
     * Solo CAJERO o ADMIN.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<EncomiendaResponse> registrar(@Valid @RequestBody EncomiendaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(encomiendaService.registrar(request));
    }

    /**
     * Actualizar estado de la encomienda (genera movimiento de tracking).
     * CAJERO puede mover a EN_ALMACEN, LISTO_ENTREGA, ENTREGADO.
     * CHOFER puede mover a EN_TRANSITO, EN_DESTINO.
     * ADMIN puede mover a cualquier estado.
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<EncomiendaResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoEncomiendaRequest request) {
        return ResponseEntity.ok(encomiendaService.actualizarEstado(id, request));
    }
}
