package com.example.managementbackend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private Object details;

    public ErrorResponse() {
    }

    public ErrorResponse(int status, String error) {
        this.status = status;
        this.error = error;
    }

    public ErrorResponse(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }

    public ErrorResponse(int status, String error, String message, Object details) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.details = details;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public void setError(String error) {
        this.error = error;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setDetails(Object details) {
        this.details = details;
    }
}
