package com.hustle.service;

import com.hustle.entity.Wallet;
import com.hustle.entity.WithdrawalRequest;
import com.hustle.enums.WithdrawalStatus;
import com.hustle.repository.WalletRepository;
import com.hustle.repository.WithdrawalRequestRepository;
import com.hustle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final UserRepository userRepository;

    public Wallet getWalletByUser(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    @Transactional
    public WithdrawalRequest requestWithdrawal(Long userId, BigDecimal amount,
                                               String method, String details) {
        Wallet wallet = getWalletByUser(userId);

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        WithdrawalRequest request = new WithdrawalRequest();
        request.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found")));
        request.setAmount(amount);
        request.setPaymentMethod(method);
        request.setPaymentDetails(details);
        request.setStatus(WithdrawalStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());
        return withdrawalRepository.save(request);
    }

    public List<WithdrawalRequest> getWithdrawalsByUser(Long userId) {
        return withdrawalRepository.findByUserId(userId);
    }

    public List<WithdrawalRequest> getAllWithdrawals() {
        return withdrawalRepository.findAll();
    }

    @Transactional
    public WithdrawalRequest updateWithdrawalStatus(Long withdrawalId, WithdrawalStatus status) {
        WithdrawalRequest request = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new RuntimeException("Withdrawal not found"));
        request.setStatus(status);
        if (status == WithdrawalStatus.PAID) {
            request.setProcessedAt(LocalDateTime.now());
            Wallet wallet = getWalletByUser(request.getUser().getId());
            wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(request.getAmount()));
            walletRepository.save(wallet);
        }
        return withdrawalRepository.save(request);
    }
}