package com.smartcampus.smartcampusoperationshub;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class SmartcampusoperationshubApplication {

    private static final Logger logger = LoggerFactory.getLogger(SmartcampusoperationshubApplication.class);

	public static void main(String[] args) {
        logger.info("Starting Smart Campus Operations Hub Application...");
		SpringApplication.run(SmartcampusoperationshubApplication.class, args);
        logger.info("Application started successfully!");
	}

}
