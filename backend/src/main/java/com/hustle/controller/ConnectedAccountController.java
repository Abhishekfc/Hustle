package com.hustle.controller;

import com.hustle.entity.ConnectedAccount;
import com.hustle.service.ConnectedAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.hustle.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class ConnectedAccountController {

    private final ConnectedAccountService accountService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ConnectedAccount>> getMyAccounts(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(accountService.getAccountByUser(userId));
    }

    @PostMapping("/connect")
    public ResponseEntity<ConnectedAccount> connectAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ConnectedAccount account) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(accountService.connectAccount(userId, account));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ConnectedAccount> verifyAccount(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.verifyAccount(id));
    }

    @PostMapping("/{id}/regenerate-code")
    public ResponseEntity<ConnectedAccount> regenerateCode(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.regenerateCode(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}