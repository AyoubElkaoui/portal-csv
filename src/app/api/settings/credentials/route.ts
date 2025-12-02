import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, getUsers } from '@/lib/storage';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

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
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Huidig wachtwoord is onjuist' }, { status: 400 });
      }
    }

    // Get all users
    const users = await getUsers();
    
    // Check if new email already exists
    if (email && email !== user.email) {
      const existingUser = users.find(u => u.email === email && u.id !== user.id);
      if (existingUser) {
        return NextResponse.json({ error: 'Email is al in gebruik' }, { status: 400 });
      }
    }

    // Update user
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          ...(email && { email }),
          ...(password && { password: bcrypt.hashSync(password, 10) }),
        };
      }
      return u;
    });

    // Save to file
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    await fs.writeFile(usersFile, JSON.stringify(updatedUsers, null, 2));

    const updatedUser = updatedUsers.find(u => u.id === user.id)!;

    return NextResponse.json({
      message: 'Gegevens succesvol bijgewerkt',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
  }
}
