package com.hustle.repository;

import com.hustle.entity.Submission;
import com.hustle.enums.CampaignStatus;
import com.hustle.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserId(Long userId);
    List<Submission> findByUserIdAndCampaignId(Long userId, Long campaignId);
    List<Submission> findByCampaignId(Long campaignId);

    @Query("SELECT s FROM Submission s WHERE s.status = :status AND s.campaign.campaignStatus = :campaignStatus")
    List<Submission> findByStatusAndCampaignStatus(
            @Param("status") SubmissionStatus status,
            @Param("campaignStatus") CampaignStatus campaignStatus
    );
}