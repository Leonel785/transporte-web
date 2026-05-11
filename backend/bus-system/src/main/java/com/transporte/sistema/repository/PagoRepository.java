package com.transporte.sistema.repository;
import com.transporte.sistema.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByActivoTrueOrderByFechaPagoDesc();
    Optional<Pago> findByIdAndActivoTrue(Long id);
}
