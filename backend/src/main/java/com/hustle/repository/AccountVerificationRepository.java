package com.hustle.repository;

import com.hustle.entity.AccountVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountVerificationRepository extends JpaRepository<AccountVerification, Long> {
    List<AccountVerification> findByAccountId(Long accountId);
}