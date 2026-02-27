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
- **Framework:** Spring Boot 3.x
- **Language:** Java 17+
- **Database:** PostgreSQL
- **Security:** Spring Security with OAuth 2.0 (Google Sign-In)
- **API Style:** RESTful APIs with JSON

### Frontend
- **Framework:** React 18+
- **UI Library:** Material-UI (MUI) / Custom Components
- **State Management:** React Context / Redux
- **HTTP Client:** Axios

### DevOps & Tools
- **Build Tool:** Maven (Backend) / npm (Frontend)
- **Version Control:** Git
- **IDE:** VS Code / IntelliJ IDEA

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
- Supported roles: USER, ADMIN, TECHNICIAN
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
│           Pages/Views                    │
│     (Dashboard, Booking, Tickets)       │
├─────────────────────────────────────────┤
│         Components                      │
│   (Reusable UI Elements, Forms)         │
├─────────────────────────────────────────┤
│        Services/API Layer               │
│      (HTTP Client, API Integration)      │
├─────────────────────────────────────────┤
│         Context/State                  │
│   (Auth Context, App State Management)  │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Core Tables
- **users** - User accounts with OAuth data
- **roles** - Role definitions (USER, ADMIN, TECHNICIAN)
- **resources** - Bookable facilities and equipment
- **bookings** - Booking requests and approvals
- **tickets** - Maintenance incident tickets
- **ticket_comments** - Comments on tickets
- **ticket_attachments** - Evidence images for tickets
- **notifications** - User notifications

---

## 🔐 Security Features

- OAuth 2.0 authentication with Google
- JWT token-based session management
- Role-based endpoint protection
- Input validation and sanitization
- Secure file handling for attachments
- CORS configuration
- Rate limiting

---

## 📝 API Endpoints Summary

### Authentication Endpoints
- `POST /api/auth/login` - OAuth login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Resource Endpoints (Module A)
- `GET /api/resources` - List all resources
- `GET /api/resources/{id}` - Get resource details
- `POST /api/resources` - Create resource (Admin)
- `PUT /api/resources/{id}` - Update resource (Admin)
- `DELETE /api/resources/{id}` - Delete resource (Admin)
- `GET /api/resources/search` - Search/filter resources

### Booking Endpoints (Module B)
- `GET /api/bookings` - List bookings
- `GET /api/bookings/my-bookings` - User's bookings
- `POST /api/bookings` - Create booking request
- `PUT /api/bookings/{id}/approve` - Approve booking (Admin)
- `PUT /api/bookings/{id}/reject` - Reject booking (Admin)
- `PUT /api/bookings/{id}/cancel` - Cancel booking

### Ticket Endpoints (Module C)
- `GET /api/tickets` - List tickets
- `GET /api/tickets/{id}` - Get ticket details
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/{id}` - Update ticket
- `PUT /api/tickets/{id}/status` - Update ticket status
- `PUT /api/tickets/{id}/assign` - Assign technician
- `POST /api/tickets/{id}/comments` - Add comment
- `POST /api/tickets/{id}/attachments` - Upload evidence

### Notification Endpoints (Module D)
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

---

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL 15 or higher
- Maven 3.8+
- npm 9+

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>

# Navigate to backend directory
cd backend

# Configure database in application.properties
# Update PostgreSQL connection details

# Build and run
mvn clean install
mvn spring-boot:run
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure API base URL in .env
npm start
```

---

## 📄 License

This project is developed for academic purposes as part of IT3030 course requirements.

---

## 📞 Contact

For questions or issues, please contact the development team through the university LMS or GitHub repository.
