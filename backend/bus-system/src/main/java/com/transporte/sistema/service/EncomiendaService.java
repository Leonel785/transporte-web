package com.transporte.sistema.service;

import com.transporte.sistema.dto.request.ActualizarEstadoEncomiendaRequest;
import com.transporte.sistema.dto.request.EncomiendaClienteRequest;
import com.transporte.sistema.dto.request.EncomiendaRequest;
import com.transporte.sistema.dto.response.EncomiendaResponse;
import com.transporte.sistema.dto.response.MovimientoEncomiendaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface EncomiendaService {
    EncomiendaResponse registrar(EncomiendaRequest request);
    EncomiendaResponse obtenerPorId(Long id);
    EncomiendaResponse obtenerPorGuia(String numeroGuia);
    EncomiendaResponse actualizarEstado(Long id, ActualizarEstadoEncomiendaRequest request);
    List<EncomiendaResponse> listarTodas();
    Page<EncomiendaResponse> listarPorRemitente(Long remitenteId, Pageable pageable);
    Page<EncomiendaResponse> listarPorSucursalOrigen(Long sucursalId, Pageable pageable);

    // Portal cliente
    List<EncomiendaResponse> misEncomiendas(String username);
    List<MovimientoEncomiendaResponse> obtenerMovimientos(Long encomiendaId, String username);

    // Solicitud desde portal cliente autenticado
    EncomiendaResponse solicitarEncomienda(EncomiendaClienteRequest request, String username);
}