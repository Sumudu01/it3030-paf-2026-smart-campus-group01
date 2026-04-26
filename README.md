# Smart Campus Operations Hub

A comprehensive web-based platform for university facility and asset management, booking operations, and maintenance incident handling.

## 📋 Project Overview

**Project Name:** Smart Campus Operations Hub  
**Project Code:** IT3030-PAF-2026-Smart-Campus-Group147  
**Academic Year:** 2025/2026 - Year 3 Semester 2  
**Course:** IT3030 - Programming Application Frameworks  

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
- **Framework:** Spring Boot 3.2.x (Enterprise-grade Java framework)
- **Language:** Java 21 (LTS version with modern syntax and performance)
- **Database:** PostgreSQL 16 (Relational database for ACID compliance)
- **Security:** Spring Security 6.x with OAuth 2.0 (Google OIDC integration)
- **ORM:** Spring Data JPA / Hibernate (Simplified data persistence)
- **Validation:** Hibernate Validator (JSR-303)
- **Build Tool:** Maven 3.9+
- **File Storage:** Local File System (Service-abstracted)

### Frontend
- **Framework:** React 18+ (Component-based UI library)
- **Build Tool:** Vite (Modern, fast frontend build tool)
- **State Management:** React Context API (Modular global state)
- **Routing:** React Router 6.x (Declarative routing)
- **HTTP Client:** Axios (Promise-based API communication)
- **Styling:** Modular CSS & Responsive Layouts (Flexbox/Grid)

### DevOps & Tools
- **Containerization:** Docker & Docker Compose (Multi-container orchestration)
- **Web Server:** Nginx (Reverse proxy and static file serving)
- **Documentation:** README & API Specifications
- **Version Control:** Git with Branching Strategy

---

## 🏗 System Architecture & Design Patterns

### 1. Modular Layered Architecture (Backend)
The backend follows a strict 4-tier layered architecture to ensure separation of concerns and maintainability:
- **Presentation Layer:** REST Controllers handle incoming JSON requests, perform DTO mapping, and use `@Valid` for input verification.
- **Service Layer:** Contains core business logic, transaction boundaries (`@Transactional`), and cross-module integrations.
- **Repository Layer:** Abstracted data access using Spring Data JPA with custom JPQL queries for complex overlaps and filtering.
- **Entity/Model Layer:** JPA-mapped domain entities with complex relationships (One-to-Many, Many-to-One).

### 2. Frontend Component Architecture
- **Atomic Components:** Reusable UI elements (Buttons, Inputs, Modals).
- **Page Components:** Complex views that manage local state and fetch data.
- **Context Providers:** Centralized state for Authentication, UI Themes, and Notifications.
- **API Service Layer:** Abstracted Axios instances for clean communication with backend endpoints.

---

## 🧠 Core Implementation Techniques

### 🛡️ Secure Authentication & RBAC
- **OAuth 2.0 Integration:** Seamless login via Google accounts.
- **Role-Based Access Control (RBAC):** Implementation of `STUDENT`, `TECHNICIAN`, and `ADMIN` roles.
- **Session Management:** Secure session handling with Spring Security's `HttpSession`.
- **Dynamic Authorization:** Backend checks for resource ownership before allowing edits or deletions.

### 📅 Smart Resource Availability Engine
A sophisticated logic engine that determines if a resource (Room/Equipment) can be booked:
1. **Status Verification:** Ensures the resource is `ACTIVE`.
2. **Closure Check:** Cross-references with `ResourceClosure` (Holidays/Special Closures).
3. **Weekly Schedule Validation:** Checks if the requested time falls within the resource's `ResourceSchedule`.
4. **Maintenance Window Detection:** Prevents bookings during scheduled `MaintenanceWindow`.
5. **Conflict Prevention:** Executes atomic database queries to detect overlapping `PENDING` or `APPROVED` bookings.

### 🔄 Automated Booking Workflow
- **State Machine Pattern:** Bookings transition through `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`.
- **Race Condition Handling:** Re-validates availability at the moment of approval.
- **Audit Logging:** Every status change is recorded in `BookingAudit` with the timestamp and decision-maker details.

### 🛠️ Incident & Maintenance Lifecycle
- **Evidence Management:** Support for multi-image uploads (up to 3) for incident reporting.
- **Technician Assignment:** Admin workflow to assign specialized staff to tickets.
- **Resolution Tracking:** Enforced requirement for resolution notes before a ticket can be closed.
- **Communication Thread:** Interactive comment system with ownership rules (only the author can delete their comment).

### 🔔 Real-time Notification System
- **Event-Driven UI:** Notifications are triggered by backend service calls for all major lifecycle events.
- **Categorization:** Distinct types for `BOOKING`, `TICKET`, and `SYSTEM` alerts.
- **Unread Tracking:** Real-time unread count indicators in the frontend navigation.

### 🌐 Global Error Handling
- **`@RestControllerAdvice`:** Centralized exception handling for clean, consistent JSON error responses.
- **Custom Exceptions:** Domain-specific exceptions (`NotFoundException`, `ConflictException`, `ForbiddenException`) for precise error reporting.

---

## 📝 API Endpoints Detailed

### 🔑 Authentication
- `GET /oauth2/authorization/google` - Trigger Google login.
- `GET /api/auth/user` - Retrieve session user details and role.
- `POST /api/auth/logout` - Invalidate session and logout.

### 🏢 Resource & Assets (Module A)
- `GET /api/resources` - Fetch all bookable resources with filters.
- `POST /api/resources` - [ADMIN] Add new facility or equipment.
- `GET /api/resources/{id}/availability` - Check availability for specific slots.

### 📅 Booking Operations (Module B)
- `POST /api/bookings` - Submit a new booking request (with auto-overlap check).
- `GET /api/bookings/my-bookings` - Fetch current user's booking history.
- `PUT /api/bookings/{id}/approve` - [ADMIN] Approve booking and notify user.
- `PUT /api/bookings/{id}/reject` - [ADMIN] Reject booking with reason.

### 🛠️ Maintenance & Incidents (Module C)
- `POST /api/tickets` - Create incident report with image attachments.
- `PUT /api/tickets/{id}/assign` - [ADMIN] Assign a technician to a ticket.
- `PUT /api/tickets/{id}/status` - Update lifecycle (In-Progress, Resolved, etc.).
- `POST /api/tickets/{id}/comments` - Add communication to the maintenance thread.

### 🔔 User Notifications (Module D)
- `GET /api/notifications` - Fetch user-specific notification list.
- `PUT /api/notifications/{id}/read` - Mark specific notification as seen.
- `DELETE /api/notifications/clear` - Clear all notifications.

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
