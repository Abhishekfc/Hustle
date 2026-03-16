package com.hustle.service;

import com.hustle.entity.Earnings;
import com.hustle.entity.Wallet;
import com.hustle.entity.WithdrawalRequest;
import com.hustle.enums.PayoutStatus;
import com.hustle.enums.WithdrawalStatus;
import com.hustle.repository.EarningsRepository;
import com.hustle.repository.WalletRepository;
import com.hustle.repository.WithdrawalRequestRepository;
import com.hustle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final UserRepository userRepository;
    private final EarningsRepository earningsRepository;

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

    @Transactional
    public void processEarningsPayout(Long earningsId) {
        Earnings earnings = earningsRepository.findById(earningsId)
                .orElseThrow(() -> new RuntimeException("Earnings not found: " + earningsId));

        if (earnings.getPayoutStatus() == PayoutStatus.PAID) {
            throw new RuntimeException("Earnings already paid out");
        }
        if (earnings.getPayoutStatus() == PayoutStatus.VOIDED) {
            throw new RuntimeException("Cannot pay voided earnings");
        }

        // Credit the wallet now that admin has approved payout
        Wallet wallet = walletRepository.findByUserId(earnings.getUser().getId())
                .orElseGet(() -> {
                    Wallet w = new Wallet();
                    w.setUser(earnings.getUser());
                    w.setBalance(BigDecimal.ZERO);
                    w.setTotalEarned(BigDecimal.ZERO);
                    w.setTotalWithdrawn(BigDecimal.ZERO);
                    w.setTotalViewsEligible(0L);
                    return w;
                });

        wallet.setBalance(wallet.getBalance().add(earnings.getAmount()));
        wallet.setTotalEarned(wallet.getTotalEarned().add(earnings.getAmount()));
        wallet.setTotalViewsEligible(wallet.getTotalViewsEligible() + earnings.getViewsAtPayout());
        walletRepository.save(wallet);

        earnings.setPayoutStatus(PayoutStatus.PAID);
        earningsRepository.save(earnings);

        log.info("Paid out earnings {} to user {}: {}",
                earningsId, earnings.getUser().getId(), earnings.getAmount());
    }
}