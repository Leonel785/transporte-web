package com.transporte.sistema.repository;
import com.transporte.sistema.entity.Ruta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface RutaRepository extends JpaRepository<Ruta, Long> {
    Optional<Ruta> findByCodigo(String codigo);
    List<Ruta> findByOrigenIdAndActivoTrue(Long origenId);
    List<Ruta> findByOrigenIdAndDestinoIdAndActivoTrue(Long origenId, Long destinoId);
    boolean existsByCodigo(String codigo);
}
