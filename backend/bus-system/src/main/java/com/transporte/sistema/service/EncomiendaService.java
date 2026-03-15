package com.transporte.sistema.service;
import com.transporte.sistema.dto.request.ActualizarEstadoEncomiendaRequest;
import com.transporte.sistema.dto.request.EncomiendaRequest;
import com.transporte.sistema.dto.response.EncomiendaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface EncomiendaService {
    EncomiendaResponse registrar(EncomiendaRequest request);
    EncomiendaResponse obtenerPorId(Long id);
    EncomiendaResponse obtenerPorGuia(String numeroGuia);
    EncomiendaResponse actualizarEstado(Long id, ActualizarEstadoEncomiendaRequest request);
    Page<EncomiendaResponse> listarPorRemitente(Long remitenteId, Pageable pageable);
    Page<EncomiendaResponse> listarPorSucursalOrigen(Long sucursalId, Pageable pageable);
}
