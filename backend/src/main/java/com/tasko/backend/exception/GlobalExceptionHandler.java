package com.tasko.backend.exception;

import com.tasko.backend.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthenticatedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiError unauth(UnauthenticatedException ex) {
        return ApiError.of(401, ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiError forbidden(ForbiddenException ex) {
        return ApiError.of(403, ex.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError notFound(NotFoundException ex) {
        return ApiError.of(404, ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError badRequest(BadRequestException ex) {
        return ApiError.of(400, ex.getMessage());
    }

    @ExceptionHandler(InternalException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError internal(InternalException ex) {
        return ApiError.of(500, ex.getMessage());
    }

    public record ApiError(int status, String message, Instant timestamp) {
        static ApiError of(int status, String message) {
            return new ApiError(status, message, Instant.now());
        }
    }
}
