package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Encomienda;
import com.transporte.sistema.enums.EstadoEncomienda;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EncomiendaRepository extends JpaRepository<Encomienda, Long> {

    Optional<Encomienda> findByNumeroGuia(String numeroGuia);

    boolean existsByNumeroGuia(String numeroGuia);

    Page<Encomienda> findByRemitenteIdOrderByCreatedAtDesc(Long remitenteId, Pageable pageable);

    Page<Encomienda> findByDestinatarioIdOrderByCreatedAtDesc(Long destinatarioId, Pageable pageable);

    Page<Encomienda> findByEstadoOrderByCreatedAtDesc(EstadoEncomienda estado, Pageable pageable);

    Page<Encomienda> findBySucursalOrigenIdOrderByCreatedAtDesc(Long sucursalId, Pageable pageable);
}
