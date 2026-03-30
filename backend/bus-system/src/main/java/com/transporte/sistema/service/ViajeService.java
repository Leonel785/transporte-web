package com.transporte.sistema.service;

import com.transporte.sistema.dto.request.ViajeRequest;
import com.transporte.sistema.dto.response.AsientoResponse;
import com.transporte.sistema.dto.response.ViajeResponse;
import com.transporte.sistema.enums.EstadoViaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

public interface ViajeService {
    ViajeResponse crear(ViajeRequest request);
    ViajeResponse obtenerPorId(Long id);
    Page<ViajeResponse> buscarDisponibles(Long origenId, Long destinoId, LocalDateTime desde, Pageable pageable);
    List<AsientoResponse> obtenerAsientos(Long viajeId);
    ViajeResponse cambiarEstado(Long id, EstadoViaje nuevoEstado);
    Page<ViajeResponse> listarPorChofer(Long choferId, Pageable pageable);
    void eliminar(Long id);
}