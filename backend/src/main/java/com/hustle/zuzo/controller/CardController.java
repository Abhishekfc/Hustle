package com.hustle.zuzo.controller;

import com.hustle.zuzo.model.Card;
import com.hustle.zuzo.repository.CardRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/cards")
public class CardController {

    private final CardRepository cardRepository;

    public CardController(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    @GetMapping
    public List<Card> getCards(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "sort", required = false) String sort) {

        Sort baseSort = Sort.by("sortOrder").ascending();
        List<Card> cards;

        if (category != null && !category.equalsIgnoreCase("all")) {
            cards = cardRepository.findByCategory(category, baseSort);
        } else {
            cards = cardRepository.findAll(baseSort);
        }

        if ("az".equalsIgnoreCase(sort)) {
            return cards.stream()
                    .sorted(Comparator.comparing(Card::getTitle, String::compareToIgnoreCase))
                    .collect(Collectors.toList());
        } else if ("za".equalsIgnoreCase(sort)) {
            return cards.stream()
                    .sorted(Comparator.comparing(Card::getTitle, String::compareToIgnoreCase).reversed())
                    .collect(Collectors.toList());
        } else if ("letter".equalsIgnoreCase(sort)) {
            return cards.stream()
                    .sorted(Comparator.comparing(Card::getLetter, String::compareToIgnoreCase))
                    .collect(Collectors.toList());
        }

        return cards;
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        List<String> categories = cardRepository.findDistinctCategories();
        return categories.stream()
                .sorted(String::compareToIgnoreCase)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Card> getCardById(@PathVariable Long id) {
        Optional<Card> card = cardRepository.findById(id);
        return card.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}

