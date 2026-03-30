package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Encomienda;
import com.transporte.sistema.enums.EstadoEncomienda;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EncomiendaRepository extends JpaRepository<Encomienda, Long> {

    @EntityGraph(attributePaths = {"sucursalOrigen", "sucursalDestino", "remitente", "destinatario"})
    Optional<Encomienda> findByNumeroGuia(String numeroGuia);

    boolean existsByNumeroGuia(String numeroGuia);

    @EntityGraph(attributePaths = {"sucursalOrigen", "sucursalDestino", "remitente", "destinatario"})
    Page<Encomienda> findByRemitenteIdOrderByCreatedAtDesc(Long remitenteId, Pageable pageable);

    @EntityGraph(attributePaths = {"sucursalOrigen", "sucursalDestino", "remitente", "destinatario"})
    Page<Encomienda> findByDestinatarioIdOrderByCreatedAtDesc(Long destinatarioId, Pageable pageable);

    @EntityGraph(attributePaths = {"sucursalOrigen", "sucursalDestino", "remitente", "destinatario"})
    Page<Encomienda> findByEstadoOrderByCreatedAtDesc(EstadoEncomienda estado, Pageable pageable);

    @EntityGraph(attributePaths = {"sucursalOrigen", "sucursalDestino", "remitente", "destinatario"})
    Page<Encomienda> findBySucursalOrigenIdOrderByCreatedAtDesc(Long sucursalId, Pageable pageable);
}