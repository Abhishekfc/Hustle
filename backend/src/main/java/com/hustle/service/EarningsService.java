package com.hustle.service;

import com.hustle.entity.Earnings;
import com.hustle.repository.EarningsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EarningsService {

    private final EarningsRepository earningsRepository;

    public List<Earnings> getEarningsByUser(Long userId) {
        return earningsRepository.findByUserId(userId);
    }

    public List<Earnings> getAllEarnings() {
        return earningsRepository.findAll();
    }
}