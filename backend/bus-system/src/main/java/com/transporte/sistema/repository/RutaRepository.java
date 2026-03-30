package com.transporte.sistema.repository;

import com.transporte.sistema.entity.Ruta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RutaRepository extends JpaRepository<Ruta, Long> {

    @EntityGraph(attributePaths = {"origen", "destino"})
    List<Ruta> findAll();

    @EntityGraph(attributePaths = {"origen", "destino"})
    List<Ruta> findByOrigenIdAndActivoTrue(Long origenId);

    @EntityGraph(attributePaths = {"origen", "destino"})
    List<Ruta> findByOrigenIdAndDestinoIdAndActivoTrue(Long origenId, Long destinoId);

    Optional<Ruta> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);
}