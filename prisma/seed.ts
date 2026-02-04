import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Users already exist, skipping seed');
    return;
  }

  // Create sample users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@qitae.com',
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });
  console.log(
    `✅ Created user: ${admin.email} (${admin.role}) - ID: ${admin.id}`,
  );

  const editor = await prisma.user.create({
    data: {
      email: 'editor@qitae.com',
      name: 'Editor User',
      role: Role.EDITOR,
    },
  });
  console.log(
    `✅ Created user: ${editor.email} (${editor.role}) - ID: ${editor.id}`,
  );

  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer@qitae.com',
      name: 'Reviewer User',
      role: Role.REVIEWER,
    },
  });
  console.log(
    `✅ Created user: ${reviewer.email} (${reviewer.role}) - ID: ${reviewer.id}`,
  );

  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📝 Save these User IDs for testing:');
  console.log(`   Admin ID:    ${admin.id}`);
  console.log(`   Editor ID:   ${editor.id}`);
  console.log(`   Reviewer ID: ${reviewer.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
