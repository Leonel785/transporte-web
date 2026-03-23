package com.transporte.sistema.service.impl;

import com.transporte.sistema.dto.request.ClienteRequest;
import com.transporte.sistema.dto.request.RegistroClienteRequest;
import com.transporte.sistema.dto.response.ClienteResponse;
import com.transporte.sistema.dto.response.LoginResponse;
import com.transporte.sistema.entity.Cliente;
import com.transporte.sistema.entity.Rol;
import com.transporte.sistema.entity.Usuario;
import com.transporte.sistema.enums.RolNombre;
import com.transporte.sistema.enums.TipoCliente;
import com.transporte.sistema.exception.ConflictoException;
import com.transporte.sistema.exception.NegocioException;
import com.transporte.sistema.exception.RecursoNoEncontradoException;
import com.transporte.sistema.repository.ClienteRepository;
import com.transporte.sistema.repository.RolRepository;
import com.transporte.sistema.repository.UsuarioRepository;
import com.transporte.sistema.security.JwtUtil;
import com.transporte.sistema.service.ClienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository   clienteRepository;
    private final UsuarioRepository   usuarioRepository;
    private final RolRepository       rolRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtUtil             jwtUtil;
    private final UserDetailsService  userDetailsService;

    // ── CRUD existente ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        if (clienteRepository.existsByDniRuc(request.getDniRuc())) {
            throw new ConflictoException("Ya existe un cliente con DNI/RUC: " + request.getDniRuc());
        }
        Cliente cliente = toEntity(request);
        Cliente guardado = clienteRepository.save(cliente);
        log.info("Cliente creado: {} - {}", guardado.getId(), guardado.getDniRuc());
        return toResponse(guardado);
    }

    @Override
    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = obtenerEntidad(id);
        if (!cliente.getDniRuc().equals(request.getDniRuc()) &&
                clienteRepository.existsByDniRuc(request.getDniRuc())) {
            throw new ConflictoException("DNI/RUC ya está en uso: " + request.getDniRuc());
        }
        actualizarDesdeRequest(cliente, request);
        return toResponse(clienteRepository.save(cliente));
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorId(Long id) {
        return toResponse(obtenerEntidad(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorDniRuc(String dniRuc) {
        Cliente cliente = clienteRepository.findByDniRuc(dniRuc)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Cliente con DNI/RUC " + dniRuc + " no encontrado"));
        return toResponse(cliente);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> buscar(String query, Pageable pageable) {
        return clienteRepository.buscarPorNombreODocumento(query, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> listarTodos(Pageable pageable) {
        return clienteRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = obtenerEntidad(id);
        cliente.softDelete();
        clienteRepository.save(cliente);
        log.info("Cliente {} eliminado (soft delete)", id);
    }

    // ── Portal self-service ──────────────────────────────────────────────────

    /**
     * Registro público desde el portal web.
     * Crea un Usuario con rol ROLE_CLIENTE y un Cliente vinculado.
     * Devuelve JWT para auto-login inmediato tras el registro.
     */
    @Override
    @Transactional
    public LoginResponse registrarConCuenta(RegistroClienteRequest request) {

        // 1. Validar unicidad de username
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new ConflictoException("El nombre de usuario '" + request.getUsername() + "' ya está en uso");
        }

        // 2. Validar unicidad de DNI/RUC
        if (clienteRepository.existsByDniRuc(request.getDniRuc())) {
            throw new ConflictoException("Ya existe una cuenta registrada con el DNI/RUC: " + request.getDniRuc());
        }

        // 3. Validar unicidad de email (si se proporcionó)
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && usuarioRepository.existsByEmail(request.getEmail())) {
            throw new ConflictoException("El correo '" + request.getEmail() + "' ya está registrado");
        }

        // 4. Obtener el rol ROLE_CLIENTE
        Rol rolCliente = rolRepository.findByNombre(RolNombre.ROLE_CLIENTE)
                .orElseThrow(() -> new NegocioException(
                        "Rol ROLE_CLIENTE no encontrado. Ejecuta la migración V2__cliente_portal.sql"));

        // 5. Crear Usuario
        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .rol(rolCliente)
                .primerLogin(false)
                .activo(true)
                .build();
        usuario = usuarioRepository.save(usuario);

        // 6. Crear Cliente vinculado al Usuario
        Cliente cliente = Cliente.builder()
                .dniRuc(request.getDniRuc())
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .tipoCliente(TipoCliente.PERSONA)
                .usuario(usuario)
                .activo(true)
                .build();
        cliente = clienteRepository.save(cliente);

        // 7. Generar JWT con los claims del sistema (mismo formato que AuthServiceImpl)
        UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getUsername());
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", RolNombre.ROLE_CLIENTE.name());
        claims.put("usuarioId", usuario.getId());
        String token = jwtUtil.generarToken(userDetails, claims);

        log.info("Nuevo cliente registrado: {} [{}]", usuario.getUsername(), request.getDniRuc());

        return LoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .usuarioId(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(request.getNombres() + " " + request.getApellidos())
                .rol(RolNombre.ROLE_CLIENTE.name())
                .sucursalId(null)
                .sucursalNombre(null)
                .clienteId(cliente.getId())
                .build();
    }

    /**
     * Obtener perfil del cliente autenticado por su username (extraído del JWT).
     */
    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorUsername(String username) {
        Cliente cliente = clienteRepository.findByUsuarioUsername(username)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Perfil de cliente no encontrado para el usuario: " + username));
        return toResponse(cliente);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Cliente obtenerEntidad(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", id));
    }

    private Cliente toEntity(ClienteRequest r) {
        return Cliente.builder()
                .dniRuc(r.getDniRuc())
                .nombres(r.getNombres())
                .apellidos(r.getApellidos())
                .razonSocial(r.getRazonSocial())
                .telefono(r.getTelefono())
                .email(r.getEmail())
                .direccion(r.getDireccion())
                .distrito(r.getDistrito())
                .ciudad(r.getCiudad())
                .tipoCliente(r.getTipoCliente())
                .activo(true)
                .build();
    }

    private void actualizarDesdeRequest(Cliente c, ClienteRequest r) {
        c.setDniRuc(r.getDniRuc());
        c.setNombres(r.getNombres());
        c.setApellidos(r.getApellidos());
        c.setRazonSocial(r.getRazonSocial());
        c.setTelefono(r.getTelefono());
        c.setEmail(r.getEmail());
        c.setDireccion(r.getDireccion());
        c.setDistrito(r.getDistrito());
        c.setCiudad(r.getCiudad());
        c.setTipoCliente(r.getTipoCliente());
    }

    public ClienteResponse toResponse(Cliente c) {
        return ClienteResponse.builder()
                .id(c.getId())
                .dniRuc(c.getDniRuc())
                .nombres(c.getNombres())
                .apellidos(c.getApellidos())
                .razonSocial(c.getRazonSocial())
                .nombreCompleto(c.getNombreCompleto())
                .telefono(c.getTelefono())
                .email(c.getEmail())
                .direccion(c.getDireccion())
                .distrito(c.getDistrito())
                .ciudad(c.getCiudad())
                .tipoCliente(c.getTipoCliente())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
