package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SucursalRepository extends JpaRepository<Sucursal, Long> {
    Optional<Sucursal> findByCodigo(String codigo);
    List<Sucursal> findByActivoTrue();
    List<Sucursal> findByEsTerminalTrueAndActivoTrue();
    boolean existsByCodigo(String codigo);
}