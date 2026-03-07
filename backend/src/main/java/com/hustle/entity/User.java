package com.hustle.entity;

import com.hustle.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column( nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 200)
    private String avatarUrl;

    @Column(nullable = false)
    private Long totalViewsGenerated = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CREATOR;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();




}
