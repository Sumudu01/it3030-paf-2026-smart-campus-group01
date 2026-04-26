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
