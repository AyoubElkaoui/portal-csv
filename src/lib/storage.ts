import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Types
export interface Upload {
  id: string;
  userId: string;
  filename: string;
  status: 'uploaded' | 'reviewed' | 'processed';
  reviewedAt?: string;
  comments?: string;
  reviewedData?: any;
  uploadedAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'uploader' | 'reviewer';
}

export interface Settings {
  uploaderEmail: string;
  reviewerEmail: string;
}

// Initialize data directory
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Users
export async function getUsers(): Promise<User[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Default users
    const defaultUsers: User[] = [
      {
        id: 'anissa-user',
        email: 'anissa@elmarservices.com',
        password: '$2b$10$69IWnZG4jNTgUkPjEupxle8wrcQBa9UDO0Cqf963IPrLd6xxiF8UC', // Elmar@2025!
        name: 'Anissa',
        role: 'uploader'
      },
      {
        id: 'rachid-user',
        email: 'rachid@elmarservices.com',
        password: '$2b$10$69IWnZG4jNTgUkPjEupxle8wrcQBa9UDO0Cqf963IPrLd6xxiF8UC', // Elmar@2025!
        name: 'Rachid',
        role: 'reviewer'
      }
    ];
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.email === email) || null;
}

// Settings
export async function getSettings(): Promise<Settings> {
  // Use environment variables for production (Vercel has read-only filesystem)
  if (process.env.VERCEL) {
    return {
      uploaderEmail: process.env.UPLOADER_EMAIL || 'anissa@elmarservices.com',
      reviewerEmail: process.env.REVIEWER_EMAIL || 'info@akwebsolutions.nl'
    };
  }

  await ensureDataDir();
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const defaultSettings: Settings = {
      uploaderEmail: 'anissa@elmarservices.com',
      reviewerEmail: 'info@akwebsolutions.nl'
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  // On Vercel, settings are read-only from environment variables
  if (process.env.VERCEL) {
    console.warn('Settings cannot be updated on Vercel. Configure via environment variables.');
    return getSettings(); // Return current settings
  }

  const current = await getSettings();
  const updated = { ...current, ...settings };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

// Uploads
export async function createUpload(data: {
  userId: string;
  filename: string;
  fileData: any;
}): Promise<Upload> {
  await ensureDataDir();
  
  const upload: Upload = {
    id: randomUUID(),
    userId: data.userId,
    filename: data.filename,
    status: 'uploaded',
    uploadedAt: new Date().toISOString()
  };

  // Save metadata
  const metadataPath = path.join(UPLOADS_DIR, `${upload.id}.json`);
  await fs.writeFile(metadataPath, JSON.stringify(upload, null, 2));

  // Save file data
  const dataPath = path.join(UPLOADS_DIR, `${upload.id}.data.json`);
  await fs.writeFile(dataPath, JSON.stringify(data.fileData, null, 2));

  return upload;
}

export async function getUpload(id: string): Promise<Upload | null> {
  try {
    const metadataPath = path.join(UPLOADS_DIR, `${id}.json`);
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getUploadData(id: string): Promise<any> {
  try {
    const dataPath = path.join(UPLOADS_DIR, `${id}.data.json`);
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getAllUploads(): Promise<Upload[]> {
  await ensureDataDir();
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const metadataFiles = files.filter(f => f.endsWith('.json') && !f.includes('.data.'));
    
    const uploads = await Promise.all(
      metadataFiles.map(async (file) => {
        const id = file.replace('.json', '');
        return getUpload(id);
      })
    );
    
    return uploads.filter((u): u is Upload => u !== null);
  } catch {
    return [];
  }
}

export async function updateUpload(id: string, updates: Partial<Upload>): Promise<Upload | null> {
  const upload = await getUpload(id);
  if (!upload) return null;

  const updated = { ...upload, ...updates };
  const metadataPath = path.join(UPLOADS_DIR, `${id}.json`);
  await fs.writeFile(metadataPath, JSON.stringify(updated, null, 2));

  return updated;
}

export async function updateUploadData(id: string, data: any): Promise<void> {
  const dataPath = path.join(UPLOADS_DIR, `${id}.data.json`);
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

export async function deleteUpload(id: string): Promise<void> {
  const metadataPath = path.join(UPLOADS_DIR, `${id}.json`);
  const dataPath = path.join(UPLOADS_DIR, `${id}.data.json`);
  
  try {
    await fs.unlink(metadataPath);
    await fs.unlink(dataPath);
  } catch {
    // Files might not exist
  }
}
