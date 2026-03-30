package com.transporte.sistema.service;

import com.transporte.sistema.dto.request.CrearPagoRequest;
import com.transporte.sistema.dto.response.PagoResponse;

public interface PagoService {
    PagoResponse procesarPago(CrearPagoRequest request);
}