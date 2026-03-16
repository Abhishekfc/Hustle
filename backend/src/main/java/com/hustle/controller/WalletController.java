package com.hustle.controller;

import com.hustle.dto.request.WithdrawalRequest;
import com.hustle.entity.Wallet;
import com.hustle.enums.WithdrawalStatus;
import com.hustle.repository.UserRepository;
import com.hustle.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<Wallet> getMyWallet(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.getWalletByUser(userId));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<com.hustle.entity.WithdrawalRequest> requestWithdrawal(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody WithdrawalRequest request) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.requestWithdrawal(
                userId,
                request.getAmount(),
                request.getPaymentMethod(),
                request.getPaymentDetails()
        ));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<List<com.hustle.entity.WithdrawalRequest>> getMyWithdrawals(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.getWithdrawalsByUser(userId));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.hustle.entity.WithdrawalRequest>> getAllWithdrawals() {
        return ResponseEntity.ok(walletService.getAllWithdrawals());
    }

    @PutMapping("/admin/withdrawals/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.hustle.entity.WithdrawalRequest> updateWithdrawalStatus(
            @PathVariable Long id,
            @RequestParam WithdrawalStatus status) {
        return ResponseEntity.ok(walletService.updateWithdrawalStatus(id, status));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
    @PostMapping("/admin/earnings/{earningsId}/payout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> processEarningsPayout(@PathVariable Long earningsId) {
        walletService.processEarningsPayout(earningsId);
        return ResponseEntity.ok("Payout processed successfully");
    }
}