'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, AlertCircle, MessageSquare, X, Check, AlertTriangle } from 'lucide-react';

interface RowData extends Record<string, unknown> {
  _status?: 'approved' | 'issue';
  _comments?: string;
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

  const fetchUploadData = useCallback(async () => {
    try {
      const response = await fetch(`/api/review/${uploadId}`);
      if (response.ok) {
        const data = await response.json();
        setUploadData(data);
        // Initialize reviewed data with approved status for all rows
        const initializedData = data.data.map((row: RowData) => ({
          ...row,
          _status: 'approved' as const,
          _comments: ''
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

  const updateRowStatus = (index: number, status: 'approved' | 'issue') => {
    const newData = [...reviewedData];
    newData[index] = { ...newData[index], _status: status };
    setReviewedData(newData);
  };

  const updateRowComments = (index: number, comments: string) => {
    const newData = [...reviewedData];
    newData[index] = { ...newData[index], _comments: comments };
    setReviewedData(newData);
  };

  const handleRowClick = (index: number) => {
    setSelectedRowIndex(index);
    setTempComment(reviewedData[index]._comments || '');
    setCommentModalOpen(true);
  };

  const handleCommentSave = () => {
    if (selectedRowIndex !== null) {
      updateRowComments(selectedRowIndex, tempComment);
      if (tempComment.trim() && reviewedData[selectedRowIndex]._status === 'approved') {
        updateRowStatus(selectedRowIndex, 'issue');
      }
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
    return <div className="p-8">Laden...</div>;
  }

  if (!uploadData) {
    return <div className="p-8">Upload niet gevonden</div>;
  }

  const issuesCount = reviewedData.filter(row => row._status === 'issue').length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Upload: {uploadData.upload.filename}</h1>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Terug naar Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Bestandsnaam:</strong> {uploadData.upload.filename}
          </div>
          <div>
            <strong>Status:</strong> {uploadData.upload.status}
          </div>
          <div>
            <strong>Geüpload:</strong> {new Date(uploadData.upload.uploadedAt).toLocaleString('nl-NL')}
          </div>
          <div>
            <strong>Aantal rijen:</strong> {reviewedData.length}
          </div>
        </div>
        {issuesCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
            <strong>{issuesCount} rij(en) met problemen gedetecteerd</strong>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Data Review</h2>
        <p className="text-sm text-gray-600 mb-4">
          Klik op een rij om opmerkingen toe te voegen. Standaard zijn alle rijen goedgekeurd. Alleen rijen met problemen krijgen een opmerking.
        </p>
        <div className="overflow-x-auto border border-gray-300 rounded-lg max-w-full">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {reviewedData.length > 0 && Object.keys(reviewedData[0])
                  .filter(key => !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key))
                  .map((header) => (
                  <th key={header} className="px-1 py-1 text-left text-xs font-semibold text-gray-700 border-b border-r border-gray-300 last:border-r-0 min-w-0" style={{width: `${Math.max(6, 85 / (Object.keys(reviewedData[0]).filter(key => !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key)).length + 1))}%`}}>
                    <div className="truncate text-xs leading-tight" title={header}>{header}</div>
                  </th>
                ))}
                <th className="px-1 py-1 text-left text-xs font-semibold text-gray-700 border-b border-r border-gray-300 w-12">
                  Status
                </th>
                <th className="px-1 py-1 text-left text-xs font-semibold text-gray-700 border-b border-gray-300 w-10">
                  Opmerking
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {reviewedData.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${row._status === 'issue' ? 'bg-red-50' : 'bg-white'}`}
                  onClick={() => handleRowClick(index)}
                >
                  {Object.entries(row)
                    .filter(([key]) => !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key))
                    .map(([, value], cellIndex) => (
                    <td key={cellIndex} className="px-1 py-1 text-xs text-gray-900 border-r border-gray-200 last:border-r-0 min-w-0">
                      <div className="truncate text-xs leading-tight" title={String(value)}>{String(value)}</div>
                    </td>
                  ))}
                  <td className="px-1 py-1 border-r border-gray-200 last:border-r-0">
                    <div className="flex items-center justify-center">
                      {row._status === 'approved' ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-1 text-center">
                    {row._comments ? (
                      <MessageSquare className="w-3 h-3 text-blue-600 mx-auto" />
                    ) : (
                      <div className="w-3 h-3 mx-auto"></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Algemene Review Opmerkingen</h2>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Algemene opmerkingen over deze upload..."
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSubmitReview}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Opslaan...' : 'Review Voltooien'}
          </button>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            Annuleren
          </button>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModalOpen && selectedRowIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Opmerking toevoegen</h3>
              <button
                onClick={handleCommentCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Rij {selectedRowIndex + 1}:</p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                {reviewedData[selectedRowIndex] && Object.entries(reviewedData[selectedRowIndex])
                  .filter(([key]) => !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key))
                  .slice(0, 3)
                  .map(([, value]) => String(value))
                  .join(' | ')}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={reviewedData[selectedRowIndex]?._status || 'approved'}
                onChange={(e) => updateRowStatus(selectedRowIndex, e.target.value as 'approved' | 'issue')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="approved">Goedgekeurd</option>
                <option value="issue">Probleem</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opmerking
              </label>
              <textarea
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="Voeg een opmerking toe bij deze rij..."
                className="w-full h-24 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCommentSave}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Opslaan
              </button>
              <button
                onClick={handleCommentCancel}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}