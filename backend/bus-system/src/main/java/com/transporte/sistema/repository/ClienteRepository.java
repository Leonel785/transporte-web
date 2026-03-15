package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByDniRuc(String dniRuc);

    boolean existsByDniRuc(String dniRuc);

    @Query("SELECT c FROM Cliente c WHERE " +
           "LOWER(c.nombres) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.apellidos) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.razonSocial) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "c.dniRuc LIKE CONCAT('%', :q, '%')")
    Page<Cliente> buscarPorNombreODocumento(@Param("q") String q, Pageable pageable);
}
