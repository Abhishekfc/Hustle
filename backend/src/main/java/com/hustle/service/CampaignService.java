package com.hustle.service;


import com.hustle.entity.Campaign;
import com.hustle.enums.CampaignStatus;
import com.hustle.repository.CampaignRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;

    public List<Campaign> getAllCampaigns(){
        return campaignRepository.findAll();
    }

    public List<Campaign> getActiveCampaigns(){
        return campaignRepository.findByCampaignStatus(CampaignStatus.ACTIVE);
    }

    public Campaign getCampaignById(Long id){
        return campaignRepository.findById(id)
                .orElseThrow(() ->  new RuntimeException("Campaign not found: " +  id));
    }

    public Campaign createCampaign(Campaign  campaign){
        return campaignRepository.save(campaign);
    }

    public Campaign updateCampaign(Long id, Campaign updated){
        Campaign existing = getCampaignById(id);
        existing.setTitle(updated.getTitle());
        existing.setCategory(updated.getCategory());
        existing.setDescription(updated.getDescription());
        existing.setInstructionsUrl(updated.getInstructionsUrl());
        existing.setThumbnailUrl(updated.getThumbnailUrl());
        existing.setTotalBudget(updated.getTotalBudget());
        existing.setRatePerMillion(updated.getRatePerMillion());
        existing.setCampaignStatus(updated.getCampaignStatus());
        existing.setEndsAt(updated.getEndsAt());
        return campaignRepository.save(existing);
    }

    public void deleteCampaign(Long id) {
        campaignRepository.deleteById(id);
    }




}
