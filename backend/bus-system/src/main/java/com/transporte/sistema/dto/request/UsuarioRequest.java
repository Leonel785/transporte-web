package com.transporte.sistema.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UsuarioRequest {

    @NotBlank @Size(min = 4, max = 80)
    private String username;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    @NotBlank @Size(max = 150)
    private String nombres;

    @Size(max = 150)
    private String apellidos;

    @Email @Size(max = 150)
    private String email;

    @Size(max = 20)
    private String telefono;

    @NotNull
    private Long rolId;

    private Long sucursalId;

    @Size(max = 15)
    private String dniRuc;
}
