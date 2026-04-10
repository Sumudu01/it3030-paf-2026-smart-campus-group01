# Database Configuration
POSTGRES_DB=smartcampus
POSTGRES_USER=smartcampus
POSTGRES_PASSWORD=your_secure_password_here

# Spring Datasource (for local Docker PostgreSQL)
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/smartcampus
SPRING_DATASOURCE_USERNAME=smartcampus
SPRING_DATASOURCE_PASSWORD=your_secure_password_here

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here

# Application Configuration
SPRING_PROFILES_ACTIVE=docker</content>
<parameter name="filePath">.env.example