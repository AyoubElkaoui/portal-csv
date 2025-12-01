import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up all uploads from database...\n');

  // Show current uploads
  const uploads = await prisma.upload.findMany({
    include: {
      user: {
        select: { name: true, email: true, role: true }
      }
    },
    orderBy: { uploadedAt: 'desc' }
  });

  console.log(`Found ${uploads.length} uploads in database:\n`);
  
  uploads.forEach((upload, i) => {
    console.log(`${i + 1}. ${upload.filename}`);
    console.log(`   Status: ${upload.status}`);
    console.log(`   Uploaded: ${upload.uploadedAt.toLocaleString('nl-NL')}`);
    console.log(`   User: ${upload.user?.name || 'Unknown'} (${upload.user?.role || 'unknown'})`);
    console.log('');
  });

  // Delete all uploads
  console.log('⚠️  Deleting ALL uploads...\n');
  const deleted = await prisma.upload.deleteMany({});
  console.log(`✅ Deleted ${deleted.count} uploads`);
  console.log('💡 Users can now upload fresh files\n');
  
  await prisma.$disconnect();
}

cleanup().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
