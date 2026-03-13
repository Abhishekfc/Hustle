package com.hustle.controller;


import com.hustle.dto.request.LoginRequest;
import com.hustle.dto.request.RegisterRequest;
import com.hustle.dto.response.AuthResponse;
import com.hustle.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request){
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse>  login(@RequestBody LoginRequest request){
        return ResponseEntity.ok(authService.login(request));
    }


}
