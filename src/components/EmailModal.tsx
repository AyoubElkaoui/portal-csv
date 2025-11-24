'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, X, Eye, EyeOff, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { EMAIL_TEMPLATES, EmailTemplate, renderEmailTemplate, getTemplatesByCategory } from '@/lib/emailTemplates';
import { ToastContainer, useToast } from '@/components/Toast';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData?: {
    id: string;
    factuurnummer: string;
    relatienaam: string;
    factuurbedrag: number;
    factuurdatum: string;
    akkoord: boolean;
    afgewezen: boolean;
    opmerkingen?: string;
  };
  recipientEmail?: string;
  onEmailSent?: () => void;
}

export function EmailModal({ isOpen, onClose, invoiceData, recipientEmail, onEmailSent }: EmailModalProps) {
  const { toasts, addToast, removeToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [recipient, setRecipient] = useState(recipientEmail || '');
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipient(recipientEmail || '');
      setSelectedTemplate(null);
      setCustomSubject('');
      setCustomBody('');
      setIsPreview(false);
      setUseCustomTemplate(false);
    }
  }, [isOpen, recipientEmail]);

  // Auto-select appropriate template based on invoice status
  useEffect(() => {
    if (invoiceData && !useCustomTemplate) {
      if (invoiceData.akkoord) {
        setSelectedTemplate(EMAIL_TEMPLATES.find(t => t.id === 'invoice-approved') || null);
      } else if (invoiceData.afgewezen) {
        setSelectedTemplate(EMAIL_TEMPLATES.find(t => t.id === 'invoice-rejected') || null);
      } else {
        setSelectedTemplate(EMAIL_TEMPLATES.find(t => t.id === 'status-update') || null);
      }
    }
  }, [invoiceData, useCustomTemplate]);

  const getRenderedContent = () => {
    if (useCustomTemplate) {
      return {
        subject: customSubject,
        body: customBody
      };
    }

    if (!selectedTemplate || !invoiceData) return { subject: '', body: '' };

    const variables = {
      factuurnummer: invoiceData.factuurnummer,
      relatienaam: invoiceData.relatienaam,
      factuurbedrag: invoiceData.factuurbedrag.toFixed(2),
      factuurdatum: new Date(invoiceData.factuurdatum).toLocaleDateString('nl-NL'),
      goedkeuringsdatum: new Date().toLocaleDateString('nl-NL'),
      afkeuringsreden: invoiceData.opmerkingen || 'Geen specifieke reden opgegeven',
      status: invoiceData.akkoord ? 'Goedgekeurd' : invoiceData.afgewezen ? 'Afgekeurd' : 'In behandeling',
      status_kleur: invoiceData.akkoord ? '#28a745' : invoiceData.afgewezen ? '#dc3545' : '#ffc107',
      status_beschrijving: invoiceData.akkoord
        ? 'Uw factuur is succesvol goedgekeurd en wordt verwerkt.'
        : invoiceData.afgewezen
        ? 'Uw factuur kon helaas niet worden goedgekeurd. Zie de reden hierboven.'
        : 'Uw factuur wordt momenteel beoordeeld.',
      update_datum: new Date().toLocaleDateString('nl-NL'),
      logo_url: '/LOGO-ELMAR-766x226-1-400x118-2204245369.png'
    };

    return {
      subject: renderEmailTemplate({ ...selectedTemplate, body: selectedTemplate.subject }, variables),
      body: renderEmailTemplate(selectedTemplate, variables)
    };
  };

  const handleSendEmail = async () => {
    if (!recipient.trim()) {
      addToast('error', 'Fout', 'Voer een ontvanger email adres in');
      return;
    }

    const content = getRenderedContent();
    if (!content.subject || !content.body) {
      addToast('error', 'Fout', 'Selecteer een template of vul custom content in');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: content.subject,
          html: content.body,
          invoiceId: invoiceData?.id,
          templateId: selectedTemplate?.id
        })
      });

      if (!response.ok) {
        throw new Error('Email verzending mislukt');
      }

      addToast('success', 'Email verzonden', `Email succesvol verzonden naar ${recipient}`);
      onEmailSent?.();
      onClose();
    } catch (error) {
      console.error('Email send error:', error);
      addToast('error', 'Fout', 'Email kon niet worden verzonden');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const approvalTemplates = getTemplatesByCategory('approval');
  const rejectionTemplates = getTemplatesByCategory('rejection');
  const reminderTemplates = getTemplatesByCategory('reminder');
  const notificationTemplates = getTemplatesByCategory('notification');

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Mail className="mr-3 text-blue-500" size={24} />
              Email Versturen
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Left Panel - Template Selection */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Template Type Toggle */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useCustomTemplate}
                      onChange={() => setUseCustomTemplate(false)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Templates gebruiken</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useCustomTemplate}
                      onChange={() => setUseCustomTemplate(true)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Aangepaste email</span>
                  </label>
                </div>

                {!useCustomTemplate ? (
                  <div className="space-y-4">
                    {/* Approval Templates */}
                    {approvalTemplates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center">
                          <CheckCircle className="mr-2" size={16} />
                          Goedkeuring
                        </h4>
                        <div className="space-y-2">
                          {approvalTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.subject}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejection Templates */}
                    {rejectionTemplates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
                          <XCircle className="mr-2" size={16} />
                          Afwijzing
                        </h4>
                        <div className="space-y-2">
                          {rejectionTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.subject}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reminder Templates */}
                    {reminderTemplates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
                          <Clock className="mr-2" size={16} />
                          Herinnering
                        </h4>
                        <div className="space-y-2">
                          {reminderTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.subject}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notification Templates */}
                    {notificationTemplates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                          <FileText className="mr-2" size={16} />
                          Notificatie
                        </h4>
                        <div className="space-y-2">
                          {notificationTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.subject}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Onderwerp</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Email onderwerp..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bericht</label>
                      <textarea
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        rows={12}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Email bericht..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Preview/Compose */}
            <div className="w-2/3 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium mb-2">Ontvanger</label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@voorbeeld.nl"
                  />
                </div>

                {/* Preview Toggle */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voorvertoning</h3>
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {isPreview ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                    {isPreview ? 'Bewerken' : 'Voorvertoning'}
                  </button>
                </div>

                {/* Content */}
                {isPreview ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Onderwerp</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                        {getRenderedContent().subject || 'Geen onderwerp'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bericht</label>
                      <div
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: getRenderedContent().body || 'Geen bericht' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Onderwerp</label>
                      <input
                        type="text"
                        value={getRenderedContent().subject}
                        readOnly={!useCustomTemplate}
                        onChange={(e) => useCustomTemplate && setCustomSubject(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bericht</label>
                      <textarea
                        value={useCustomTemplate ? customBody : getRenderedContent().body.replace(/<[^>]*>/g, '')}
                        readOnly={!useCustomTemplate}
                        onChange={(e) => useCustomTemplate && setCustomBody(e.target.value)}
                        rows={15}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending || !recipient.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Bezig met verzenden...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2" size={16} />
                        Email Versturen
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}