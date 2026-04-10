package com.smartcampus.smartcampusoperationshub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class DatabaseConnectionLogger {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionLogger.class);

    @Bean
    public CommandLineRunner logDatabaseConnection(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                logger.info("=================================================");
                logger.info("DATABASE CONNECTION INFO:");
                logger.info("Database URL: {}", connection.getMetaData().getURL());
                logger.info("Database User: {}", connection.getMetaData().getUserName());
                logger.info("Database Product: {} {}", 
                    connection.getMetaData().getDatabaseProductName(),
                    connection.getMetaData().getDatabaseProductVersion());
                
                // Check if users table exists
                try {
                    Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'",
                        Integer.class
                    );
                    if (count != null && count > 0) {
                        logger.info("Users table EXISTS in the database");
                        
                        // Count existing users
                        try {
                            Integer userCount = jdbcTemplate.queryForObject(
                                "SELECT COUNT(*) FROM users",
                                Integer.class
                            );
                            logger.info("Current number of users in database: {}", userCount);
                        } catch (Exception e) {
                            logger.warn("Could not count users: {}", e.getMessage());
                        }
                    } else {
                        logger.warn("Users table DOES NOT EXIST in the database!");
                        logger.info("Hibernate should create it with ddl-auto=update");
                    }
                } catch (Exception e) {
                    logger.warn("Error checking for users table: {}", e.getMessage());
                }
                
                logger.info("=================================================");
            } catch (Exception e) {
                logger.error("Failed to get database connection: {}", e.getMessage(), e);
            }
        };
    }
}