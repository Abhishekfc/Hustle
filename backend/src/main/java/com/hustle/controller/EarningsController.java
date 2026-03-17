package com.hustle.controller;

import com.hustle.entity.Earnings;
import com.hustle.repository.UserRepository;
import com.hustle.service.EarningsService;
import com.hustle.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/earnings")
@RequiredArgsConstructor
public class EarningsController {

    private final EarningsService earningsService;
    private final WalletService walletService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<List<Earnings>> getMyEarnings(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(earningsService.getEarningsByUser(userId));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Earnings>> getAllEarnings() {
        return ResponseEntity.ok(earningsService.getAllEarnings());
    }

    @PostMapping("/admin/{id}/payout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> triggerPayout(@PathVariable Long id) {
        walletService.processEarningsPayout(id);
        return ResponseEntity.ok("Payout processed successfully");
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}