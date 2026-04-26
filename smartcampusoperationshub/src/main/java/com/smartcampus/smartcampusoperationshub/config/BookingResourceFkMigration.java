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
 * Align legacy {@code bookings} columns with the JPA model:
 * <ul>
 *   <li>{@code resource_id} may be a BIGINT FK while the app stores keys in {@code resource_ref} only —
 *       drop that FK and allow null on {@code resource_id}.</li>
 *   <li>{@code user_id} may exist alongside {@code created_by_user_id}; Hibernate only sets the latter,
 *       so NOT NULL on {@code user_id} breaks inserts until it is nullable.</li>
 *   <li>{@code start_at}/{@code end_at} may be legacy duplicates of {@code start_time}/{@code end_time}; the entity
 *       only maps the {@code *_time} columns, so NOT NULL on {@code *_at} breaks inserts.</li>
 * </ul>
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
        try {
            jdbcTemplate.execute("ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL");
            log.info("Made bookings.user_id nullable (app uses created_by_user_id only)");
        } catch (Exception e) {
            log.debug("Skipping bookings.user_id nullable migration: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE bookings ALTER COLUMN start_at DROP NOT NULL");
            log.info("Made bookings.start_at nullable (app uses start_time only)");
        } catch (Exception e) {
            log.debug("Skipping bookings.start_at nullable migration: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE bookings ALTER COLUMN end_at DROP NOT NULL");
            log.info("Made bookings.end_at nullable (app uses end_time only)");
        } catch (Exception e) {
            log.debug("Skipping bookings.end_at nullable migration: {}", e.getMessage());
        }
    }
}
