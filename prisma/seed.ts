import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default users - JE KUNT DIT LATER AANPASSEN IN DE APP!
  const hashedPassword = await bcrypt.hash('anissa123', 10);

  await prisma.user.upsert({
    where: { email: 'anissa@elmarservices.nl' },
    update: {},
    create: {
      email: 'anissa@elmarservices.nl',
      name: 'Anissa',
      role: 'uploader',
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'reviewer@elmarservices.nl' },
    update: {},
    create: {
      email: 'reviewer@elmarservices.nl',
      name: 'Reviewer',
      role: 'reviewer',
      password: hashedPassword,
    },
  });

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      uploaderEmail: 'anissa@elmarservices.nl',
      reviewerEmail: 'reviewer@elmarservices.nl',
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('📧 Uploader: anissa@elmarservices.nl / anissa123');
  console.log('📧 Reviewer: reviewer@elmarservices.nl / anissa123');
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
