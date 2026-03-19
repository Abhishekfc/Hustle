package com.hustle.entity;

import com.hustle.enums.Platform;
import com.hustle.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "connected_accounts")
public class ConnectedAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    @Column(length = 100)
    private String handle;

    @Column(nullable = false, length = 500)
    private String profileUrl;

    @Column(nullable = false, length = 50)
    private String verificationCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING ;

    private LocalDateTime verifiedAt;

    private LocalDateTime verificationCodeGeneratedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime connectedAt = LocalDateTime.now();

    private LocalDateTime lastCheckedAt;
}
