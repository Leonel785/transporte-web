package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Boleto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoletoRepository extends JpaRepository<Boleto, Long> {

    Optional<Boleto> findByNumeroBoleto(String numeroBoleto);

    boolean existsByNumeroBoleto(String numeroBoleto);

    /** Spring Data deriva automáticamente */
    Page<Boleto> findByClienteIdOrderByCreatedAtDesc(Long clienteId, Pageable pageable);

    Page<Boleto> findByViajeId(Long viajeId, Pageable pageable);
}
