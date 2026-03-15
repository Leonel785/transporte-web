package com.transporte.sistema.service;
import com.transporte.sistema.dto.request.BoletoRequest;
import com.transporte.sistema.dto.response.BoletoResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface BoletoService {
    BoletoResponse vender(BoletoRequest request);
    BoletoResponse obtenerPorId(Long id);
    BoletoResponse obtenerPorNumero(String numeroBoleto);
    BoletoResponse escanearQr(String codigoQr);  // abordaje
    BoletoResponse cancelar(Long id, String motivo);
    Page<BoletoResponse> listarPorCliente(Long clienteId, Pageable pageable);
    Page<BoletoResponse> listarPorViaje(Long viajeId, Pageable pageable);
}
