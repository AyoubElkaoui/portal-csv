'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare, AlertTriangle, CheckCircle, Home, Upload, ArrowLeft } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { SortableHeader, SortDirection } from '@/components/SortableHeader';
import { Pagination } from '@/components/Pagination';
import { ToastContainer, useToast } from '@/components/Toast';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdvancedFilters, FilterState } from '@/components/AdvancedFilters';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import { ExportButton } from '@/components/ExportButton';

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

export default function UploadDetailPage() {
  const params = useParams();
  const uploadId = params.uploadId as string;
  const { toasts, addToast, removeToast } = useToast();

  const [upload, setUpload] = useState<Upload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isReject, setIsReject] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    status: 'all',
    showFilters: false
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onApprove: () => selectedInvoiceId && handleAction(selectedInvoiceId, true),
    onReject: () => selectedInvoiceId && confirmReject(selectedInvoiceId),
    onToggleFilters: () => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters })),
    onEscape: () => setConfirmationConfig(null),
    onNext: () => {
      if (selectedInvoiceId && paginatedInvoices.length > 0) {
        const currentIndex = paginatedInvoices.findIndex(inv => inv.id === selectedInvoiceId);
        const nextIndex = (currentIndex + 1) % paginatedInvoices.length;
        setSelectedInvoiceId(paginatedInvoices[nextIndex].id);
      } else if (paginatedInvoices.length > 0) {
        setSelectedInvoiceId(paginatedInvoices[0].id);
      }
    },
    onPrevious: () => {
      if (selectedInvoiceId && paginatedInvoices.length > 0) {
        const currentIndex = paginatedInvoices.findIndex(inv => inv.id === selectedInvoiceId);
        const prevIndex = currentIndex === 0 ? paginatedInvoices.length - 1 : currentIndex - 1;
        setSelectedInvoiceId(paginatedInvoices[prevIndex].id);
      } else if (paginatedInvoices.length > 0) {
        setSelectedInvoiceId(paginatedInvoices[0].id);
      }
    },
  });

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Cycle through: asc -> desc -> null -> asc
        if (prevConfig.direction === 'asc') return { key, direction: 'desc' };
        if (prevConfig.direction === 'desc') return { key: '', direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortInvoices = (invoices: Invoice[]) => {
    if (!sortConfig.key || !sortConfig.direction) return invoices;

    return [...invoices].sort((a, b) => {
      let aValue: string | number | boolean | null = a[sortConfig.key as keyof Invoice];
      let bValue: string | number | boolean | null = b[sortConfig.key as keyof Invoice];

      // Special handling for dates
      if (sortConfig.key === 'factuurdatum') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Special handling for boolean status
      if (sortConfig.key === 'akkoord') {
        aValue = (aValue as boolean) ? 1 : 0;
        bValue = (bValue as boolean) ? 1 : 0;
      }

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredInvoices = upload ? sortInvoices(upload.invoices.filter(invoice => {
    // Search term filter
    const matchesSearch = invoice.factuurnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.relatienaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.opmerkingen && invoice.opmerkingen.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.akkoord ? 'goedgekeurd' : 'afgekeurd').includes(searchTerm.toLowerCase()) ||
      (invoice.afgewezen ? 'afgewezen' : 'niet afgewezen').includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

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
  })) : [];

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const fetchUpload = useCallback(async () => {
    try {
      const res = await fetch('/api/uploads');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const foundUpload = data.find((u: Upload) => u.id === uploadId);
      setUpload(foundUpload || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is een onverwachte fout opgetreden';
      addToast('error', 'Fout bij laden upload', errorMessage, fetchUpload);
    }
    setLoading(false);
  }, [uploadId, addToast]);

  useEffect(() => {
    const loadData = async () => {
      if (uploadId) {
        await fetchUpload();
      }
    };
    loadData();
  }, [uploadId, fetchUpload]);

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
      fetchUpload(); // Refresh
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

  const submitComment = () => {
    if (selectedInvoice && comment.trim()) {
      handleAction(selectedInvoice, isReject ? false : undefined, comment);
      setShowModal(false);
    }
  };

  const confirmReject = (invoiceId: string) => {
    setConfirmationConfig({
      title: 'Factuur afkeuren',
      message: 'Weet u zeker dat u deze factuur wilt afkeuren? Deze actie kan niet ongedaan worden gemaakt.',
      type: 'danger',
      onConfirm: () => {
        setSelectedInvoice(invoiceId);
        setComment('');
        setIsReject(true);
        setShowModal(true);
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(paginatedInvoices.map(invoice => invoice.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedInvoices.size === 0) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmationConfig({
        title: 'Bulk Goedkeuren',
        message: `Weet je zeker dat je ${selectedInvoices.size} facturen wilt goedkeuren?`,
        type: 'warning',
        onConfirm: () => resolve(true),
      });
      setShowConfirmation(true);
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/invoice/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selectedInvoices) }),
      });

      if (!response.ok) throw new Error('Bulk goedkeuren mislukt');

      addToast('success', 'Succes', `${selectedInvoices.size} facturen zijn goedgekeurd.`);

      setSelectedInvoices(new Set());
      // Direct data refresh voor real-time updates
      await fetchUpload();
    } catch (error) {
      console.error('Bulk approve error:', error);
      addToast('error', 'Fout', 'Er is een fout opgetreden bij het bulk goedkeuren.');
    }
  };

  const handleBulkReject = async () => {
    if (selectedInvoices.size === 0) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmationConfig({
        title: 'Bulk Afwijzen',
        message: `Weet je zeker dat je ${selectedInvoices.size} facturen wilt afwijzen?`,
        type: 'danger',
        onConfirm: () => resolve(true),
      });
      setShowConfirmation(true);
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/invoice/bulk-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selectedInvoices) }),
      });

      if (!response.ok) throw new Error('Bulk afwijzen mislukt');

      addToast('success', 'Succes', `${selectedInvoices.size} facturen zijn afgewezen.`);

      setSelectedInvoices(new Set());
      // Direct data refresh voor real-time updates
      await fetchUpload();
    } catch (error) {
      console.error('Bulk reject error:', error);
      addToast('error', 'Fout', 'Er is een fout opgetreden bij het bulk afwijzen.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
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
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <ArrowLeft className="mr-1" size={18} />
                  Terug naar Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <div className="animate-pulse bg-gray-200 h-8 w-64 rounded mb-2"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-48 rounded"></div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse bg-white">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Factuur#</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Relatie</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Datum</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Excl.</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">BTW</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Totaal</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Open</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Termijn</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Dagen</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Status</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Opmerkingen</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="border border-gray-300 px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
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
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <ArrowLeft className="mr-1" size={18} />
                  Terug naar Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Upload niet gevonden</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">De opgevraagde upload bestaat niet.</p>
            <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
              Terug naar Dashboard
            </Link>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
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
              <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/upload" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <Upload className="mr-1" size={18} />
                Upload CSV
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <ArrowLeft className="mr-1" size={18} />
                Terug naar Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <div className="max-w-full px-2 sm:px-4 lg:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{upload.filename}</h1>
          <p className="text-gray-600 dark:text-gray-400">Geüpload op {new Date(upload.uploadedAt).toLocaleDateString('nl-NL')} • {upload.invoices.length} facturen</p>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <SearchBar
              ref={searchInputRef}
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Zoek op factuurnummer, relatienaam, status, afgewezen of opmerkingen..."
              className="flex-1 max-w-md"
            />
            <AdvancedFilters
              onFiltersChange={setFilters}
              className="w-full sm:w-auto"
            />
          </div>
          <ExportButton
            data={filteredInvoices}
            filename={`${upload.filename}_facturen`}
            filters={filters}
            searchTerm={searchTerm}
          />
        </div>

        {selectedInvoices.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  {selectedInvoices.size} factuur{selectedInvoices.size !== 1 ? 'en' : ''} geselecteerd
                </span>
                <button
                  onClick={() => setSelectedInvoices(new Set())}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
                >
                  Selectie wissen
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkApprove}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                >
                  <CheckCircle className="mr-2" size={16} />
                  Bulk Goedkeuren
                </button>
                <button
                  onClick={handleBulkReject}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
                >
                  <AlertTriangle className="mr-2" size={16} />
                  Bulk Afwijzen
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {paginatedInvoices.map(invoice => (
                <div
                  key={invoice.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    selectedInvoiceId === invoice.id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{invoice.factuurnummer}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{invoice.relatienaam}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">€{invoice.factuurbedrag.toFixed(2)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(invoice.factuurdatum).toLocaleDateString('nl-NL')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Excl.:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">€{invoice.bedragExcl.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">BTW:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">€{invoice.btw.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Open:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">€{invoice.openstaandeBedrag.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Dagen:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{invoice.aantalDagenOpen}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <span className={invoice.akkoord ? 'text-green-600 dark:text-green-400 font-semibold flex items-center' : 'text-red-600 dark:text-red-400 font-semibold flex items-center'}>
                        {invoice.akkoord ? <CheckCircle className="mr-1" size={16} /> : <AlertTriangle className="mr-1" size={16} />}
                        {invoice.akkoord ? 'Goedgekeurd' : 'Afgekeurd'}
                      </span>
                      {invoice.afgewezen && (
                        <span className="text-red-600 dark:text-red-400 font-semibold">• Afgewezen</span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(invoice.id, false);
                        }}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                        title="Opmerking toevoegen"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmReject(invoice.id);
                        }}
                        className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition-colors"
                        title="Afkeuren met opmerking"
                      >
                        <AlertTriangle size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(invoice.id, true);
                        }}
                        className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
                        title="Goedkeuren"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </div>
                  </div>

                  {invoice.opmerkingen && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-gray-100">Opmerking:</strong> {invoice.opmerkingen}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse bg-white dark:bg-gray-800">
                <thead className="bg-blue-600 dark:bg-blue-700 text-white">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.size === paginatedInvoices.length && paginatedInvoices.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <SortableHeader label="Factuur#" sortKey="factuurnummer" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Relatie" sortKey="relatienaam" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Datum" sortKey="factuurdatum" currentSort={sortConfig} onSort={handleSort} />
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Excl.</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">BTW</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Totaal</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Open</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Termijn</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Dagen</th>
                    <SortableHeader label="Status" sortKey="akkoord" currentSort={sortConfig} onSort={handleSort} />
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Afgewezen</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Opmerkingen</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-left font-semibold text-white">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map(invoice => (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                        selectedInvoiceId === invoice.id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">{invoice.factuurnummer}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">{invoice.relatienaam}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">{new Date(invoice.factuurdatum).toLocaleDateString('nl-NL')}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">€{invoice.bedragExcl.toFixed(2)}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">€{invoice.btw.toFixed(2)}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">€{invoice.factuurbedrag.toFixed(2)}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">€{invoice.openstaandeBedrag.toFixed(2)}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">{invoice.betalingstermijn}d</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">{invoice.aantalDagenOpen}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4">
                        <span className={invoice.akkoord ? 'text-green-600 dark:text-green-400 font-semibold flex items-center' : 'text-red-600 dark:text-red-400 font-semibold flex items-center'}>
                          {invoice.akkoord ? <CheckCircle className="mr-1" size={16} /> : <AlertTriangle className="mr-1" size={16} />}
                          {invoice.akkoord ? 'Goedgekeurd' : 'Afgekeurd'}
                        </span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4">
                        <span className={invoice.afgewezen ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                          {invoice.afgewezen ? 'Ja' : 'Nee'}
                        </span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-900 dark:text-gray-100">{invoice.opmerkingen || '-'}</td>
                      <td className="border border-gray-300 px-6 py-4 space-x-2">
                        <button
                          onClick={() => openModal(invoice.id, false)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                          title="Opmerking toevoegen"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button
                          onClick={() => confirmReject(invoice.id)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors flex items-center justify-center"
                          title="Afkeuren met opmerking"
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button
                          onClick={() => handleAction(invoice.id, true)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors flex items-center justify-center"
                          title="Goedkeuren"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {filteredInvoices.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Geen facturen gevonden voor uw zoekopdracht.</p>
            </div>
          )}
          {filteredInvoices.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalItems={filteredInvoices.length}
            />
          )}
        </div>
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