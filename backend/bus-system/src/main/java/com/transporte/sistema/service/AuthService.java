package com.transporte.sistema.service;
import com.transporte.sistema.dto.request.LoginRequest;
import com.transporte.sistema.dto.response.LoginResponse;
public interface AuthService {
    LoginResponse login(LoginRequest request);
}
