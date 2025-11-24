'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Upload, FileText, Eye, Download, Settings, Trash2, Mail, AlertTriangle, X, CheckCircle } from 'lucide-react';

type Upload = {
  id: string;
  filename: string;
  status: string;
  uploadedAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
  emailSent?: boolean;
};

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<Upload | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchUploads = async () => {
    try {
      const res = await fetch('/api/uploads');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setUploads(data);
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    }
    setLoading(false);
  };

  const handleDelete = (upload: Upload) => {
    setUploadToDelete(upload);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!uploadToDelete) return;

    setDeleting(uploadToDelete.id);
    setDeleteModalOpen(false);
    try {
      const res = await fetch(`/api/uploads/${uploadToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUploads(uploads.filter(upload => upload.id !== uploadToDelete.id));
        addToast('success', 'Upload succesvol verwijderd');
      } else {
        addToast('error', 'Verwijderen mislukt');
      }
    } catch (err) {
      console.error('Failed to delete upload:', err);
      addToast('error', 'Verwijderen mislukt');
    } finally {
      setDeleting(null);
      setUploadToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setUploadToDelete(null);
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-full px-2 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Image
                  src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                  alt="Elmar Services Logo"
                  width={120}
                  height={37}
                  className="h-9 w-auto"
                />
              </div>
              <nav className="flex space-x-6">
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <Home className="mr-1" size={18} />
                  Home
                </Link>
                <Link href="/upload" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <Upload className="mr-1" size={18} />
                  Upload CSV
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <div className="max-w-full px-2 sm:px-4 lg:px-6 py-6">
          <div className="animate-pulse bg-gray-200 h-8 w-64 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-800'
                : 'bg-red-100 border border-red-400 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <header className="bg-white shadow-sm">
        <div className="max-w-full px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image
                src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                alt="Elmar Services Logo"
                width={120}
                height={37}
                className="h-9 w-auto"
              />
            </div>
            <nav className="flex space-x-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/upload" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Upload className="mr-1" size={18} />
                Upload CSV
              </Link>
              <Link href="/settings" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Settings className="mr-1" size={18} />
                Instellingen
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-full px-2 sm:px-4 lg:px-6 py-6">
        <h1 className="text-3xl font-bold mb-8 text-blue-600">Dashboard - CSV Review Systeem</h1>

        {uploads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Geen uploads gevonden</p>
            </div>
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Upload className="mr-2" size={20} />
              Upload je eerste CSV
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.map(upload => (
              <div
                key={upload.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 truncate" title={upload.filename}>
                      {upload.filename}
                    </h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      upload.status === 'reviewed'
                        ? 'bg-green-100 text-green-800'
                        : upload.status === 'uploaded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {upload.status === 'reviewed'
                        ? 'Goedgekeurd'
                        : upload.status === 'uploaded'
                        ? 'Wacht op Review'
                        : upload.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Uploader:</strong> {upload.user?.name || upload.user?.email || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Geüpload:</strong> {new Date(upload.uploadedAt).toLocaleString('nl-NL')}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Email:</strong> <span className="text-green-600 flex items-center"><Mail className="mr-1" size={14} />Automatisch verzonden</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {upload.status === 'reviewed' ? (
                      <>
                        <button
                          onClick={() => router.push(`/download/${upload.id}`)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Download className="mr-2" size={16} />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(upload)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                          disabled={deleting === upload.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => router.push(`/review/${upload.id}`)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Eye className="mr-2" size={16} />
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && uploadToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                Upload Verwijderen
              </h3>
              <button
                onClick={cancelDelete}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Weet je zeker dat je deze upload wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900">{uploadToDelete.filename}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Geüpload op {new Date(uploadToDelete.uploadedAt).toLocaleString('nl-NL')}
                </div>
                <div className="text-sm text-gray-600">
                  Status: {uploadToDelete.status === 'reviewed' ? 'Goedgekeurd' : uploadToDelete.status === 'uploaded' ? 'Wacht op Review' : uploadToDelete.status}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting === uploadToDelete.id}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting === uploadToDelete.id ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
