package com.hustle.controller;


import com.hustle.entity.Campaign;
import com.hustle.service.CampaignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {
     private final CampaignService campaignService;

     @GetMapping
     public ResponseEntity<List<Campaign>> getActiveCampaigns() {
         return ResponseEntity.ok(campaignService.getActiveCampaigns());
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





}
