import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByEmail } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Get current user info (not password)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// POST - Update credentials
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password, currentPassword } = await req.json();

    // Get current user
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password if changing password
    if (password && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password || '');
      if (!isValid) {
        return NextResponse.json({ error: 'Huidig wachtwoord is onjuist' }, { status: 400 });
      }
    }
    
    // Check if new email already exists
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Email is al in gebruik' }, { status: 400 });
      }
    }

    // Update user in database
    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json({
      message: 'Gegevens succesvol bijgewerkt',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
  }
}
