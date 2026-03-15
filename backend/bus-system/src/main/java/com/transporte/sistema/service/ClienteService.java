package com.transporte.sistema.service;

import com.transporte.sistema.dto.request.ClienteRequest;
import com.transporte.sistema.dto.response.ClienteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClienteService {
    ClienteResponse crear(ClienteRequest request);
    ClienteResponse actualizar(Long id, ClienteRequest request);
    ClienteResponse obtenerPorId(Long id);
    ClienteResponse obtenerPorDniRuc(String dniRuc);
    Page<ClienteResponse> buscar(String query, Pageable pageable);
    Page<ClienteResponse> listarTodos(Pageable pageable);
    void eliminar(Long id);
}
