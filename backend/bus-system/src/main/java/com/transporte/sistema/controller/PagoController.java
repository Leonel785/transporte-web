package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.CrearPagoRequest;
import com.transporte.sistema.dto.response.PagoResponse;
import com.transporte.sistema.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint para procesar pagos (simulado).
 * En producción, integrar con Culqi, Stripe, etc.
 */
@RestController
@RequestMapping("/api/v1/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    /**
     * POST /api/v1/pagos
     * Procesa un pago y crea el registro en BD.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PagoResponse> procesarPago(
            @Valid @RequestBody CrearPagoRequest request) {
        PagoResponse pago = pagoService.procesarPago(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }
}