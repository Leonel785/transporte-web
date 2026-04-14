package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Viaje;
import com.transporte.sistema.enums.EstadoViaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {

    @NonNull
    @EntityGraph(attributePaths = {"ruta", "ruta.origen", "ruta.destino", "bus", "bus.sucursal", "chofer"})
    List<Viaje> findAll();

    @EntityGraph(attributePaths = {"ruta", "ruta.origen", "ruta.destino", "bus", "chofer"})
    List<Viaje> findByEstado(EstadoViaje estado);

    @EntityGraph(attributePaths = {"ruta", "ruta.origen", "ruta.destino", "bus", "chofer"})
    @Query("SELECT v FROM Viaje v WHERE v.ruta.origen.id = :origenId " +
           "AND v.ruta.destino.id = :destinoId " +
           "AND v.estado = 'PROGRAMADO' " +
           "AND (:desde IS NULL OR v.fechaHoraSalida >= :desde) " +
           "AND (v.activo IS NULL OR v.activo = true)")
    Page<Viaje> buscarDisponibles(
            @Param("origenId") Long origenId,
            @Param("destinoId") Long destinoId,
            @Param("desde") LocalDateTime desde,
            Pageable pageable);

    @EntityGraph(attributePaths = {"ruta", "ruta.origen", "ruta.destino", "bus", "chofer"})
    Page<Viaje> findByChoferIdOrderByFechaHoraSalidaDesc(Long choferId, Pageable pageable);

    @Query("SELECT v FROM Viaje v WHERE v.bus.id = :busId " +
           "AND v.fechaHoraSalida BETWEEN :inicio AND :fin " +
           "AND v.estado <> 'CANCELADO'")
    List<Viaje> findByBusIdEnRango(
            @Param("busId") Long busId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);
}
