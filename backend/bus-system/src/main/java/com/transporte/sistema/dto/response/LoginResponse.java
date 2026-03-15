package com.transporte.sistema.dto.response;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginResponse {
    private String token;
    private String tipo;
    private Long usuarioId;
    private String username;
    private String nombreCompleto;
    private String rol;
    private Long sucursalId;
    private String sucursalNombre;
}
