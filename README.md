# SCP Backend - Smart Compliance Platform

A robust NestJS-based backend system designed for school management, compliance tracking, and document verification. This platform enables educational institutions to manage their hierarchy (Schools and Branches) and ensure all staff and students meet regulatory compliance through a structured document management workflow.

## 🚀 Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Storage**: S3-Compatible Cloud Storage (DigitalOcean Spaces/AWS S3)
- **Mailing**: SMTP-based mailer for invitations and notifications
- **Authentication**: JWT-based Auth with Scoped RBAC

---

## 👥 Role Hierarchy & Capabilities

The system implements a strict hierarchical Role-Based Access Control (RBAC) model designed for multi-tenant school systems.

| Role | Scope | Key Responsibilities |
| :--- | :--- | :--- |
| **Platform Admin** | Global | Full system visibility. Create schools, view heuristic logs/stats, manage all users, and block/delete accounts. |
| **School Director** | School-wide | Acting Admin for the entire school. Create branches, assign branch directors, and view comprehensive branch analytics. |
| **Branch Director** | Branch-specific | Manage branch operations. Invite Teachers, Students, and Parents. Create/Assign compliance tracks and verify documents. |
| **Teacher** | Personal | Maintain personal profile, upload certifications, and track individual clearance status. |
| **Parent** | Household | Manage own documents and **all linked student documents**. Track children's compliance status. |
| **Student** | Profile Only | No direct login. Profiles are managed by Parents and Directors for compliance tracking. |

### Role Permissions Matrix

- **Platform Admin**: Heuristic view of the entire system, system-wide logs, and ultimate user management control.
- **School Director (School Admin)**: Scoped visibility across all branches. Can act as an overseer for every branch director and teacher in their school.
- **Branch Director (Branch Admin)**: Full control over branch-level data, including document type creation, nudging (reminders), and verification.
- **Parents & Teachers**: Task-oriented access. Narrow scope focused on uploading assigned documents and tracking their own/children's status.

---

## 🔄 Core System Flows

### 1. Onboarding & Invitations
The system uses an **Invitation-based Onboarding** flow to ensure secure access.
1. An Authorized User (Admin/Director/Branch Director) sends an invitation email.
2. The system generates a unique, time-limited token.
3. The Recipient follows the link, accepts the invitation, and completes their registration.
4. User profiles are automatically correctly scoped to their respective School and Branch.

### 2. Parent-Student Management
The system features a many-to-many relationship mapping between Parents and Students.
- **Multi-Child Support**: A single Parent account can be linked to multiple Students.
- **Compliance Delegation**: Parents are responsible for fulfilling documents assigned to their children (Students), as Students do not have their own system login.

### 3. Compliance & Document Lifecycle
The heart of the system is the **Compliance Engine**:
1. **Definition**: Admins/Directors define `DocumentTypes` (e.g., "Background Check", "Medical Form") and target them to specific roles.
2. **Assignment**: The system identifies "Missing" documents for users based on their role requirements.
3. **Upload**: Users (Parents/Teachers) upload documents via presigned URLs.
4. **Verification**: Directors/Admins review and "Verify" documents, marking them as `APPROVED` or `REJECTED`.
5. **Expiry tracking**: The system monitors `expiresAt` dates and provides automated alerts and "nudges" for upcoming or past-due expirations.

### 4. Advanced Analytics & Logs
- **Heuristic View**: Admins and School Directors have access to high-level dashboards showing submission rates, uploader activity, and compliance scores.
- **Compliance Stats**: Detailed counting of verified, pending, and expired documents across any scope (Global, School, or Branch).
- **Activity Monitoring**: Tracking of recent uploads and "At Risk" staff members who are missing mandatory certifications.

### 5. Staff Clearance Sync
For **Teachers**, the system provides an automated "Staff Clearance" status.
- Mandatory documents (like Background Checks or Eligibility) are grouped into clearance requirements.
- When all mandatory clearance documents are verified and active, the Teacher's `staffClearanceActive` status is automatically synchronized.

---

## 📁 Project Structure

```text
src/
├── entities/           # TypeORM Database Entities (User, School, Document, etc.)
├── modules/            # Domain-driven Modules
│   ├── auth/           # Authentication, Guards, and Scoped RBAC logic
│   ├── analytics/      # Heuristic views, stats, and dashboard data
│   ├── school/         # School and Branch management
│   ├── user/           # User profiles and role-specific data
│   ├── document/       # Compliance engine and document logic
│   ├── student-parent/ # Parent-Student link management
│   ├── invitation/     # Invitation & onboarding workflow
│   ├── storage/        # Cloud storage integration (S3/DO)
│   └── mailer/         # Email notification service
├── scripts/            # Database seeding and utility scripts
└── main.ts             # Application entry point
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PNPM
- PostgreSQL

### Installation
```bash
$ pnpm install
```

### Environment Configuration
Copy `.env.example` to `.env` and fill in the required values:
- Database credentials
- JWT Secret
- Storage (S3) credentials
- Mailer (SMTP) settings

### Running Locally
```bash
# Development mode
$ pnpm run start:dev

# Production mode
$ pnpm run start:prod
```

### Database Management
```bash
# Seed the initial Platform Admin
$ pnpm run seed:admin
```

---

## 🧪 Testing

```bash
# Unit tests
$ pnpm run test

# E2E tests
$ pnpm run test:e2e
```

---

## 📄 License
This project is proprietary and confidential.