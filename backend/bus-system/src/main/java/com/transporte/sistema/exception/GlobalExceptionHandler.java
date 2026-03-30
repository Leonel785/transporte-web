package com.transporte.sistema.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Manejador global de excepciones. Centraliza el formato de error de la API.
 *
 * MEJORAS vs versión anterior:
 * - Manejo de cuenta deshabilitada/bloqueada (security)
 * - Manejo de parámetros faltantes y tipo incorrecto
 * - Manejo de JSON malformado
 * - No expone detalles técnicos en producción para errores 500
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 404 ─────────────────────────────────────────────────────────────────
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            RecursoNoEncontradoException ex, HttpServletRequest req) {
        log.warn("Recurso no encontrado [{}]: {}", req.getRequestURI(), ex.getMessage());
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
    }

    // ── 400 – Regla de negocio ───────────────────────────────────────────────
    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<ErrorResponse> handleNegocio(
            NegocioException ex, HttpServletRequest req) {
        log.warn("Error de negocio [{}]: {}", req.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req, null);
    }

    // ── 409 – Conflicto / duplicado ──────────────────────────────────────────
    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorResponse> handleConflicto(
            ConflictoException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), req, null);
    }

    // ── 400 – Bean Validation (@NotNull, @Size, etc.) ───────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacion(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> errores = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.toList());
        return build(HttpStatus.BAD_REQUEST, "Errores de validación", req, errores);
    }

    // ── 400 – Parámetro requerido faltante ──────────────────────────────────
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest req) {
        String msg = "Parámetro requerido faltante: '" + ex.getParameterName() + "'";
        return build(HttpStatus.BAD_REQUEST, msg, req, null);
    }

    // ── 400 – Tipo de parámetro incorrecto ──────────────────────────────────
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        String msg = "Valor inválido para el parámetro '" + ex.getName() + "'";
        return build(HttpStatus.BAD_REQUEST, msg, req, null);
    }

    // ── 400 – JSON malformado ────────────────────────────────────────────────
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedJson(
            HttpMessageNotReadableException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud tiene formato inválido", req, null);
    }

    // ── 401 – Credenciales incorrectas ──────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos", req, null);
    }

    // ── 401 – Cuenta deshabilitada ───────────────────────────────────────────
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabled(
            DisabledException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "La cuenta de usuario está deshabilitada", req, null);
    }

    // ── 401 – Cuenta bloqueada ───────────────────────────────────────────────
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ErrorResponse> handleLocked(
            LockedException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "La cuenta de usuario está bloqueada", req, null);
    }

    // ── 403 – Sin permisos ───────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "No tiene permisos para esta acción", req, null);
    }

    // ── 500 – Error inesperado ───────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest req) {
        // Log completo en servidor, mensaje genérico al cliente
        log.error("Error inesperado en {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error interno del servidor. Contacte al administrador.", req, null);
    }

    // ── Helper ──────────────────────────────────────────────────────────────
    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String mensaje, HttpServletRequest req, List<String> errores) {
        ErrorResponse body = ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .mensaje(mensaje)
                .path(req.getRequestURI())
                .timestamp(LocalDateTime.now())
                .errores(errores)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
