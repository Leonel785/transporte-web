package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.BoletoRequest;
import com.transporte.sistema.dto.response.ApiResponse;
import com.transporte.sistema.dto.response.BoletoResponse;
import com.transporte.sistema.service.BoletoService;
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
 * Venta y gestión de boletos/pasajes.
 * Incluye endpoint de escaneo QR para abordaje.
 */
@RestController
@RequestMapping("/api/v1/boletos")
@RequiredArgsConstructor
public class BoletoController {

    private final BoletoService boletoService;

    /** Obtener boleto por ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<BoletoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(boletoService.obtenerPorId(id));
    }

    /** Obtener boleto por número (ej: BOL-20241201-000001) */
    @GetMapping("/numero/{numeroBoleto}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<BoletoResponse> obtenerPorNumero(@PathVariable String numeroBoleto) {
        return ResponseEntity.ok(boletoService.obtenerPorNumero(numeroBoleto));
    }

    /** Listar boletos de un cliente */
    @GetMapping("/cliente/{clienteId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<Page<BoletoResponse>> listarPorCliente(
            @PathVariable Long clienteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(boletoService.listarPorCliente(
                clienteId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    /** Listar boletos de un viaje (manifiesto) */
    @GetMapping("/viaje/{viajeId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<Page<BoletoResponse>> listarPorViaje(
            @PathVariable Long viajeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(boletoService.listarPorViaje(
                viajeId, PageRequest.of(page, size)));
    }

    /**
     * Vender un boleto (reservar asiento + registrar pago).
     * Solo CAJERO o ADMIN pueden emitir boletos.
     */
    @PostMapping("/vender")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<BoletoResponse> vender(@Valid @RequestBody BoletoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boletoService.vender(request));
    }

    /**
     * Escanear QR para confirmar abordaje del pasajero.
     * Solo CHOFER o ADMIN pueden hacer el check-in.
     */
    @PostMapping("/escanear")
    @PreAuthorize("hasAnyRole('ADMIN','CHOFER')")
    public ResponseEntity<BoletoResponse> escanear(@RequestParam String codigoQr) {
        return ResponseEntity.ok(boletoService.escanearQr(codigoQr));
    }

    /** Cancelar un boleto */
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<BoletoResponse> cancelar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(boletoService.cancelar(id, motivo));
    }
}
