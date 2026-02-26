'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileText, Eye, Download, Trash2, Mail, AlertTriangle, X, CheckCircle, Maximize2, Upload, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<Upload | null>(null);
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [fullscreenUpload, setFullscreenUpload] = useState<Upload | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchUploads = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/uploads');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setUploads(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Fetch uploads on mount and auto-refresh every 30 seconds
  useEffect(() => {
    fetchUploads();
    const interval = setInterval(() => fetchUploads(), 30000);
    return () => clearInterval(interval);
  }, [fetchUploads]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const isReviewer = session.user?.role === 'reviewer';
  const isUploader = session.user?.role === 'uploader';

  // API already filters based on role, so we just need to display them
  // For reviewer: API returns only 'uploaded' status
  // For uploader: API returns only their own uploads
  
  // For uploader, only show 'reviewed' uploads (ready to download)
  const filteredUploads = isUploader 
    ? uploads.filter(upload => upload.status === 'reviewed')
    : uploads; // Reviewer sees all uploads from API (already filtered to 'uploaded')

  // Show all uploads (max 5)
  const displayUploads = filteredUploads;

  // Check if user can upload (max 5 uploads at a time)
  const canUpload = isUploader && uploads.length < 5;

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

  const openFullscreen = async (upload: Upload) => {
    setFullscreenUpload(upload);
    setFullscreenModalOpen(true);
    setLoadingTable(true);
    try {
      const response = await fetch(`/api/uploads/${upload.id}`);
      if (response.ok) {
        const data = await response.json();
        setTableData(data.data || []);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      addToast('error', 'Fout bij het laden van tabelgegevens');
    } finally {
      setLoadingTable(false);
    }
  };

  const closeFullscreen = () => {
    setFullscreenModalOpen(false);
    setFullscreenUpload(null);
    setTableData([]);
  };

  const handleDelete = (upload: Upload) => {
    setUploadToDelete(upload);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setUploadToDelete(null);
  };

  const confirmDelete = async () => {
    if (!uploadToDelete) return;

    setDeleting(uploadToDelete.id);
    try {
      const response = await fetch(`/api/uploads/${uploadToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addToast('success', 'Upload succesvol verwijderd');
        fetchUploads(); // Refresh the list
        setDeleteModalOpen(false);
        setUploadToDelete(null);
      } else {
        addToast('error', 'Fout bij het verwijderen van de upload');
      }
    } catch (error) {
      console.error('Error deleting upload:', error);
      addToast('error', 'Fout bij het verwijderen van de upload');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-xl shadow-lg transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
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
              className="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructie Banner */}
        <div className="mb-8 card-modern p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {isReviewer ? 'Welkom Reviewer' : 'Welkom Uploader'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isReviewer
              ? 'Bestanden die wachten op review staan hieronder. Na je review verschijnt het bestand bij de uploader voor download.'
              : 'Upload tot 5 bestanden tegelijk. Na review ontvang je een email en kun je het bestand downloaden. Na download wordt het automatisch verwijderd.'
            }
          </p>
          {isUploader && !canUpload && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
              <p className="text-amber-800 dark:text-amber-400 text-sm">
                Maximum aantal bestanden (5) bereikt. Download eerst een bestand voordat je een nieuw bestand kunt uploaden.
              </p>
            </div>
          )}
        </div>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
              {isReviewer ? 'Review Dashboard' : 'Mijn Uploads'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {isReviewer
                ? 'Review de facturen en keur ze goed of markeer problemen'
                : 'Beheer je factuur uploads en download gereviewde bestanden'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                Bijgewerkt: {lastRefresh.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchUploads(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all disabled:opacity-50"
              title="Vernieuwen"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {displayUploads.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <div className="card-modern p-12 max-w-md mx-auto">
              <div className="text-slate-500 dark:text-slate-400 mb-6">
                <FileText size={64} className="mx-auto mb-6 opacity-50" />
                <div className="text-xl font-semibold mb-2">
                  {isReviewer ? 'Geen uploads om te reviewen' : 'Geen uploads beschikbaar'}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {isReviewer
                    ? 'Er zijn momenteel geen uploads die wachten op review. Je krijgt een email zodra er een nieuw bestand is geupload.'
                    : canUpload 
                      ? 'Je hebt geen uploads in behandeling. Upload een nieuw bestand om te beginnen.' 
                      : 'Zodra je bestand is gereviewed, verschijnt het hier voor download.'
                  }
                </p>
              </div>
              {canUpload && (
                <Link
                  href="/upload"
                  className="btn-primary inline-flex items-center text-center w-full justify-center"
                >
                  <Upload className="mr-2" size={20} />
                  Upload nieuw bestand
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {displayUploads.map((upload, index) => (
              <div
                key={upload.id}
                className="card-modern fade-in mb-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`status-badge ${
                      upload.status === 'reviewed' ? 'status-reviewed' :
                      upload.status === 'uploaded' ? 'status-uploaded' : 'status-processing'
                    }`}>
                      {upload.status === 'reviewed'
                        ? 'Gereviewed'
                        : upload.status === 'uploaded'
                        ? 'Wacht op review'
                        : upload.status}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                      #{String(upload.id).slice(-6)}
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate mb-3" title={upload.filename}>
                    {upload.filename}
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <strong className="mr-2">Uploader:</strong>
                      <span>{upload.user?.name || upload.user?.email || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <strong className="mr-2">Geüpload:</strong>
                      <span>{new Date(upload.uploadedAt).toLocaleString('nl-NL')}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-green-600 dark:text-green-400 font-medium">Email verzonden</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {upload.status === 'reviewed' ? (
                      <>
                        {isUploader && (
                          <button
                            onClick={() => router.push(`/download/${upload.id}`)}
                            className="flex-1 btn-primary flex items-center justify-center text-sm"
                          >
                            <Download className="mr-2" size={16} />
                            Download
                          </button>
                        )}
                        {isUploader && (
                          <button
                            onClick={() => openFullscreen(upload)}
                            className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center text-sm"
                            title="Bekijken"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        )}
                        {isUploader && (
                          <button
                            onClick={() => handleDelete(upload)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center text-sm"
                            disabled={deleting === upload.id}
                            title="Verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {isReviewer && (
                          <button
                            onClick={() => router.push(`/review/${upload.id}`)}
                            className="flex-1 btn-primary flex items-center justify-center text-sm"
                          >
                            <Eye className="mr-2" size={16} />
                            Review
                          </button>
                        )}
                        <button
                          onClick={() => openFullscreen(upload)}
                          className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center text-sm"
                          title="Bekijken"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-modern bg-white dark:bg-slate-800 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold flex items-center text-slate-900 dark:text-white">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                  Upload Verwijderen
                </h3>
                <button
                  onClick={cancelDelete}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Weet je zeker dat je deze upload wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </p>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="font-semibold text-slate-900 dark:text-white mb-2">{uploadToDelete.filename}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Geüpload op {new Date(uploadToDelete.uploadedAt).toLocaleString('nl-NL')}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Status: <span className={`font-medium ${
                      uploadToDelete.status === 'reviewed' ? 'text-green-600' :
                      uploadToDelete.status === 'uploaded' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {uploadToDelete.status === 'reviewed' ? 'Goedgekeurd' :
                       uploadToDelete.status === 'uploaded' ? 'Wacht op Review' : uploadToDelete.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl transition-colors font-medium"
                >
                  Annuleren
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting === uploadToDelete.id}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {deleting === uploadToDelete.id ? 'Verwijderen...' : 'Verwijderen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenModalOpen && fullscreenUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="card-modern bg-white dark:bg-slate-800 w-full h-full max-w-7xl max-h-[90vh] mx-4 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{fullscreenUpload.filename}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Geüpload op {new Date(fullscreenUpload.uploadedAt).toLocaleString('nl-NL')} •
                    Status: <span className={`font-medium ${
                      fullscreenUpload.status === 'reviewed' ? 'text-green-600' :
                      fullscreenUpload.status === 'uploaded' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {fullscreenUpload.status === 'reviewed' ? 'Goedgekeurd' :
                       fullscreenUpload.status === 'uploaded' ? 'Wacht op Review' : fullscreenUpload.status}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeFullscreen}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-600">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Bestandsinformatie
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300 mr-2">Uploader:</span>
                    <span className="text-slate-900 dark:text-white">{fullscreenUpload.user?.name || fullscreenUpload.user?.email || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-green-500 mr-2" />
                    <span className="font-medium text-slate-700 dark:text-slate-300 mr-2">Email verzonden:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Automatisch</span>
                  </div>
                </div>
              </div>

              <div className="card-modern overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Gegevens overzicht</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {tableData.length} rij(en) • Alle kolommen uit je Excel bestand
                  </p>
                </div>

                {loadingTable ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Tabel laden...</p>
                  </div>
                ) : tableData.length > 0 ? (
                  <div className="overflow-x-auto max-h-96">
                    <table className="table-modern w-full text-sm">
                      <thead>
                        <tr>
                          {Object.keys(tableData[0] || {}).map((key) => (
                            <th key={key} className="px-6 py-4 text-left font-semibold text-white border-r border-white/20 last:border-r-0">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800">
                        {tableData.slice(0, 50).map((row, index) => (
                          <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            {Object.values(row).map((value: unknown, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0 max-w-xs truncate" title={String(value || '')}>
                                {String(value || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {tableData.length > 50 && (
                          <tr>
                            <td colSpan={Object.keys(tableData[0] || {}).length} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 font-medium">
                              ... en nog {tableData.length - 50} rijen (alleen eerste 50 getoond)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Geen data beschikbaar</h3>
                    <p className="text-sm">
                      Er is nog geen data beschikbaar voor dit bestand.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center bg-slate-50 dark:bg-slate-700 rounded-b-xl">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Klik op de X om dit venster te sluiten
              </div>
              <div className="flex gap-3">
                {fullscreenUpload.status === 'reviewed' ? (
                  <button
                    onClick={() => {
                      closeFullscreen();
                      router.push(`/download/${fullscreenUpload.id}`);
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Download className="mr-2" size={16} />
                    Download
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      closeFullscreen();
                      router.push(`/review/${fullscreenUpload.id}`);
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Eye className="mr-2" size={16} />
                    Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
