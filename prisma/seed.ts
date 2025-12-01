import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create users first
  const anissaEmail = process.env.ANISSA_EMAIL || 'anissa@example.com';
  const reviewerEmail = process.env.REVIEWER_EMAIL || 'reviewer@example.com';
  const anissaPassword = process.env.ANISSA_PASSWORD || 'anissa123';
  const reviewerPassword = process.env.REVIEWER_PASSWORD || 'reviewer123';

  // Hash passwords
  const hashedAnissaPassword = await bcrypt.hash(anissaPassword, 10);
  const hashedReviewerPassword = await bcrypt.hash(reviewerPassword, 10);

  await prisma.user.upsert({
    where: { email: anissaEmail },
    update: {
      password: hashedAnissaPassword,
    },
    create: {
      email: anissaEmail,
      name: 'Anissa',
      role: 'uploader',
      password: hashedAnissaPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: reviewerEmail },
    update: {
      password: hashedReviewerPassword,
    },
    create: {
      email: reviewerEmail,
      name: 'Reviewer',
      role: 'reviewer',
      password: hashedReviewerPassword,
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
  console.log('📧 Uploader:', anissaEmail);
  console.log('📧 Reviewer:', reviewerEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
