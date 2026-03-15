package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.ClienteRequest;
import com.transporte.sistema.dto.response.ApiResponse;
import com.transporte.sistema.dto.response.ClienteResponse;
import com.transporte.sistema.service.ClienteService;
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
 * CRUD de clientes.
 * - ADMIN y CAJERO pueden crear/actualizar
 * - Todos los autenticados pueden consultar
 */
@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    /** Buscar clientes por nombre o DNI/RUC */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<Page<ClienteResponse>> listar(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(clienteService.buscar(q, pageable));
        }
        return ResponseEntity.ok(clienteService.listarTodos(pageable));
    }

    /** Obtener cliente por ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO','CHOFER')")
    public ResponseEntity<ClienteResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.obtenerPorId(id));
    }

    /** Obtener cliente por DNI/RUC (útil en caja: buscar cliente rápido) */
    @GetMapping("/dni/{dniRuc}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<ClienteResponse> obtenerPorDni(@PathVariable String dniRuc) {
        return ResponseEntity.ok(clienteService.obtenerPorDniRuc(dniRuc));
    }

    /** Registrar nuevo cliente */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<ClienteResponse> crear(@Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(request));
    }

    /** Actualizar cliente */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CAJERO')")
    public ResponseEntity<ClienteResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.actualizar(id, request));
    }

    /** Eliminar cliente (soft delete) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok("Cliente eliminado correctamente", null));
    }
}
