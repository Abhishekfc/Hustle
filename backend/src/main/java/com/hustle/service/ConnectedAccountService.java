package com.hustle.service;

import com.hustle.entity.ConnectedAccount;
import com.hustle.entity.User;
import com.hustle.enums.VerificationStatus;
import com.hustle.repository.ConnectedAccountRepository;
import com.hustle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConnectedAccountService {

    private final ConnectedAccountRepository accountRepository;
    private final UserRepository userRepository;

    public List<ConnectedAccount> getAccountByUser(Long userId){
        return accountRepository.findByUserId(userId);
    }

    public ConnectedAccount connectAccount(Long userId, ConnectedAccount account){
        if(accountRepository.countByUserId(userId) >= 8){
            throw new RuntimeException("Maximum 8 connected accounts are required");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        account.setUser(user);
        account.setVerificationCode(UUID.randomUUID().toString().substring(0, 8));
        account.setVerificationStatus(VerificationStatus.PENDING);
        account.setConnectedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    public ConnectedAccount verifyAccount(Long accountId) {
        ConnectedAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        // In real implementation this would fetch bio from platform API
        // For now we manually mark as verified
        account.setVerificationStatus(VerificationStatus.VERIFIED);
        account.setVerifiedAt(LocalDateTime.now());
        account.setLastCheckedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    public void deleteAccount(Long accountId) {
        accountRepository.deleteById(accountId);
    }
}
