import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default users - wachtwoord: Elmar@2025
  const hashedPassword = await bcrypt.hash('Elmar@2025', 10);

  // Update or create users
  await prisma.user.upsert({
    where: { email: 'anissa@elmarservices.com' },
    update: {
      password: hashedPassword, // Update password to ensure it's correct
      name: 'Anissa',
      role: 'uploader',
    },
    create: {
      email: 'anissa@elmarservices.com',
      name: 'Anissa',
      role: 'uploader',
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'brahim@elmarservices.com' },
    update: {
      password: hashedPassword, // Update password to ensure it's correct
      name: 'Brahim',
      role: 'reviewer',
    },
    create: {
      email: 'brahim@elmarservices.com',
      name: 'Brahim',
      role: 'reviewer',
      password: hashedPassword,
    },
  });

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {
      uploaderEmail: 'anissa@elmarservices.com',
      reviewerEmail: 'brahim@elmarservices.com',
    },
    create: {
      id: 'default',
      uploaderEmail: 'anissa@elmarservices.com',
      reviewerEmail: 'brahim@elmarservices.com',
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('📧 Uploader: anissa@elmarservices.com / Elmar@2025');
  console.log('📧 Reviewer: brahim@elmarservices.com / Elmar@2025');
  console.log('💡 Wijzig deze credentials via Settings in de app!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
