package com.transporte.sistema.config;

import com.transporte.sistema.entity.*;
import com.transporte.sistema.enums.EstadoAsiento;
import com.transporte.sistema.enums.RolNombre;
import com.transporte.sistema.enums.TipoAsiento;
import com.transporte.sistema.enums.EstadoViaje;
import com.transporte.sistema.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Carga datos iniciales al arrancar la aplicacion.
 * - Crea roles, sucursal matriz y admin si no existen.
 * - Si hay buses y rutas en BD pero NO hay viajes activos,
 *   genera viajes de prueba automáticamente (útil en dev).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@SuppressWarnings("DataFlowIssue")
public class DataInitializer implements CommandLineRunner {

    private final RolRepository      rolRepository;
    private final UsuarioRepository  usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final BusRepository      busRepository;
    private final RutaRepository     rutaRepository;
    private final ViajeRepository    viajeRepository;
    private final AsientoRepository  asientoRepository;
    private final PasswordEncoder    passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        crearRoles();
        crearSucursalInicial();
        crearAdminInicial();
        crearViajesDePrueba();
    }

    // ── Roles ────────────────────────────────────────────────────────

    private void crearRoles() {
        if (rolRepository.count() == 0) {
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_ADMIN)
                    .descripcion("Administrador del sistema").build());
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_CAJERO)
                    .descripcion("Cajero de sucursal").build());
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_CHOFER)
                    .descripcion("Chofer de bus").build());
            rolRepository.save(Rol.builder().nombre(RolNombre.ROLE_CLIENTE)
                    .descripcion("Cliente portal").build());
            log.info("Roles iniciales creados");
        }
    }

    // ── Sucursal matriz ──────────────────────────────────────────────

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

    // ── Admin ────────────────────────────────────────────────────────

    private void crearAdminInicial() {
        if (!usuarioRepository.existsByUsername("admin")) {
            Rol rolAdmin = rolRepository.findByNombre(RolNombre.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Rol ADMIN no encontrado"));
            Sucursal sucursal = sucursalRepository.findAll().stream()
                    .filter(s -> Boolean.TRUE.equals(s.getActivo()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No hay sucursal disponible"));

            usuarioRepository.save(Usuario.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .nombres("Administrador")
                    .apellidos("Sistema")
                    .email("admin@transporte.com")
                    .rol(rolAdmin)
                    .sucursal(sucursal)
                    .primerLogin(false)
                    .activo(true)
                    .build());

            log.info("Usuario admin creado: username=admin / password=admin123");
            log.warn("CAMBIE LA CONTRASENA DEL ADMIN EN PRODUCCION");
        }
    }

    // ── Viajes de prueba ─────────────────────────────────────────────

    /**
     * Si hay buses y rutas en BD pero la tabla viajes está vacía,
     * genera viajes de prueba con fechas futuras para que aparezcan
     * en el portal y en el dashboard admin.
     */
    @Transactional
    public void crearViajesDePrueba() {
        long totalViajes = viajeRepository.count();
        if (totalViajes > 0) {
            log.info("Ya existen {} viaje(s) en BD — no se generan viajes de prueba", totalViajes);
            return;
        }

        List<Bus>  buses = busRepository.findAll().stream()
                .filter(b -> !Boolean.FALSE.equals(b.getActivo()))
                .toList();
        List<Ruta> rutas = rutaRepository.findAll().stream()
                .filter(r -> !Boolean.FALSE.equals(r.getActivo()))
                .toList();

        if (buses.isEmpty() || rutas.isEmpty()) {
            log.warn("Sin buses ({}) o rutas ({}) — no se pueden generar viajes de prueba. " +
                     "Crea al menos 1 bus y 1 ruta desde el panel admin para que se generen automáticamente.",
                    buses.size(), rutas.size());
            return;
        }

        // Precios por defecto si la ruta no tiene precio base
        record ViajeConfig(int diasOffset, String hora, BigDecimal precioAdulto, BigDecimal precioNino) {}

        List<ViajeConfig> configs = List.of(
                new ViajeConfig(1, "06:00", null, null),
                new ViajeConfig(1, "14:00", null, null),
                new ViajeConfig(2, "07:30", null, null),
                new ViajeConfig(3, "06:00", null, null),
                new ViajeConfig(4, "08:00", null, null),
                new ViajeConfig(5, "07:00", null, null)
        );

        int busIdx    = 0;
        int configIdx = 0;
        int creados   = 0;

        for (Ruta ruta : rutas) {
            // 1-2 viajes por ruta
            int viajesPorRuta = (creados % 3 == 0) ? 2 : 1;

            for (int v = 0; v < viajesPorRuta; v++) {
                ViajeConfig cfg = configs.get(configIdx % configs.size());
                Bus bus = buses.get(busIdx % buses.size());

                String[] partes   = cfg.hora().split(":");
                LocalDateTime salida = LocalDate.now()
                        .plusDays(cfg.diasOffset() + v)
                        .atTime(Integer.parseInt(partes[0]), Integer.parseInt(partes[1]));

                // Duración estimada basada en la ruta
                double horas = ruta.getDuracionHorasEstimada() != null
                        ? ruta.getDuracionHorasEstimada().doubleValue() : 3.0;
                LocalDateTime llegada = salida.plusMinutes((long)(horas * 60));

                // Precio: usar precio base de la ruta o un valor por defecto
                BigDecimal precioBase = ruta.getPrecioBase() != null
                        ? ruta.getPrecioBase() : BigDecimal.valueOf(20.00);
                BigDecimal precioNino = precioBase.multiply(BigDecimal.valueOf(0.7))
                        .setScale(2, java.math.RoundingMode.HALF_UP);

                Viaje viaje = Viaje.builder()
                        .ruta(ruta)
                        .bus(bus)
                        .chofer(null)
                        .fechaHoraSalida(salida)
                        .fechaHoraLlegadaEstimada(llegada)
                        .precioAdulto(precioBase)
                        .precioNino(precioNino)
                        .estado(EstadoViaje.PROGRAMADO)
                        .activo(true)
                        .build();

                viaje = viajeRepository.save(viaje);
                generarAsientos(viaje, bus);

                busIdx++;
                configIdx++;
                creados++;
            }
        }

        log.info("Viajes de prueba creados: {}", creados);
    }

    private void generarAsientos(Viaje viaje, Bus bus) {
        int total    = bus.getCapacidadAsientos();
        int columnas = 4;
        List<Asiento> lista = new ArrayList<>(total);

        for (int i = 1; i <= total; i++) {
            int fila = (int) Math.ceil((double) i / columnas);
            int col  = ((i - 1) % columnas) + 1;

            TipoAsiento tipo = (col == 1 || col == 4) ? TipoAsiento.VENTANA : TipoAsiento.PASILLO;
            String letra = switch (col) {
                case 1 -> "A"; case 2 -> "B"; case 3 -> "C"; case 4 -> "D";
                default -> String.valueOf(col);
            };

            lista.add(Asiento.builder()
                    .viaje(viaje)
                    .numeroAsiento(fila + letra)
                    .fila(fila)
                    .columna(col)
                    .piso(1)
                    .tipo(tipo)
                    .estado(EstadoAsiento.DISPONIBLE)
                    .activo(true)
                    .build());
        }
        asientoRepository.saveAll(lista);
    }
}
