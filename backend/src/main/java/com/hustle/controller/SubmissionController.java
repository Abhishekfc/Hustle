package com.hustle.controller;

import com.hustle.dto.request.SubmissionRequest;
import com.hustle.entity.Submission;
import com.hustle.repository.UserRepository;
import com.hustle.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Submission> submit(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SubmissionRequest request) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(submissionService.submit(
                userId,
                request.getCampaignId(),
                request.getAccountId(),
                request.getVideoUrl()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Submission>> getMySubmissions(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(submissionService.getSubmissionsByUser(userId));
    }

    @GetMapping("/me/{campaignId}")
    public ResponseEntity<List<Submission>> getMySubmissionsForCampaign(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long campaignId) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(submissionService.getSubmissionsByUserAndCampaign(userId, campaignId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable Long id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/{campaignId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Submission>> getSubmissionsForCampaign(
            @PathVariable Long campaignId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByCampaign(campaignId));
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rejectSubmission(@PathVariable Long id) {
        submissionService.rejectSubmission(id);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}