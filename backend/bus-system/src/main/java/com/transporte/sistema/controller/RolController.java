package com.transporte.sistema.controller;

import com.transporte.sistema.entity.Rol;
import com.transporte.sistema.repository.RolRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoint público de lectura para roles del sistema.
 * Usado por el formulario de creación/edición de usuarios en AdminDashboard.
 */
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RolController {

    private final RolRepository rolRepository;

    /** Lista todos los roles disponibles (sin auth requerida — ver SecurityConfig). */
    @GetMapping
    public ResponseEntity<List<RolResponse>> listar() {
        List<RolResponse> roles = rolRepository.findAll().stream()
                .map(r -> new RolResponse(r.getId(), r.getNombre().name(), r.getDescripcion()))
                .toList();
        return ResponseEntity.ok(roles);
    }

    @Data
    static class RolResponse {
        private final Long id;
        private final String nombre;
        private final String descripcion;
    }
}
