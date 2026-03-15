package com.transporte.sistema.config;

import com.transporte.sistema.entity.Rol;
import com.transporte.sistema.entity.Sucursal;
import com.transporte.sistema.entity.Usuario;
import com.transporte.sistema.enums.RolNombre;
import com.transporte.sistema.repository.RolRepository;
import com.transporte.sistema.repository.SucursalRepository;
import com.transporte.sistema.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Carga datos iniciales al arrancar la aplicacion.
 * NOTA: @SuperBuilder no propaga defaults de BaseEntity (activo=true),
 * por eso se establece .activo(true) explicitamente en cada builder.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        crearRoles();
        crearSucursalInicial();
        crearAdminInicial();
    }

    private void crearRoles() {
        if (rolRepository.count() == 0) {
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_ADMIN).descripcion("Administrador del sistema").build());
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_CAJERO).descripcion("Cajero de sucursal").build());
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_CHOFER).descripcion("Chofer de bus").build());
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_CLIENTE).descripcion("Cliente portal").build());
            log.info("Roles iniciales creados");
        }
    }

    private void crearSucursalInicial() {
        if (sucursalRepository.count() == 0) {
            sucursalRepository.save(Sucursal.builder()
                    .codigo("MATRIZ")
                    .nombre("Terminal Principal - Lima")
                    .ciudad("Lima")
                    .departamento("Lima")
                    .esTerminal(true)
                    .activo(true)
                    .build());
            log.info("Sucursal matriz creada");
        }
    }

    private void crearAdminInicial() {
        if (!usuarioRepository.existsByUsername("admin")) {
            Rol rolAdmin = rolRepository.findByNombre(RolNombre.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Rol ADMIN no encontrado"));
            Sucursal sucursal = sucursalRepository.findByCodigo("MATRIZ")
                    .orElseThrow(() -> new RuntimeException("Sucursal MATRIZ no encontrada"));

            Usuario admin = Usuario.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .nombres("Administrador")
                    .apellidos("Sistema")
                    .email("admin@transporte.com")
                    .rol(rolAdmin)
                    .sucursal(sucursal)
                    .primerLogin(false)
                    .activo(true)
                    .build();

            usuarioRepository.save(admin);
            log.info("Usuario admin creado: username=admin / password=admin123");
            log.warn("CAMBIE LA CONTRASENA DEL ADMIN EN PRODUCCION");
        }
    }
}
