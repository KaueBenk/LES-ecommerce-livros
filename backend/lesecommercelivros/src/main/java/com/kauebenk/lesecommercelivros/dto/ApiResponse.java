package com.kauebenk.lesecommercelivros.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private int statusCode;
    private T data;
    private String message;
    private List<ErrorDetail> errors;

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, data, message, null);
    }
    
    public static <T> ApiResponse<T> created(T data, String message) {
        return new ApiResponse<>(201, data, message, null);
    }

    public static <T> ApiResponse<T> error(int statusCode, String message, List<ErrorDetail> errors) {
        return new ApiResponse<>(statusCode, null, message, errors);
    }
}
