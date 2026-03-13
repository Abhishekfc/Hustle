package com.hustle.repository;

import com.hustle.entity.WithdrawalRequest;
import com.hustle.enums.WithdrawalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByUserId(Long userId);
    List<WithdrawalRequest> findByStatus(WithdrawalStatus status);
}