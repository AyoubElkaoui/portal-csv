import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create users first
  const anissaEmail = process.env.ANISSA_EMAIL || 'anissa@example.com';
  const reviewerEmail = process.env.REVIEWER_EMAIL || 'reviewer@example.com';

  await prisma.user.upsert({
    where: { email: anissaEmail },
    update: {},
    create: {
      email: anissaEmail,
      name: 'Anissa',
      role: 'uploader',
    },
  });

  await prisma.user.upsert({
    where: { email: reviewerEmail },
    update: {},
    create: {
      email: reviewerEmail,
      name: 'Reviewer',
      role: 'reviewer',
    },
  });

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      uploaderEmail: anissaEmail,
      reviewerEmail: reviewerEmail,
    },
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
