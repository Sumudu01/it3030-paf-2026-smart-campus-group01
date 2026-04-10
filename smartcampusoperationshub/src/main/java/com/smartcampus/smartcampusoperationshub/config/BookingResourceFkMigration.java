package com.smartcampus.smartcampusoperationshub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * The DB may have a legacy {@code resource_id} BIGINT FK to {@code resources} while the app
 * stores human-readable resource keys in {@code resource_ref}. Hibernate only maps {@code resource_ref},
 * so inserts leave {@code resource_id} null and violate NOT NULL. Drop the FK and allow null
 * on {@code resource_id} so string-only bookings work.
 */
@Component
@Order(0)
public class BookingResourceFkMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BookingResourceFkMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public BookingResourceFkMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            List<String> names = jdbcTemplate.query(
                    """
                            SELECT c.conname
                            FROM pg_constraint c
                            JOIN pg_class t ON c.conrelid = t.oid
                            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
                            WHERE t.relname = 'bookings'
                              AND c.contype = 'f'
                              AND a.attname = 'resource_id'
                            """,
                    (rs, rowNum) -> rs.getString(1)
            );
            for (String name : names) {
                jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS " + name);
                log.info("Dropped FK constraint {} on bookings.resource_id", name);
            }
        } catch (Exception e) {
            log.debug("Skipping bookings.resource_id FK cleanup (non-PostgreSQL or no table): {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE bookings ALTER COLUMN resource_id DROP NOT NULL");
            log.info("Made bookings.resource_id nullable for resource_ref-only rows");
        } catch (Exception e) {
            log.debug("Skipping bookings.resource_id nullable migration: {}", e.getMessage());
        }
    }
}
