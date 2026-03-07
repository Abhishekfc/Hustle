package com.hustle.repository;

import com.hustle.OldModel.Card;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByCategory(String category, Sort sort);

    @Query("SELECT DISTINCT c.category FROM Card c")
    List<String> findDistinctCategories();
}

