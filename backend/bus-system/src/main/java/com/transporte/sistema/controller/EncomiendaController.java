package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.ActualizarEstadoEncomiendaRequest;
import com.transporte.sistema.dto.request.EncomiendaRequest;
import com.transporte.sistema.dto.response.EncomiendaResponse;
import com.transporte.sistema.dto.response.MovimientoEncomiendaResponse;
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

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/encomiendas")
@RequiredArgsConstructor
public class EncomiendaController {

    private final EncomiendaService encomiendaService;

    // ── Endpoints existentes ─────────────────────────────────────────────────

    /** Tracking público por número de guía */
    @GetMapping("/tracking/{numeroGuia}")
    public ResponseEntity<EncomiendaResponse> tracking(@PathVariable String numeroGuia) {
        return ResponseEntity.ok(encomiendaService.obtenerPorGuia(numeroGuia));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<EncomiendaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(encomiendaService.obtenerPorId(id));
    }

    @GetMapping("/remitente/{remitenteId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<Page<EncomiendaResponse>> listarPorRemitente(
            @PathVariable Long remitenteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(encomiendaService.listarPorRemitente(
                remitenteId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/sucursal/{sucursalId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<Page<EncomiendaResponse>> listarPorSucursal(
            @PathVariable Long sucursalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(encomiendaService.listarPorSucursalOrigen(
                sucursalId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<EncomiendaResponse> registrar(@Valid @RequestBody EncomiendaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(encomiendaService.registrar(request));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<EncomiendaResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoEncomiendaRequest request) {
        return ResponseEntity.ok(encomiendaService.actualizarEstado(id, request));
    }

    // ── Portal cliente ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/encomiendas/mis-encomiendas
     * Encomiendas del cliente autenticado (como remitente).
     */
    @GetMapping("/mis-encomiendas")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<List<EncomiendaResponse>> misEncomiendas(Principal principal) {
        return ResponseEntity.ok(encomiendaService.misEncomiendas(principal.getName()));
    }

    /**
     * GET /api/v1/encomiendas/{id}/movimientos
     * Tracking detallado de una encomienda.
     * CLIENTE solo puede ver las suyas; ADMIN/CAJERO pueden ver todas.
     */
    @GetMapping("/{id}/movimientos")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CLIENTE')")
    public ResponseEntity<List<MovimientoEncomiendaResponse>> movimientos(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(encomiendaService.obtenerMovimientos(id, principal.getName()));
    }
}
