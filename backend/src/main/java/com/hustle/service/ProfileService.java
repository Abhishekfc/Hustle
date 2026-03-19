package com.hustle.service;

import com.hustle.entity.User;
import com.hustle.repository.SubmissionRepository;
import com.hustle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    public User getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setTotalViewsGenerated(submissionRepository.sumViewCountByUserId(userId));
        return user;
    }

    public User getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setTotalViewsGenerated(submissionRepository.sumViewCountByUserId(user.getId()));
        return user;
    }
}