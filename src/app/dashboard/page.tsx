'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, AlertTriangle, CheckCircle, Home, Upload } from 'lucide-react';
import { SkeletonCard } from '@/components/Skeleton';
import { SearchBar } from '@/components/SearchBar';
import { ToastContainer, useToast } from '@/components/Toast';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdvancedFilters, FilterState } from '@/components/AdvancedFilters';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import { DataVisualization } from '@/components/DataVisualization';

type Invoice = {
  id: string;
  factuurnummer: string;
  relatienaam: string;
  factuurdatum: string;
  bedragExcl: number;
  btw: number;
  factuurbedrag: number;
  openstaandeBedrag: number;
  betalingstermijn: number;
  aantalDagenOpen: number;
  akkoord: boolean;
  afgewezen: boolean;
  opmerkingen: string | null;
};

type Upload = {
  id: string;
  filename: string;
  uploadedAt: string;
  invoices: Invoice[];
};

export default function Dashboard() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isReject, setIsReject] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info' | 'success';
  } | null>(null);
  const [completedUploads, setCompletedUploads] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    status: 'all',
    showFilters: false
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedUploads, setSelectedUploads] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'uploads' | 'analytics'>('uploads');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredUploads = uploads.filter(upload => {
    // First apply search term filter
    const matchesSearch = upload.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.invoices.some(invoice =>
        invoice.factuurnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.relatienaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.opmerkingen && invoice.opmerkingen.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.akkoord ? 'goedgekeurd' : 'afgekeurd').includes(searchTerm.toLowerCase()) ||
        (invoice.afgewezen ? 'afgewezen' : 'niet afgewezen').includes(searchTerm.toLowerCase())
      );

    if (!matchesSearch) return false;

    // Apply advanced filters to invoices within the upload
    const filteredInvoices = upload.invoices.filter(invoice => {
      // Date range filter
      if (filters.dateFrom) {
        const invoiceDate = new Date(invoice.factuurdatum);
        const fromDate = new Date(filters.dateFrom);
        if (invoiceDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const invoiceDate = new Date(invoice.factuurdatum);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (invoiceDate > toDate) return false;
      }

      // Amount range filter
      if (filters.amountMin && invoice.factuurbedrag < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && invoice.factuurbedrag > parseFloat(filters.amountMax)) return false;

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'approved' && !invoice.akkoord) return false;
        if (filters.status === 'rejected' && invoice.akkoord) return false;
        if (filters.status === 'denied' && !invoice.afgewezen) return false;
      }

      return true;
    });

    // Only include uploads that have at least one matching invoice
    return filteredInvoices.length > 0;
  });

  const fetchUploads = async () => {
    try {
      setError(null);
      const res = await fetch('/api/uploads');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setUploads(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is een onverwachte fout opgetreden';
      setError(errorMessage);
      addToast('error', 'Fout bij laden uploads', errorMessage, fetchUploads);
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/uploads');
        const data = await res.json();
        setUploads(data);
      } catch {
        // Handle error
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAction = async (invoiceId: string, akkoord?: boolean, opmerkingen?: string) => {
    try {
      const body: { akkoord?: boolean; opmerkingen?: string } = {};
      if (akkoord !== undefined) body.akkoord = akkoord;
      if (opmerkingen) body.opmerkingen = opmerkingen;
      const res = await fetch(`/api/invoice/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();

      // Verstuur email notificatie
      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId,
            action: akkoord ? 'goedgekeurd' : 'afgekeurd',
            opmerkingen
          }),
        });
      } catch (emailErr) {
        // Email error is not critical, just log it
        console.warn('Email notification failed:', emailErr);
      }

      addToast('success', 'Factuur bijgewerkt', `Factuur ${akkoord ? 'goedgekeurd' : 'afgekeurd'} succesvol.`);
      fetchUploads(); // Refresh
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het bijwerken van de factuur';
      addToast('error', 'Fout bij bijwerken factuur', errorMessage);
    }
  };

  const openModal = (invoiceId: string, reject: boolean = false) => {
    setSelectedInvoice(invoiceId);
    setComment('');
    setIsReject(reject);
    setShowModal(true);
  };

  const confirmReject = (invoiceId: string) => {
    setConfirmationConfig({
      title: 'Factuur afkeuren',
      message: 'Weet u zeker dat u deze factuur wilt afkeuren? Dit is een definitieve actie die niet ongedaan kan worden gemaakt.',
      onConfirm: () => {
        handleAction(invoiceId, false);
        setShowConfirmation(false);
      },
      type: 'danger'
    });
    setShowConfirmation(true);
  };

  const submitComment = () => {
    if (selectedInvoice && comment.trim()) {
      handleAction(selectedInvoice, isReject ? false : undefined, comment);
      setShowModal(false);
    }
  };

  const handleSelectAllUploads = (checked: boolean) => {
    if (checked) {
      setSelectedUploads(new Set(filteredUploads.map(upload => upload.id)));
    } else {
      setSelectedUploads(new Set());
    }
  };

  const handleSelectUpload = (uploadId: string, checked: boolean) => {
    const newSelected = new Set(selectedUploads);
    if (checked) {
      newSelected.add(uploadId);
    } else {
      newSelected.delete(uploadId);
    }
    setSelectedUploads(newSelected);
  };

  const handleBulkApproveUploads = async () => {
    if (selectedUploads.size === 0) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmationConfig({
        title: 'Bulk Goedkeuren',
        message: `Weet je zeker dat je alle facturen in ${selectedUploads.size} upload${selectedUploads.size !== 1 ? 's' : ''} wilt goedkeuren?`,
        onConfirm: () => resolve(true),
        type: 'warning'
      });
      setShowConfirmation(true);
    });

    if (!confirmed) return;

    try {
      // Get all invoice IDs from selected uploads
      const allInvoiceIds: string[] = [];
      selectedUploads.forEach(uploadId => {
        const upload = uploads.find(u => u.id === uploadId);
        if (upload) {
          upload.invoices.forEach(invoice => allInvoiceIds.push(invoice.id));
        }
      });

      const response = await fetch(`/api/invoice/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: allInvoiceIds }),
      });

      if (!response.ok) throw new Error('Bulk goedkeuren mislukt');

      addToast('success', 'Succes', `Alle facturen in ${selectedUploads.size} upload${selectedUploads.size !== 1 ? 's' : ''} zijn goedgekeurd.`);

      setSelectedUploads(new Set());
      fetchUploads();
    } catch (error) {
      console.error('Bulk approve uploads error:', error);
      addToast('error', 'Fout', 'Er is een fout opgetreden bij het bulk goedkeuren.');
    }
  };

  const handleBulkRejectUploads = async () => {
    if (selectedUploads.size === 0) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmationConfig({
        title: 'Bulk Afwijzen',
        message: `Weet je zeker dat je alle facturen in ${selectedUploads.size} upload${selectedUploads.size !== 1 ? 's' : ''} wilt afwijzen?`,
        onConfirm: () => resolve(true),
        type: 'danger'
      });
      setShowConfirmation(true);
    });

    if (!confirmed) return;

    try {
      // Get all invoice IDs from selected uploads
      const allInvoiceIds: string[] = [];
      selectedUploads.forEach(uploadId => {
        const upload = uploads.find(u => u.id === uploadId);
        if (upload) {
          upload.invoices.forEach(invoice => allInvoiceIds.push(invoice.id));
        }
      });

      const response = await fetch(`/api/invoice/bulk-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: allInvoiceIds }),
      });

      if (!response.ok) throw new Error('Bulk afwijzen mislukt');

      addToast('success', 'Succes', `Alle facturen in ${selectedUploads.size} upload${selectedUploads.size !== 1 ? 's' : ''} zijn afgewezen.`);

      setSelectedUploads(new Set());
      fetchUploads();
    } catch (error) {
      console.error('Bulk reject uploads error:', error);
      addToast('error', 'Fout', 'Er is een fout opgetreden bij het bulk afwijzen.');
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    onApprove: () => {
      if (selectedInvoiceId) {
        handleAction(selectedInvoiceId, true);
      }
    },
    onReject: () => {
      if (selectedInvoiceId) {
        confirmReject(selectedInvoiceId);
      }
    },
    onEscape: () => {
      if (showModal) {
        setShowModal(false);
      } else if (showConfirmation) {
        setShowConfirmation(false);
      }
    },
    onToggleFilters: () => {
      setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }));
    },
    onNext: () => {
      // Navigate to next upload
      const currentUploadIndex = filteredUploads.findIndex(upload =>
        upload.invoices.some(invoice => invoice.id === selectedInvoiceId)
      );
      if (currentUploadIndex !== -1) {
        const nextIndex = (currentUploadIndex + 1) % filteredUploads.length;
        router.push(`/dashboard/${filteredUploads[nextIndex].id}`);
      }
    },
    onPrevious: () => {
      // Navigate to previous upload
      const currentUploadIndex = filteredUploads.findIndex(upload =>
        upload.invoices.some(invoice => invoice.id === selectedInvoiceId)
      );
      if (currentUploadIndex !== -1) {
        const prevIndex = currentUploadIndex === 0 ? filteredUploads.length - 1 : currentUploadIndex - 1;
        router.push(`/dashboard/${filteredUploads[prevIndex].id}`);
      }
    }
  });

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
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <nav className="flex space-x-6 items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/upload" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Upload className="mr-1" size={18} />
                Upload CSV
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <div className="max-w-full px-2 sm:px-4 lg:px-6 py-6">
        <h1 className="text-3xl font-bold mb-8 text-blue-600">Dashboard - Facturen Nakijken</h1>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('uploads')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'uploads'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Factuur Uploads
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Data Analyse
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'uploads' ? (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <SearchBar
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Zoek op bestandsnaam, factuurnummer, relatienaam, status, afgewezen of opmerkingen..."
                  className="flex-1 max-w-md"
                />
                <AdvancedFilters
                  onFiltersChange={setFilters}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>

        {selectedUploads.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  {selectedUploads.size} upload{selectedUploads.size !== 1 ? 's' : ''} geselecteerd
                </span>
                <button
                  onClick={() => setSelectedUploads(new Set())}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
                >
                  Selectie wissen
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkApproveUploads}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                >
                  <CheckCircle className="mr-2" size={16} />
                  Bulk Goedkeuren
                </button>
                <button
                  onClick={handleBulkRejectUploads}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
                >
                  <AlertTriangle className="mr-2" size={16} />
                  Bulk Afwijzen
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredUploads.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-12">
            {searchTerm ? 'Geen resultaten gevonden voor uw zoekopdracht.' : 'Geen uploads gevonden.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredUploads.map(upload => (
              <div
                key={upload.id}
                className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer relative ${
                  selectedUploads.has(upload.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => router.push(`/dashboard/${upload.id}`)}
              >
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedUploads.has(upload.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectUpload(upload.id, e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate" title={upload.filename}>
                    {upload.filename}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(upload.uploadedAt).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    completedUploads.has(upload.id)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {completedUploads.has(upload.id) ? 'Voltooid' : 'Te controleren'}
                  </span>
                </div>
                {!completedUploads.has(upload.id) && (
                  <div className="mb-4">
                    {/* Mobile Card View */}
                    <div className="block sm:hidden space-y-3">
                      {upload.invoices.slice(0, 5).map(invoice => (
                        <div
                          key={invoice.id}
                          className={`p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                            selectedInvoiceId === invoice.id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{invoice.factuurnummer}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{invoice.relatienaam}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">€{invoice.factuurbedrag.toFixed(2)}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(invoice.factuurdatum).toLocaleDateString('nl-NL')}</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <span className={invoice.akkoord ? 'text-green-600 dark:text-green-400 font-semibold text-xs flex items-center' : 'text-red-600 dark:text-red-400 font-semibold text-xs flex items-center'}>
                                {invoice.akkoord ? <CheckCircle className="mr-1" size={12} /> : <AlertTriangle className="mr-1" size={12} />}
                                {invoice.akkoord ? 'Goedgekeurd' : 'Afgekeurd'}
                              </span>
                              {invoice.afgewezen && (
                                <span className="text-red-600 dark:text-red-400 font-semibold text-xs">• Afgewezen</span>
                              )}
                            </div>

                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(invoice.id, false);
                                }}
                                className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600 transition-colors"
                                title="Opmerking toevoegen"
                              >
                                <MessageSquare size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmReject(invoice.id);
                                }}
                                className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
                                title="Afkeuren"
                              >
                                <AlertTriangle size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(invoice.id, true);
                                }}
                                className="bg-green-500 text-white p-1.5 rounded hover:bg-green-600 transition-colors"
                                title="Goedkeuren"
                              >
                                <CheckCircle size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                      <table className="min-w-full table-auto border-collapse bg-white dark:bg-gray-800 text-sm">
                        <thead className="bg-blue-50 dark:bg-blue-900 sticky top-0">
                          <tr>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Factuur#</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Relatie</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Afgewezen</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Acties</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upload.invoices.slice(0, 10).map(invoice => (
                            <tr
                              key={invoice.id}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                                selectedInvoiceId === invoice.id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500' : ''
                              }`}
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                            >
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-gray-100">{invoice.factuurnummer}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-gray-100">{invoice.relatienaam}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                                <span className={invoice.akkoord ? 'text-green-600 dark:text-green-400 font-semibold flex items-center' : 'text-red-600 dark:text-red-400 font-semibold flex items-center'}>
                                  {invoice.akkoord ? <CheckCircle className="mr-1" size={14} /> : <AlertTriangle className="mr-1" size={14} />}
                                  {invoice.akkoord ? 'Goedgekeurd' : 'Afgekeurd'}
                                </span>
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                                <span className={invoice.afgewezen ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                                  {invoice.afgewezen ? 'Ja' : 'Nee'}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-4 py-3 space-x-1">
                                <button
                                  onClick={() => openModal(invoice.id, false)}
                                  className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                                  title="Opmerking toevoegen"
                                >
                                  <MessageSquare size={14} />
                                </button>
                                <button
                                  onClick={() => confirmReject(invoice.id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                                  title="Afkeuren"
                                >
                                  <AlertTriangle size={14} />
                                </button>
                                <button
                                  onClick={() => handleAction(invoice.id, true)}
                                  className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors flex items-center justify-center"
                                  title="Goedkeuren"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setCompletedUploads(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(upload.id)) {
                          newSet.delete(upload.id);
                        } else {
                          newSet.add(upload.id);
                        }
                        return newSet;
                      });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      completedUploads.has(upload.id)
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {completedUploads.has(upload.id) ? 'Markeer als te doen' : 'Markeer als gedaan'}
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{upload.invoices.length} facturen</span>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        ) : (
          <DataVisualization uploads={uploads} />
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center">
              {isReject ? <AlertTriangle className="mr-3 text-red-500" size={24} /> : <MessageSquare className="mr-3 text-blue-500" size={24} />}
              {isReject ? 'Afkeuren met opmerking' : 'Opmerking toevoegen'}
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Voer uw opmerking in..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
              rows={5}
            />
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={submitComment}
                className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                  isReject
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isReject ? 'Afkeuren' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmationConfig && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={confirmationConfig.onConfirm}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
          type={confirmationConfig.type}
          confirmText="Afkeuren"
          cancelText="Annuleren"
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <KeyboardShortcutsHelp />
    </div>
  );
}