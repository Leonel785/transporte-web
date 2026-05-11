package com.transporte.sistema.service.impl;

import com.transporte.sistema.dto.request.LoginRequest;
import com.transporte.sistema.dto.response.LoginResponse;
import com.transporte.sistema.entity.Cliente;
import com.transporte.sistema.entity.Usuario;
import com.transporte.sistema.repository.ClienteRepository;
import com.transporte.sistema.repository.UsuarioRepository;
import com.transporte.sistema.security.JwtUtil;
import com.transporte.sistema.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio de autenticación: valida credenciales y genera JWT.
 * Incluye clienteId en la respuesta si el usuario es un cliente.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // Delegar la autenticación a Spring Security (valida password con BCrypt)
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()));

        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        // Obtener datos completos del usuario para incluir en el token
        Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado en BD"));

        // Claims adicionales en el JWT (accesibles sin consultar la BD)
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", usuario.getRol().getNombre().name());
        claims.put("usuarioId", usuario.getId());
        if (usuario.getSucursal() != null) {
            claims.put("sucursalId", usuario.getSucursal().getId());
        }

        String token = jwtUtil.generarToken(userDetails, claims);

        // Obtener clienteId si existe (para usuarios ROLE_CLIENTE)
        Long clienteId = null;
        if ("ROLE_CLIENTE".equals(usuario.getRol().getNombre().name())) {
            Optional<Cliente> cliente = clienteRepository.findByUsuarioUsername(usuario.getUsername());
            if (cliente.isPresent()) {
                clienteId = cliente.get().getId();
            }
        }

        log.info("Login exitoso: {} [{}]",
                usuario.getUsername(), usuario.getRol().getNombre());

        return LoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .usuarioId(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombres() + " " +
                        (usuario.getApellidos() != null ? usuario.getApellidos() : ""))
                .rol(usuario.getRol().getNombre().name())
                .sucursalId(usuario.getSucursal() != null ? usuario.getSucursal().getId() : null)
                .sucursalNombre(usuario.getSucursal() != null ? usuario.getSucursal().getNombre() : null)
                .clienteId(clienteId) // ✅ Agregado
                .build();
    }
}