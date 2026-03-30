package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Boleto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BoletoRepository extends JpaRepository<Boleto, Long> {

    Optional<Boleto> findByNumeroBoleto(String numeroBoleto);

    Page<Boleto> findByClienteIdOrderByCreatedAtDesc(Long clienteId, Pageable pageable);

    Page<Boleto> findByViajeId(Long viajeId, Pageable pageable);

    /**
     * Cuenta boletos ACTIVOS de un viaje.
     * Usado para validar que no se elimine un viaje con pasajeros.
     */
    @Query("SELECT COUNT(b) FROM Boleto b WHERE b.viaje.id = :viajeId AND b.estado = 'ACTIVO'")
    long countByViajeIdAndEstadoActivo(@Param("viajeId") Long viajeId);
}
