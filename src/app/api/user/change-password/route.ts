import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, getUsers } from '@/lib/storage';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Nieuw wachtwoord moet minimaal 8 karakters zijn' }, { status: 400 });
    }

    // Get current user
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Huidig wachtwoord is onjuist' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user in users.json
    const users = await getUsers();
    const updatedUsers = users.map(u => 
      u.email === session.user.email 
        ? { ...u, password: hashedPassword }
        : u
    );

    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    await fs.writeFile(usersFile, JSON.stringify(updatedUsers, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Wachtwoord succesvol gewijzigd' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden'
    }, { status: 500 });
  }
}
