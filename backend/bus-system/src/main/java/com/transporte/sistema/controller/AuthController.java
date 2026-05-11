package com.transporte.sistema.controller;

import com.transporte.sistema.dto.request.LoginRequest;
import com.transporte.sistema.dto.response.LoginResponse;
import com.transporte.sistema.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint de autenticación.
 * POST /api/v1/auth/login → devuelve JWT Bearer token
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Login del sistema.
     * Devuelve un JWT que debe incluirse en el header:
     * Authorization: Bearer <token>
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
