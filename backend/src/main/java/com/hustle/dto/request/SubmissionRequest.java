package com.hustle.dto.request;

import lombok.Data;

@Data
public class SubmissionRequest {
    private Long campaignId;
    private Long accountId;
    private String videoUrl;
}