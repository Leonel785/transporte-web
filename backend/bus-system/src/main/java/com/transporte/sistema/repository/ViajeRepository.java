package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Viaje;
import com.transporte.sistema.enums.EstadoViaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {

    List<Viaje> findByEstado(EstadoViaje estado);

    /** Busca viajes con asientos disponibles para una ruta en una fecha */
    @Query("SELECT v FROM Viaje v WHERE v.ruta.origen.id = :origenId " +
           "AND v.ruta.destino.id = :destinoId " +
           "AND v.fechaHoraSalida >= :desde AND v.estado = 'PROGRAMADO'")
    Page<Viaje> buscarDisponibles(
            @Param("origenId") Long origenId,
            @Param("destinoId") Long destinoId,
            @Param("desde") LocalDateTime desde,
            Pageable pageable);

    /** Spring Data deriva el query automáticamente */
    Page<Viaje> findByChoferIdOrderByFechaHoraSalidaDesc(Long choferId, Pageable pageable);

    /** Detectar solapamiento de horario para un bus */
    @Query("SELECT v FROM Viaje v WHERE v.bus.id = :busId " +
           "AND v.fechaHoraSalida BETWEEN :inicio AND :fin " +
           "AND v.estado <> 'CANCELADO'")
    List<Viaje> findByBusIdEnRango(
            @Param("busId") Long busId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);
}
