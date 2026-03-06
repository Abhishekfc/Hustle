package com.hustle.zuzo.controller;

import com.hustle.zuzo.model.Card;
import com.hustle.zuzo.repository.CardRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/seed")
public class SeedController {

    private final CardRepository cardRepository;

    public SeedController(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> seedDatabase() {
        cardRepository.deleteAll();

        List<Card> sampleCards = Arrays.asList(
                new Card("Analytics", "Tools", "", "A", 1),
                new Card("Dashboard", "Tools", "", "D", 2),
                new Card("Reports", "Data", "", "R", 3),
                new Card("Projects", "Work", "", "P", 4),
                new Card("Tasks", "Work", "", "T", 5),
                new Card("Charts", "Data", "", "C", 6),
                new Card("Settings", "Config", "", "S", 7),
                new Card("Users", "Admin", "", "U", 8),
                new Card("Files", "Resources", "", "F", 9),
                new Card("Logs", "Data", "", "L", 10),
                new Card("Billing", "Admin", "", "B", 11),
                new Card("Support", "Resources", "", "S", 12)
        );

        cardRepository.saveAll(sampleCards);

        return ResponseEntity.ok().body("{\"message\":\"Database seeded with sample cards\"}");
    }
}

