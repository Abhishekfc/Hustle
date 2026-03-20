package com.hustle.controller;


import com.hustle.dto.response.CampaignRegistrationDto;
import com.hustle.dto.response.LeaderboardEntryDto;
import com.hustle.entity.Campaign;
import com.hustle.repository.UserRepository;
import com.hustle.service.CampaignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {
     private final CampaignService campaignService;
     private final UserRepository userRepository;

     @GetMapping
     public ResponseEntity<List<Campaign>> getActiveCampaigns() {
         return ResponseEntity.ok(campaignService.getActiveCampaigns());
     }

     @GetMapping("/admin/all")
     @PreAuthorize("hasRole('ADMIN')")
     public ResponseEntity<List<Campaign>> getAllCampaigns() {
         return ResponseEntity.ok(campaignService.getAllCampaigns());
     }

     @GetMapping("/{id}")
     public ResponseEntity<Campaign> getCampaignById(@PathVariable Long id){
         return ResponseEntity.ok(campaignService.getCampaignById(id));
     }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        return ResponseEntity.ok(campaignService.createCampaign(campaign));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable Long id,
                                                   @RequestBody Campaign campaign) {
        return ResponseEntity.ok(campaignService.updateCampaign(id, campaign));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.getLeaderboard(id));
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<String> register(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        campaignService.registerForCampaign(userId, id);
        return ResponseEntity.ok("Registered");
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<List<CampaignRegistrationDto>> getMyRegistrations(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(campaignService.getMyRegistrations(userId));
    }

    @GetMapping("/{id}/is-registered")
    public ResponseEntity<Boolean> isRegistered(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(campaignService.isRegistered(userId, id));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }





}
