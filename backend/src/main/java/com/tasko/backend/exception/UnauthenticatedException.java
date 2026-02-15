package com.tasko.backend.exception;

public class UnauthenticatedException extends AppException {
    public UnauthenticatedException() { super("Unauthorized"); }
}
