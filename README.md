# Smart Campus Operations Hub

A comprehensive web-based platform for university facility and asset management, booking operations, and maintenance incident handling.

## 📋 Project Overview

**Project Name:** Smart Campus Operations Hub  
**Project Code:** IT3030-PAF-2026-Smart-Campus-Group01  
**Academic Year:** 2025/2026 - Year 3 Semester 2  
**Course:** IT3030 - Practical Application of Fundamentals  

This platform provides a unified system for managing university facilities, handling bookings, and processing maintenance incidents with role-based access control and full auditability.

---

## 👥 Team Members

| Student ID | Name | Role/Module |
|------------|------|-------------|
| IT23187382 | Wijeratne U G S L | Authentication, Authorization & Notification System |
| IT23177000 | Hapuarachchi H D V C | Smart Resource & Availability Engine |
| IT23217904 | Kumari A M W P G S R | Booking Workflow & Approval System |
| IT23269934 | Silva G B D | Incident, Maintenance & Communication System |

---

## 🛠 Technology Stack

### Backend
- **Framework:** Spring Boot 3.2.x
- **Language:** Java 21
- **Database:** PostgreSQL 16
- **Security:** Spring Security with OAuth 2.0 (Google Sign-In)
- **API Style:** RESTful APIs with JSON
- **Container:** Docker & Docker Compose

### Frontend
- **Framework:** React 18+
- **UI Library:** Vite + React
- **State Management:** React Context
- **HTTP Client:** Axios

### DevOps & Tools
- **Build Tool:** Maven (Backend) / npm (Frontend)
- **Containerization:** Docker & Docker Compose
- **Version Control:** Git

---

## 📦 Core Features

### Module A: Facilities & Assets Catalogue
- Maintain a comprehensive catalogue of bookable resources:
  - Lecture halls
  - Laboratories
  - Meeting rooms
  - Equipment (projectors, cameras, etc.)
- Resource metadata: type, capacity, location, availability windows, status (ACTIVE/OUT_OF_SERVICE)
- Search and filtering by type, capacity, and location
- CRUD operations for resource management

### Module B: Booking Management
- Booking request system with date, time range, purpose, and attendee details
- Workflow: PENDING → APPROVED/REJECTED → CANCELLED
- Conflict prevention for overlapping time slots
- Admin approval/rejection with reason tracking
- User booking history and admin overview with filters

### Module C: Maintenance & Incident Ticketing
- Incident ticket creation for resources/locations
- Ticket attributes: category, description, priority, contact details
- Image attachments (up to 3 evidence images)
- Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED (with REJECTED option)
- Technician assignment and status updates
- Resolution notes and comments system
- Comment ownership rules (edit/delete permissions)

### Module D: Notifications
- Real-time notifications for:
  - Booking approval/rejection
  - Ticket status changes
  - New comments on tickets
- Notification panel in web UI

### Module E: Authentication & Authorization
- OAuth 2.0 login (Google Sign-in)
- Role-based access control (RBAC)
- Supported roles: STUDENT, ADMIN, TECHNICIAN
- Protected endpoints and routes

---

## 🏗 Architecture

### Backend Architecture (Layered)
```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│    (REST Controllers, DTOs, Validators) │
├─────────────────────────────────────────┤
│            Service Layer                │
│    (Business Logic, Transactions)       │
├─────────────────────────────────────────┤
│          Repository Layer               │
│        (Data Access, JPA/Hibernate)     │
├─────────────────────────────────────────┤
│            Entity Layer                 │
│      (Domain Models, Relationships)      │
└─────────────────────────────────────────┘
```

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│           Pages/Views                   │
│     (Dashboard, Booking, Tickets)        │
├─────────────────────────────────────────┤
│         Components                      │
│   (Reusable UI Elements, Forms)         │
├─────────────────────────────────────────┤
│        Services/API Layer                │
│      (HTTP Client, API Integration)     │
├─────────────────────────────────────────┤
│         Context/State                   │
│   (Auth Context, App State Management)  │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Core Tables
- **users** - User accounts with OAuth data (Google)
- **resources** - Bookable facilities and equipment
- **bookings** - Booking requests and approvals
- **tickets** - Maintenance incident tickets
- **ticket_comments** - Comments on tickets
- **ticket_attachments** - Evidence images for tickets
- **notifications** - User notifications

---

## 🔐 Security Features

- OAuth 2.0 authentication with Google
- Session-based authentication with Spring Security
- Role-based endpoint protection
- Input validation and sanitization
- CORS configuration

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose (recommended)
- Git
- Text editor/IDE

### Manual Development Prerequisites (Alternative)
- Java 21
- Node.js 18 or higher
- PostgreSQL 16
- Maven 3.9+
- npm 9+

---

### Option 1: Using Docker (Recommended for Team Development)

#### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd smart-campus-operations-hub

# Copy environment template
cp .env.example .env

# Edit .env file with your Google OAuth credentials and database settings
# GOOGLE_CLIENT_ID=your_google_oauth_client_id
# GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Start all services
docker-compose up --build
```

**Access URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database Admin: http://localhost:8081 (Adminer)

#### Development with Docker

```bash
# For development with hot reload (recommended)
docker-compose -f docker-compose.dev.yml up --build

# Run specific services
docker-compose up backend    # Only backend with hot reload
docker-compose up frontend   # Only frontend with hot reload
docker-compose up db         # Only database
```

#### For Team Collaboration

Each team member can run the full stack locally using Docker. The setup ensures consistent environments across all development machines.

**To share database between team members:**
1. One team member runs the database container
2. Others connect to it by updating their `.env` file with the host's IP
3. Ensure firewall allows connections on port 5432

---

### Option 2: Running Without Docker (Local Development)

#### Backend Setup

```bash
# Navigate to backend directory
cd smartcampusoperationshub

# Configure database in src/main/resources/application.properties
# Default settings:
# - URL: jdbc:postgresql://localhost:5432/SmartCampusOperationsHub
# - Username: webuser
# - Password: 1234

# Run the application
mvn spring-boot:run
```

The backend runs on: **http://localhost:8099**

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

### Environment Variables Required

Create a `.env` file in the project root with:

```env
# Database Configuration
POSTGRES_DB=smartcampus
POSTGRES_USER=smartcampus
POSTGRES_PASSWORD=your_secure_password

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Application Configuration (optional)
SPRING_PROFILES_ACTIVE=docker
```

**To get Google OAuth credentials:**
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - For Docker: `http://localhost:8080/login/oauth2/code/google`
   - For local development: `http://localhost:8099/login/oauth2/code/google`
6. Copy the Client ID and Client Secret

---

### Docker Commands

```bash
# Start all services
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up (remove volumes)
docker-compose down -v
```

---

## 📝 API Endpoints Summary

### Authentication Endpoints
- `GET /oauth2/authorization/google` - Google OAuth login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Resource Endpoints (Module A)
- `GET /api/resources` - List all resources
- `GET /api/resources/{id}` - Get resource details
- `POST /api/resources` - Create resource (Admin)
- `PUT /api/resources/{id}` - Update resource (Admin)
- `DELETE /api/resources/{id}` - Delete resource (Admin)

### Booking Endpoints (Module B)
- `GET /api/bookings` - List bookings
- `GET /api/bookings/my-bookings` - User's bookings
- `POST /api/bookings` - Create booking request
- `PUT /api/bookings/{id}/approve` - Approve booking (Admin)
- `PUT /api/bookings/{id}/reject` - Reject booking (Admin)

### Ticket Endpoints (Module C)
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/{id}/status` - Update ticket status
- `POST /api/tickets/{id}/comments` - Add comment

---

## 📄 License

This project is developed for academic purposes as part of IT3030 course requirements.

---

## 📞 Contact

For questions or issues, please contact the development team through the university LMS or GitHub repository.
