# Qitae Backend - Editorial Content Management System

A backend module implementing editorial content management with role-based workflow, built with NestJS, TypeScript, and PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Roles and Permissions](#roles-and-permissions)
- [Asynchronous Behavior](#asynchronous-behavior)
- [Key Design Decisions](#key-design-decisions)
- [Testing](#testing)
- [Future Improvements](#future-improvements)

## Overview

This project implements a content management workflow with three distinct states (Draft, In Review, Published) and three user roles (Admin, Editor, Reviewer) with appropriate permissions enforced at the backend level.

### Tech Stack

- **Backend Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Language**: TypeScript
- **Validation**: class-validator, class-transformer
- **Containerization**: Docker & Docker Compose

## Project Structure

```
mumken-task/
├── prisma/
│   ├── migrations/           # Database migrations
│   ├── schema.prisma         # Prisma schema definition
│   └── seed.ts               # Database seeding script
├── src/
│   ├── common/
│   │   ├── decorators/       # Custom decorators (CurrentUser, Roles)
│   │   ├── guards/           # Authorization guards (RolesGuard)
│   │   └── interceptors/     # Application interceptors (response-interceptor)
│   │   └── interfaces/       # payloads used in service level
│   │   └── middleware/       # Mock authentication middleware
│   │   └── services/         # Application shared services (async-jobs)
│   │   └── utils/            # Application shared utilizes (constants, messages)
│   ├── database/
│   │   ├── database.service.ts # Prisma client service
│   │   └── database.module.ts  # Prisma module
│   ├── components/
│   │   └── content/        
│   │       ├── controllers # REST API endpoints
│   │       ├── dtos        # REST API response mappers
│   │       ├── guards      # Component local guards
│   │       ├── interfaces  # Business logic validations
│   │       ├── services    # Business Logic
│   │       └── validations # REST API requests validations
│   ├── configuration/
│   │   └── configuration.ts          # Application environment variables
│   │   └── env.validation.ts         # Environment variables validation
│   │   └── swagger.config.ts         # Swagger docs configuration
│   │   └── validation-pipe.config.ts # Global validation pipe configuration
│   ├── app.module.ts         # Root application module
│   └── main.ts               # Application entry point
├── docker-compose.yml        # Docker services configuration
├── Dockerfile                # Application container definition
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 20+ (if running locally)
- Docker & Docker Compose (recommended)
- PostgreSQL 14+ (if running locally without Docker)

### Option 1: Running with Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/AhmedSaladin/mumken-task.git
   cd mumken-task
   ```

2. **Create environment file**

   ```bash
   cp .env.example .env
   ```

3. **Start services with Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database on port 5432
   - Build and start the NestJS application on port 3000
   - Automatically create database tables

4. **Seed the database with sample users**

   ```bash
   docker-compose exec app npm run ts-node src/scripts/seed.ts
   ```

   This creates three users:
   - Admin: `admin@qitae.com`
   - Editor: `editor@qitae.com`
   - Reviewer: `reviewer@qitae.com`

5. **Access the API**
   ```
   http://localhost:3000
   ```

### Option 2: Running Locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup PostgreSQL**
   - Create a database named `qitae_db`
   - Update `.env` with your database connection string:
     ```
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qitae_db?schema=public"
     ```

3. **Run Prisma migrations**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Start the application**

   ```bash
   npm run start:dev
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

### Database Migration Strategy

This project uses Prisma Migrate for database schema management.

**Migrations are already created and will run automatically** when you start the Docker containers or can be run manually:

```bash
# Generate Prisma Client (creates TypeScript types from schema)
npx prisma generate

# Apply pending migrations
npx prisma migrate deploy

# Create a new migration (in development)
npx prisma migrate dev --name description_of_changes
```

**For production environments**:

1. Always run migrations before deploying new code
2. Use `prisma migrate deploy` in CI/CD pipelines
3. Never use `prisma migrate dev` in production
4. Version control all migration files in `prisma/migrations/`

**Useful Prisma Commands**:

```bash
# View database with Prisma Studio (GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## API Endpoints

### Authentication

All endpoints use a mock authentication system via the `x-user-id` header. Include the user's UUID in the header:

```
x-user-id: <user-uuid>
```

After seeding, use the printed user IDs from the console output.

### Content Endpoints

#### 1. Create Draft

```http
POST /content
Headers: x-user-id: <editor-or-admin-uuid>
Body: {
  "title": "Introduction to AI",
  "body": "This article explores artificial intelligence...",
  "sector": "Technology"
}
```

**Permissions**: Editor, Admin

#### 2. Update Content

```http
PUT /content/:id
Headers: x-user-id: <editor-or-admin-uuid>
Body: {
  "title": "Updated Title",
  "body": "Updated content...",
  "sector": "Healthcare"
}
```

**Permissions**:

- Editors can update their own drafts
- Admins can update any content

#### 3. Submit for Review

```http
PATCH /content/:id/submit-for-review
Headers: x-user-id: <editor-or-admin-uuid>
```

**Permissions**: Editor (own content), Admin
**Transitions**: Draft → In Review

#### 4. Approve and Publish

```http
PATCH /content/:id/approve
Headers: x-user-id: <reviewer-or-admin-uuid>
```

**Permissions**: Reviewer, Admin
**Transitions**: In Review → Published

#### 5. List Content

```http
GET /content?status=draft&sector=Technology
```

**Query Parameters** (optional):

- `status`: Filter by content status (draft, in_review, published)
- `sector`: Filter by sector

**Permissions**: All users

### Sample Request Flow

```bash
# 1. Create a draft (as editor)
curl -X POST http://localhost:3000/content \
  -H "Content-Type: application/json" \
  -H "x-user-id: <editor-uuid>" \
  -d '{
    "title": "Machine Learning Basics",
    "body": "An introduction to machine learning concepts",
    "sector": "Technology"
  }'

# 2. Submit for review (as editor)
curl -X PATCH http://localhost:3000/content/<content-id>/submit-for-review \
  -H "x-user-id: <editor-uuid>"

# 3. Approve and publish (as reviewer)
curl -X PATCH http://localhost:3000/content/<content-id>/approve \
  -H "x-user-id: <reviewer-uuid>"

# 4. List all published content
curl http://localhost:3000/content?status=published
```

## Roles and Permissions

The system implements three roles with specific permissions:

### Admin

- Full access to all operations
- Can create, update, submit, and approve content
- Can update any content regardless of ownership
- Can edit published content

### Editor

- Can create new drafts
- Can update their own drafts
- Can submit their own content for review
- Cannot approve content
- Cannot edit others' content
- Cannot edit published content

### Reviewer

- Cannot create or edit content
- Can approve content in review status
- Transitions content from "In Review" to "Published"

### Permission Enforcement

Permissions are enforced at multiple levels:

1. **Route-Level Guards**: The `@Roles()` decorator restricts endpoint access

   ```typescript
   @Roles(UserRole.EDITOR, UserRole.ADMIN)
   async createDraft() { ... }
   ```

2. **Service-Level Validation**: Business logic validates ownership and state transitions

   ```typescript
    UserCannotEditGuard(
      content.created_by,
      user.id,
      user.role,
      ErrorMessage.ACTION_IS_NOT_ALLOWED,
    );
   ```

3. **State Machine**: Content status transitions are strictly controlled
   - Draft → In Review (Editor/Admin who created it)
   - In Review → Published (Reviewer/Admin)

## Asynchronous Behavior

The `NotificationService` implements simple async operations to demonstrate asynchronous processing:

### 1. Status Change Notifications

When content status changes (e.g., Draft → In Review, In Review → Published), an async notification is logged:

```typescript
async notifyStatusChange(
  contentId: string,
  previousStatus: ContentStatus,
  newStatus: ContentStatus,
  userId: string,
): Promise<void> {
  // Simulates sending notifications, emails, etc.
  setTimeout(() => {
    this.logger.log(`Content ${contentId} status changed...`);
  }, 100);
}
```

### 2. Analytics Logging

Content actions (create, update) are logged asynchronously for analytics:

```typescript
async logContentAction(
  action: string,
  contentId: string,
  userId: string,
): Promise<void> {
  // Simulates logging to analytics service
  setTimeout(() => {
    this.logger.log(`Action: ${action}, Content: ${contentId}...`);
  }, 50);
}
```

**Production Implementation**: In a real system, these would:

- Send emails via SendGrid/AWS SES
- Push notifications to mobile devices
- Write to message queues (RabbitMQ, SQS)
- Log to analytics platforms (Mixpanel, Amplitude)
- Trigger webhooks to external systems

## Key Design Decisions

### 1. **Prisma Over TypeORM**

- Type-safe database client with excellent TypeScript support
- Intuitive schema definition with Prisma Schema Language
- Automatic migrations with `prisma migrate`
- Built-in database introspection and seeding
- Superior developer experience with auto-completion
- Efficient query generation and performance

### 2. **Mock Authentication Middleware**

- Simple header-based auth (`x-user-id`) for assignment purposes
- Easy to replace with JWT/session-based auth in production
- Middleware injects user into request object

### 3. **Guard-Based Authorization**

- `RolesGuard` provides declarative role-based access control
- Easy to read and maintain
- Separates authorization logic from business logic

### 4. **Service Layer for Business Logic**

- Controller handles HTTP concerns only
- Service contains all business rules and state validation
- Makes testing easier and promotes reusability

### 5. **Prisma Schema for Type Safety**

- Schema-first approach with `schema.prisma`
- Enums defined in schema and generated as TypeScript types
- Database-level constraints via PostgreSQL enums
- Auto-generated Prisma Client with full type inference
- Single source of truth for data models

### 6. **Async Without External Dependencies**

- Demonstrates async patterns without requiring external services
- Production-ready structure for real async operations
- Fire-and-forget pattern for non-critical operations

### 7. **Validation with DTOs**

- `class-validator` provides declarative validation
- Automatically transforms and validates incoming requests
- Reduces boilerplate in controllers

## Testing

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Test Coverage

The `content.service.spec.ts` file includes tests for:

- ✅ Creating drafts with proper role validation
- ✅ Updating content with ownership checks
- ✅ Submitting content for review
- ✅ Approving and publishing content
- ✅ Permission enforcement (ForbiddenException)
- ✅ Entity not found handling (NotFoundException)
- ✅ Async notification triggers

### Test Structure

Tests use:

- **Jest** as the test runner
- **Mocked repositories** to isolate service logic
- **Multiple user personas** (editor, reviewer, admin)
- **Assertion of async calls** to NotificationService

Example test:

```typescript
it('should approve content when user is a reviewer', async () => {
  const mockContent = { /* ... */ status: ContentStatus.IN_REVIEW };
  mockContentRepository.findOne.mockResolvedValue(mockContent);

  const result = await service.approveAndPublish('content-123', mockReviewer);

  expect(result.status).toBe(ContentStatus.PUBLISHED);
  expect(mockNotificationService.notifyStatusChange).toHaveBeenCalled();
});
```

## Future Improvements

Given more time, here are enhancements I would implement:

### 1. **Enhanced Security**

- Implement JWT-based authentication with refresh tokens
- Add password hashing with bcrypt
- Rate limiting on API endpoints
- CSRF protection
- Input sanitization against XSS

### 2. **Audit Logging**

- Complete audit trail for all content changes
- Store who changed what and when
- Separate audit log table with immutable records
- Queryable history for compliance

### 3. **Pagination & Filtering**

- Implement cursor-based pagination for list endpoints
- Add sorting options (by date, title, etc.)
- Full-text search on title and body
- Advanced filtering (date ranges, multiple sectors)

### 4. **Soft Delete**

- Add `deleted_at` timestamp to entities
- Allow content restoration
- Admin-only permanent deletion
- Filter out deleted content by default

### 5. **Real Async Processing**

- Integrate message queue (Bull/BullMQ with Redis)
- Background jobs for email notifications
- Scheduled publishing
- Batch operations

### 6. **API Documentation**

- Authentication flow documentation

### 7. **Caching Layer**

- Redis for frequently accessed content
- Cache invalidation strategy
- API response caching
- Database query result caching

### 8. **Content Versioning**

- Track all revisions of content
- Ability to revert to previous versions
- Compare versions
- Restore from history

### 9. **Advanced Permissions**

- Fine-grained permissions system
- Content ownership transfer
- Sector-based access control
- Custom roles and permissions

### 10. **Monitoring & Observability**

- Integration with Sentry/Datadog
- Performance metrics
- Error tracking and alerting
- Health check endpoints
- Structured logging with correlation IDs

### 11. **Database Optimization**

- Proper indexing strategy (status, sector, created_at)
- Query optimization
- Connection pooling configuration
- Read replicas for scaling

### 12. **Deployment & Scalability**

- Kubernetes manifests
- CI/CD pipeline (GitHub Actions)
- Multi-stage Docker builds
- Environment-specific configurations
- Horizontal scaling strategy
- Load balancing

### 13. **Testing Improvements**

- Integration tests with test database
- E2E tests for complete workflows
- Performance tests
- Security tests (OWASP)
- Contract testing for APIs

### 14. **Content Validation**

- Plagiarism detection
- Content length requirements
- Image/media upload support
- Rich text editor compatibility
- Content templates

## Deployment Notes

### Environment Variables

Required environment variables for production:

```env
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"
PORT=3000
NODE_ENV=production
```

### Scaling Approach

**Horizontal Scaling**:

- Stateless application design allows multiple instances
- Load balancer (NGINX/AWS ALB) distributes traffic
- Shared PostgreSQL database or read replicas

**Database Scaling**:

- Primary-replica setup for read-heavy workloads
- Connection pooling (PgBouncer)
- Partitioning large tables by date/sector

**Caching**:

- Redis for session storage and caching
- CDN for static assets

**Monitoring**:

- Health checks at `/health`
- Metrics endpoint for Prometheus
- Structured logging to ELK stack

