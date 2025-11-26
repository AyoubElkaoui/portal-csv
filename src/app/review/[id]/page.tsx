'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, X, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface RowData extends Record<string, unknown> {
  _comments?: string;
  _rejected?: boolean;
}

interface UploadData {
  upload: {
    id: string;
    filename: string;
    status: string;
    uploadedAt: string;
    comments?: string;
  };
  data: RowData[];
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function ReviewPage() {
  const params = useParams();
  const uploadId = params.id as string;

  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [reviewedData, setReviewedData] = useState<RowData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [tempComment, setTempComment] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false); // Start normal size by default

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const calculateDaysOpen = (row: RowData) => {
    const invoiceDate = row['Factuurdatum'] || row['factuurdatum'];
    const paymentTerm = row['Betalingstermijn'] || row['betalingstermijn'] || row['Termijn'] || row['termijn'];

    if (!invoiceDate || !paymentTerm) return null;

    try {
      const invoiceDateObj = new Date(invoiceDate as string);
      const currentDate = new Date();
      const paymentTermDays = parseInt(paymentTerm as string);

      if (isNaN(paymentTermDays)) return null;

      // Calculate due date
      const dueDate = new Date(invoiceDateObj);
      dueDate.setDate(dueDate.getDate() + paymentTermDays);

      // Calculate days remaining until due date (positive) or days overdue (negative)
      const timeDiff = dueDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return daysDiff;
    } catch {
      return null;
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchUploadData = useCallback(async () => {
    try {
      const response = await fetch(`/api/review/${uploadId}`);
      if (response.ok) {
        const data = await response.json();
        setUploadData(data);
        // Initialize reviewed data with empty comments and no rejections
        const initializedData = data.data.map((row: RowData) => ({
          ...row,
          _comments: '',
          _rejected: false
        }));
        setReviewedData(initializedData);
        setComments(data.upload.comments || '');
      }
    } catch (error) {
      console.error('Failed to fetch upload data:', error);
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    fetchUploadData();
  }, [fetchUploadData]);

  const updateRowComments = (index: number, comments: string) => {
    const newData = [...reviewedData];
    newData[index] = { ...newData[index], _comments: comments };
    setReviewedData(newData);
  };

  const toggleRowRejection = (index: number) => {
    const newData = [...reviewedData];
    newData[index] = { ...newData[index], _rejected: !newData[index]._rejected };
    setReviewedData(newData);
  };

  const handleRowClick = (index: number) => {
    setSelectedRowIndex(index);
    setTempComment(reviewedData[index]._comments || '');
    setCommentModalOpen(true);
    // Automatically reject the row when clicking on comment
    toggleRowRejection(index);
  };

  const handleCommentSave = () => {
    if (selectedRowIndex !== null) {
      updateRowComments(selectedRowIndex, tempComment);
    }
    setCommentModalOpen(false);
    setSelectedRowIndex(null);
    setTempComment('');
  };

  const handleCommentCancel = () => {
    setCommentModalOpen(false);
    setSelectedRowIndex(null);
    setTempComment('');
  };

  const addQuickComment = (comment: string) => {
    if (selectedRowIndex !== null) {
      const currentComment = reviewedData[selectedRowIndex]._comments || '';
      const newComment = currentComment ? `${currentComment}; ${comment}` : comment;
      updateRowComments(selectedRowIndex, newComment);
    }
  };

  const quickActions = [
    { label: 'Herinnering sturen', value: 'Herinnering verstuurd naar debiteur' },
    { label: 'Bellen', value: 'Telefoongesprek gevoerd met debiteur' },
    { label: 'Namen', value: 'Overgedragen aan: ' },
  ];

  const colleagues = [
    'Jan Jansen',
    'Marieke de Vries',
    'Peter Bakker',
    'Sandra Visser',
    'Robert Mulder',
    'Linda Smit'
  ];

  const handleSubmitReview = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/review/${uploadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments,
          reviewedData,
        }),
      });

      if (response.ok) {
        addToast('success', 'Review voltooid! Upload is gemarkeerd als reviewed.');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        addToast('error', 'Review opslaan mislukt');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      addToast('error', 'Review opslaan mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-full px-2 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Image
                  src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                  alt="Elmar Services Logo"
                  width={120}
                  height={37}
                  className="h-9 w-auto brightness-0 invert dark:brightness-100 dark:invert-0"
                />
              </div>
              <nav className="flex space-x-6 items-center">
                <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                  <Home className="mr-1" size={18} />
                  Home
                </Link>
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                  <ArrowLeft className="mr-1" size={18} />
                  Back to Dashboard
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-64 rounded mb-8"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded mb-6"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded"></div>
        </div>
      </div>
    );
  }

  if (!uploadData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-full px-2 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Image
                  src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                  alt="Elmar Services Logo"
                  width={120}
                  height={37}
                  className="h-9 w-auto brightness-0 invert dark:brightness-100 dark:invert-0"
                />
              </div>
              <nav className="flex space-x-6 items-center">
                <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                  <Home className="mr-1" size={18} />
                  Home
                </Link>
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                  <ArrowLeft className="mr-1" size={18} />
                  Back to Dashboard
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Upload niet gevonden</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">De opgevraagde upload bestaat niet.</p>
            <Link href="/dashboard" className="btn-primary inline-flex items-center">
              <ArrowLeft className="mr-2" size={20} />
              Terug naar Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const issuesCount = reviewedData.filter(row => row._status === 'issue').length;

  // Get all column names from the data (excluding internal fields and unwanted columns)
  const getAllColumns = () => {
    if (!reviewedData.length) return [];
    const firstRow = reviewedData[0];
    return Object.keys(firstRow).filter(key =>
      !key.startsWith('_') &&
      !['Achterstallige dagen', 'Aantal dagen open'].includes(key)
    );
  };

  const allColumns = getAllColumns();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image
                src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                alt="Elmar Services Logo"
                width={120}
                height={37}
                className="h-9 w-auto brightness-0 invert dark:brightness-100 dark:invert-0"
              />
            </div>
            <nav className="flex space-x-6 items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <ArrowLeft className="mr-1" size={18} />
                Back to Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 ${
                toast.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-800 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-800 dark:text-red-400'
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
                className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Upload: {uploadData.upload.filename}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-primary"
            >
              {isFullscreen ? 'Verkleinen' : 'Vergroten'}
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors font-medium"
            >
              Terug naar Dashboard
            </button>
          </div>
        </div>

        <div className="card-modern p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Upload Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-900 dark:text-white">Bestandsnaam:</strong> <span className="text-gray-700 dark:text-gray-300">{uploadData.upload.filename}</span>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Status:</strong> <span className="text-gray-700 dark:text-gray-300">{uploadData.upload.status}</span>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Geüpload:</strong> <span className="text-gray-700 dark:text-gray-300">{new Date(uploadData.upload.uploadedAt).toLocaleString('nl-NL')}</span>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Aantal rijen:</strong> <span className="text-gray-700 dark:text-gray-300">{reviewedData.length}</span>
            </div>
          </div>
          {issuesCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-400">
              <strong>{issuesCount} rij(en) met problemen gedetecteerd</strong>
            </div>
          )}
        </div>

        <div className={`card-modern p-6 mb-6 ${isFullscreen ? 'fixed inset-4 z-40 bg-white dark:bg-gray-800 overflow-auto' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Review</h2>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-primary text-sm"
            >
              {isFullscreen ? 'Verkleinen' : 'Vergroten'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Klik op een rij om opmerkingen toe te voegen. Gebruik de checkbox om rijen af te wijzen.
          </p>

        {/* Mobile View - Card Layout with All Data */}
        <div className="block md:hidden space-y-4">
          {reviewedData.map((row, index) => (
            <div key={index} className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border ${row._rejected ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {String(row['Factuurnummer'] || row['factuurnummer'] || `Rij ${index + 1}`)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {String(row['Relatienaam'] || row['relatienaam'] || '')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    €{String(row['Factuurbedrag'] || row['factuurbedrag'] || '0')}
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Dagen open: </span>
                    {(() => {
                      const daysOpen = calculateDaysOpen(row);
                      return daysOpen !== null ? (
                        <span className={daysOpen < 0 ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
                          {daysOpen > 0 ? `+${daysOpen}` : daysOpen}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={row._rejected || false}
                      onChange={() => toggleRowRejection(index)}
                      className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs text-red-600 dark:text-red-400">Afwijzen</span>
                  </label>
                  <button
                    onClick={() => handleRowClick(index)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>

              {/* Show all columns in mobile view */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mt-3">
                {allColumns.slice(0, 6).map((column) => (
                  <div key={column} className="truncate">
                    <span className="font-medium">{column}:</span> {String(row[column] || '-')}
                  </div>
                ))}
                {allColumns.length > 6 && (
                  <div className="col-span-2 text-center text-blue-600 dark:text-blue-400 text-sm mt-2">
                    + {allColumns.length - 6} meer kolommen - klik voor details
                  </div>
                )}
              </div>

              {row._comments && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-400">
                  <strong>Opmerking:</strong> {row._comments}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View - Dynamic Table with All Columns */}
        <div className="hidden md:block overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-lg">
          <table className="w-full min-w-max table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-600 w-16 sticky left-0 bg-gray-100 dark:bg-gray-700 z-10">
                  #
                </th>
                {allColumns.map((column) => (
                  <th key={column} className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-600 min-w-32">
                    {column}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-600 w-24">
                  Dagen open
                </th>
                <th className="px-3 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-600 w-20">
                  Afwijzen
                </th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b w-32 sticky right-0 bg-gray-100 dark:bg-gray-700 z-10">
                  Opmerking
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {reviewedData.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${row._rejected ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                >
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600 text-center sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {index + 1}
                  </td>
                  {allColumns.map((column) => (
                    <td key={column} className="px-3 py-2 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                      <div className="truncate max-w-48" title={String(row[column] || '')}>
                        {String(row[column] || '-')}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 text-center">
                    {(() => {
                      const daysOpen = calculateDaysOpen(row);
                      return daysOpen !== null ? (
                        <span className={`font-medium ${daysOpen < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {daysOpen > 0 ? `+${daysOpen}` : daysOpen}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 text-center">
                    <input
                      type="checkbox"
                      checked={row._rejected || false}
                      onChange={() => toggleRowRejection(index)}
                      className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-3 py-2 sticky right-0 bg-white dark:bg-gray-800 z-10">
                    <button
                      onClick={() => handleRowClick(index)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      <MessageSquare size={14} />
                      <span>{row._comments ? 'Bewerken' : 'Toevoegen'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-modern p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Algemene Review Opmerkingen</h2>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Algemene opmerkingen over deze upload..."
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 resize-none"
        />

        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSubmitReview}
            disabled={submitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Opslaan...' : 'Review Voltooien'}
          </button>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors font-medium"
          >
            Annuleren
          </button>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModalOpen && selectedRowIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-modern bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Opmerking toevoegen</h3>
              <button
                onClick={handleCommentCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rij {selectedRowIndex + 1} - Alle gegevens:</p>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1">
                  {allColumns.map((column) => (
                    <div key={column} className="flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{column}:</span>
                      <span className="text-gray-900 dark:text-white ml-2 truncate">{String(reviewedData[selectedRowIndex]?.[column] || '-')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dagen open:</span>
                    {(() => {
                      const daysOpen = calculateDaysOpen(reviewedData[selectedRowIndex] || {});
                      return daysOpen !== null ? (
                        <span className={`font-semibold ml-2 ${daysOpen < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                          {daysOpen > 0 ? `+${daysOpen}` : daysOpen}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 ml-2">-</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reviewedData[selectedRowIndex]?._rejected || false}
                  onChange={() => {
                    if (selectedRowIndex !== null) {
                      toggleRowRejection(selectedRowIndex);
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deze rij afwijzen</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Snelle acties:
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      if (action.label === 'Namen') {
                        // Show colleague selection
                        const colleague = prompt('Selecteer een collega:', colleagues[0]);
                        if (colleague && colleagues.includes(colleague)) {
                          addQuickComment(action.value + colleague);
                        }
                      } else {
                        addQuickComment(action.value);
                      }
                    }}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opmerking (handmatig toevoegen/bewerken)
              </label>
              <textarea
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="Voeg een opmerking toe bij deze rij..."
                className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCommentSave}
                className="flex-1 btn-primary"
              >
                Opslaan
              </button>
              <button
                onClick={handleCommentCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors font-medium"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}