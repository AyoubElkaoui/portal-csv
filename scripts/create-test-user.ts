import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const anissaPassword = await bcrypt.hash('anissa123', 10);
  const reviewerPassword = await bcrypt.hash('reviewer123', 10);

  // Create or update Anissa
  await prisma.user.upsert({
    where: { email: 'anissa@example.com' },
    update: {
      password: anissaPassword,
    },
    create: {
      id: 'anissa',
      email: 'anissa@example.com',
      name: 'Anissa',
      password: anissaPassword,
      role: 'uploader',
    },
  });

  // Create or update Reviewer
  await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {
      password: reviewerPassword,
    },
    create: {
      id: 'reviewer',
      email: 'reviewer@example.com',
      name: 'Reviewer',
      password: reviewerPassword,
      role: 'reviewer',
    },
  });

  console.log('✅ Test users aangemaakt:');
  console.log('   Anissa: anissa@example.com / anissa123');
  console.log('   Reviewer: reviewer@example.com / reviewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
