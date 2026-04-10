-- Create the database if it doesn't exist
-- This file is used to initialize the PostgreSQL container

-- Grant all privileges to webuser for SmartCampusOperationsHub database
GRANT ALL PRIVILEGES ON DATABASE "SmartCampusOperationsHub" TO webuser;

-- Connect to the database and grant schema privileges
\c "SmartCampusOperationsHub";

GRANT ALL ON SCHEMA public TO webuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO webuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO webuser;

-- Allow remote connections (this will be configured in postgresql.conf)
ALTER SYSTEM SET listen_addresses = '*';

-- SAMPLE DATA FOR RESOURCES (for booking system testing)
INSERT INTO resources (name, description, capacity, active, created_at) VALUES
('Meeting Room A', 'Small meeting room for 10 people', 10, true, CURRENT_TIMESTAMP),
('Lab 101', 'Computer laboratory with 25 workstations', 25, true, CURRENT_TIMESTAMP),
('Auditorium', 'Main auditorium for lectures (100 seats)', 100, true, CURRENT_TIMESTAMP),
('Study Room B', 'Quiet study room for groups (6 seats)', 6, true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

