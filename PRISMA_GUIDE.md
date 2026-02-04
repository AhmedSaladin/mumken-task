# Prisma ORM Guide

This project uses Prisma as the ORM for type-safe database access. This guide explains the key Prisma concepts and workflows used in this project.

## Why Prisma?

Prisma was chosen over TypeORM for several reasons:

1. **Type Safety**: Auto-generated TypeScript types from your database schema
2. **Developer Experience**: Excellent auto-completion and IntelliSense
3. **Schema-First**: Single source of truth in `schema.prisma`
4. **Migration System**: Built-in migration management
5. **Query Builder**: Intuitive and type-safe query API
6. **Performance**: Efficient query generation and connection pooling

## Project Structure

```
prisma/
├── schema.prisma           # Database schema definition
├── seed.ts                 # Database seeding script
└── migrations/             # Migration history
    ├── migration_lock.toml
    └── 20240203000000_init/
        └── migration.sql
```

## Prisma Schema

The `schema.prisma` file is the single source of truth for your data model:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  role      Role     @default(EDITOR)
  name      String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  contents Content[]

  @@map("users")
}

model Content {
  id     Int    @id @default(autoincrement())
  title  String
  body   String @db.Text
  sector Sector
  status Status @default(DRAFT)

  created_by Int
  author     User @relation(fields: [created_by], references: [id])

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([status])
  @@index([sector])
  @@index([created_at])
  @@index([created_by, status])
  @@map("contents")
}

enum Role {
  ADMIN
  EDITOR
  REVIEWER
}

enum Status {
  DRAFT
  IN_REVIEW
  PUBLISHED
}

enum Sector {
  TECHNOLOGY
  HEALTHCARE
  FINANCE
  EDUCATION
  OTHER
}

```

### Key Features:

- **Enums**: Type-safe status and role values
- **Relations**: One-to-many relationship between User and Content
- **Default Values**: Automatic UUID generation and timestamps
- **Field Mapping**: `@map()` for custom column names
- **Table Mapping**: `@@map()` for custom table names
- **Auto-update**: `@updatedAt` automatically updates on changes

## Generated Prisma Client

After running `npx prisma generate`, Prisma creates a fully type-safe client:

```typescript
import { PrismaClient, UserRole, ContentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// All operations are type-safe
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.EDITOR, // Enum is auto-imported
  },
});

// TypeScript knows the exact shape of the result
console.log(user.id); // ✅ Type: string
console.log(user.email); // ✅ Type: string
console.log(user.invalid); // ❌ TypeScript error
```

## Prisma Service in NestJS

We've created a `PrismaService` that extends `PrismaClient`:

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy 
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Usage in Services:

```typescript
@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async createContent(data: CreateContentDto, userId: string) {
    return this.prisma.content.create({
      data: {
        ...data,
        created_by: userId,
        status: ContentStatus.DRAFT,
      },
      include: {
        created_by: true, // Include relation
      },
    });
  }

  async listContent(filters: FilterDto) {
    return this.prisma.content.findMany({
      where: {
        status: filters.status,
        sector: filters.sector,
      },
      include: {
        created_by: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
```

## Common Prisma Operations

### Create

```typescript
// Simple create
const content = await prisma.content.create({
  data: {
    title: 'Title',
    body: 'Body',
    sector: 'Tech',
    created_byId: userId,
  },
});

// Create with nested relations
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'User',
    contents: {
      create: [
        { title: 'Post 1', body: 'Content', sector: 'Tech' },
        { title: 'Post 2', body: 'Content', sector: 'Finance' },
      ],
    },
  },
  include: {
    contents: true,
  },
});
```

### Read

```typescript
// Find unique (by unique field)
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Find first matching
const content = await prisma.content.findFirst({
  where: { status: ContentStatus.DRAFT },
});

// Find many with filters
const contents = await prisma.content.findMany({
  where: {
    status: ContentStatus.PUBLISHED,
    sector: 'Technology',
  },
  include: {
    created_by: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10, // Limit
  skip: 0,  // Offset
});
```

### Update

```typescript
// Update single record
const updated = await prisma.content.update({
  where: { id: contentId },
  data: {
    status: ContentStatus.PUBLISHED,
    updatedAt: new Date(), // Optional, @updatedAt does this automatically
  },
});

// Update many
const result = await prisma.content.updateMany({
  where: { status: ContentStatus.DRAFT },
  data: { status: ContentStatus.IN_REVIEW },
});
```

### Delete

```typescript
// Delete single
await prisma.content.delete({
  where: { id: contentId },
});

// Delete many
await prisma.content.deleteMany({
  where: { status: ContentStatus.DRAFT },
});
```

## Migrations

### Development Workflow

```bash
# 1. Modify schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name add_new_field

# This will:
# - Generate SQL migration
# - Apply it to database
# - Regenerate Prisma Client
```

### Production Workflow

```bash
# Apply pending migrations
npx prisma migrate deploy

# This should be run in CI/CD before deployment
```

### Useful Migration Commands

```bash
# Check migration status
npx prisma migrate status

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Create migration without applying
npx prisma migrate dev --create-only

# Resolve migration issues
npx prisma migrate resolve
```

## Database Seeding

The seed file (`prisma/seed.ts`) populates initial data:

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.ADMIN,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npm run seed
```

## Prisma Studio

Prisma Studio is a GUI for viewing and editing database data:

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can:
- Browse all tables
- Filter and sort data
- Edit records
- View relationships

## Type Safety Examples

### Enums

```typescript
// ✅ Type-safe enum usage
await prisma.content.create({
  data: {
    status: ContentStatus.DRAFT, // Correct
  },
});

// ❌ TypeScript error
await prisma.content.create({
  data: {
    status: 'invalid', // Error: Type '"invalid"' is not assignable
  },
});
```

### Relations

```typescript
// Include relations (type-safe)
const content = await prisma.content.findUnique({
  where: { id: 'some-id' },
  include: {
    created_by: true, // ✅ Valid relation
    invalid: true,   // ❌ TypeScript error
  },
});

// Result type is inferred
content.created_by.email; // ✅ Type: string
content.created_by.invalid; // ❌ TypeScript error
```

### Filtering

```typescript
// Type-safe filters
await prisma.content.findMany({
  where: {
    status: ContentStatus.PUBLISHED, // ✅ Correct
    sector: 'Technology',             // ✅ Correct
    invalid: 'value',                 // ❌ TypeScript error
  },
});
```

## Performance Tips

### 1. Select Only Needed Fields

```typescript
// Bad: Fetches all fields
const users = await prisma.user.findMany();

// Good: Fetches only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

### 2. Use Transactions for Multiple Operations

```typescript
await prisma.$transaction([
  prisma.content.create({ data: content1 }),
  prisma.content.create({ data: content2 }),
]);
```

### 3. Connection Pooling

Prisma automatically handles connection pooling. Configure in schema:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

## Troubleshooting

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Migration failed"

**Solution:**
```bash
# Check status
npx prisma migrate status

# If needed, reset (CAUTION: Deletes data)
npx prisma migrate reset
```

### Issue: "Connection issues"

**Solution:**
Check your `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### Issue: "Type errors after schema changes"

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart TypeScript server in your IDE
```

## Best Practices

1. **Always run `prisma generate` after schema changes**
2. **Use migrations in production**, not schema push
3. **Version control your migrations**
4. **Use transactions for related operations**
5. **Select only needed fields for performance**
6. **Use Prisma Studio for debugging**
7. **Keep schema.prisma as single source of truth**
8. **Use enums for status fields**
9. **Add indexes for frequently queried fields**
10. **Document complex queries with comments**

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [NestJS + Prisma Guide](https://docs.nestjs.com/recipes/prisma)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
