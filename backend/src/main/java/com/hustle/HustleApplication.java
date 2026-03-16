package com.hustle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HustleApplication {

    public static void main(String[] args) {
        SpringApplication.run(HustleApplication.class, args);
    }
}

