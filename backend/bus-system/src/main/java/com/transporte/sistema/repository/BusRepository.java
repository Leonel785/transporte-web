package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Bus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BusRepository extends JpaRepository<Bus, Long> {

    @EntityGraph(attributePaths = {"sucursal"})
    List<Bus> findAll();

    @EntityGraph(attributePaths = {"sucursal"})
    List<Bus> findByActivoTrue();

    Optional<Bus> findByPlaca(String placa);
    boolean existsByPlaca(String placa);
}