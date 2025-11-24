export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'approval' | 'rejection' | 'reminder' | 'notification';
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'invoice-approved',
    name: 'Factuur Goedgekeurd',
    subject: 'Factuur {{factuurnummer}} is goedgekeurd',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <img src="{{logo_url}}" alt="Elmar Services" style="max-width: 150px; height: auto;">
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #28a745; margin-bottom: 20px;">Factuur Goedgekeurd ✅</h2>

          <p>Beste {{relatienaam}},</p>

          <p>Goed nieuws! Uw factuur is succesvol goedgekeurd en verwerkt.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Factuur Details:</h3>
            <p><strong>Factuurnummer:</strong> {{factuurnummer}}</p>
            <p><strong>Bedrag:</strong> €{{factuurbedrag}}</p>
            <p><strong>Factuurdatum:</strong> {{factuurdatum}}</p>
            <p><strong>Goedgekeurd op:</strong> {{goedkeuringsdatum}}</p>
          </div>

          <p>De betaling zal binnenkort worden verwerkt volgens onze standaard betalingsvoorwaarden.</p>

          <p>Voor vragen kunt u contact opnemen via email of telefoon.</p>

          <p>Met vriendelijke groet,<br>
          Elmar Services Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Deze email is automatisch gegenereerd. Beantwoord deze email niet.</p>
        </div>
      </div>
    `,
    variables: ['factuurnummer', 'relatienaam', 'factuurbedrag', 'factuurdatum', 'goedkeuringsdatum', 'logo_url'],
    category: 'approval'
  },
  {
    id: 'invoice-rejected',
    name: 'Factuur Afgekeurd',
    subject: 'Factuur {{factuurnummer}} kon niet worden goedgekeurd',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <img src="{{logo_url}}" alt="Elmar Services" style="max-width: 150px; height: auto;">
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Factuur Status Update ❌</h2>

          <p>Beste {{relatienaam}},</p>

          <p>Na zorgvuldige controle kon uw factuur helaas niet worden goedgekeurd.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Factuur Details:</h3>
            <p><strong>Factuurnummer:</strong> {{factuurnummer}}</p>
            <p><strong>Bedrag:</strong> €{{factuurbedrag}}</p>
            <p><strong>Factuurdatum:</strong> {{factuurdatum}}</p>
            <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">Afgekeurd</span></p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #856404;">Reden voor afkeuring:</h4>
            <p>{{afkeuringsreden}}</p>
          </div>

          <p>Wij verzoeken u vriendelijk om de factuur aan te passen en opnieuw in te dienen.</p>

          <p>Voor vragen of hulp kunt u contact opnemen met ons team.</p>

          <p>Met vriendelijke groet,<br>
          Elmar Services Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Deze email is automatisch gegenereerd. Beantwoord deze email niet.</p>
        </div>
      </div>
    `,
    variables: ['factuurnummer', 'relatienaam', 'factuurbedrag', 'factuurdatum', 'afkeuringsreden', 'logo_url'],
    category: 'rejection'
  },
  {
    id: 'payment-reminder',
    name: 'Betalingsherinnering',
    subject: 'Herinnering: Betaling factuur {{factuurnummer}}',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <img src="{{logo_url}}" alt="Elmar Services" style="max-width: 150px; height: auto;">
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #ffc107; margin-bottom: 20px;">Betalingsherinnering ⏰</h2>

          <p>Beste {{relatienaam}},</p>

          <p>Dit is een vriendelijke herinnering dat de betaling voor onderstaande factuur binnenkort verwacht wordt.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Factuur Details:</h3>
            <p><strong>Factuurnummer:</strong> {{factuurnummer}}</p>
            <p><strong>Bedrag:</strong> €{{factuurbedrag}}</p>
            <p><strong>Factuurdatum:</strong> {{factuurdatum}}</p>
            <p><strong>Vervaldatum:</strong> {{vervaldatum}}</p>
            <p><strong>Openstaand bedrag:</strong> €{{openstaand_bedrag}}</p>
          </div>

          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💳 Betalingsinformatie:</strong></p>
            <p style="margin: 5px 0;">Bank: [Uw banknaam]</p>
            <p style="margin: 5px 0;">IBAN: [Uw IBAN]</p>
            <p style="margin: 5px 0;">BIC: [Uw BIC]</p>
            <p style="margin: 5px 0;">Onder vermelding van: {{factuurnummer}}</p>
          </div>

          <p>Bij vragen over deze factuur kunt u altijd contact met ons opnemen.</p>

          <p>Met vriendelijke groet,<br>
          Elmar Services Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Deze email is automatisch gegenereerd. Beantwoord deze email niet.</p>
        </div>
      </div>
    `,
    variables: ['factuurnummer', 'relatienaam', 'factuurbedrag', 'factuurdatum', 'vervaldatum', 'openstaand_bedrag', 'logo_url'],
    category: 'reminder'
  },
  {
    id: 'status-update',
    name: 'Status Update',
    subject: 'Update: Factuur {{factuurnummer}} - {{status}}',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <img src="{{logo_url}}" alt="Elmar Services" style="max-width: 150px; height: auto;">
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #17a2b8; margin-bottom: 20px;">Factuur Status Update 📋</h2>

          <p>Beste {{relatienaam}},</p>

          <p>Er is een update voor uw factuur:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Factuur Details:</h3>
            <p><strong>Factuurnummer:</strong> {{factuurnummer}}</p>
            <p><strong>Bedrag:</strong> €{{factuurbedrag}}</p>
            <p><strong>Factuurdatum:</strong> {{factuurdatum}}</p>
            <p><strong>Huidige status:</strong> <span style="font-weight: bold; color: {{status_kleur}};">{{status}}</span></p>
            <p><strong>Laatste update:</strong> {{update_datum}}</p>
          </div>

          <p>{{status_beschrijving}}</p>

          <p>Voor meer informatie kunt u de factuur details bekijken in ons portaal.</p>

          <p>Met vriendelijke groet,<br>
          Elmar Services Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Deze email is automatisch gegenereerd. Beantwoord deze email niet.</p>
        </div>
      </div>
    `,
    variables: ['factuurnummer', 'relatienaam', 'factuurbedrag', 'factuurdatum', 'status', 'status_kleur', 'status_beschrijving', 'update_datum', 'logo_url'],
    category: 'notification'
  }
];

export const getEmailTemplate = (templateId: string): EmailTemplate | undefined => {
  return EMAIL_TEMPLATES.find(template => template.id === templateId);
};

export const getTemplatesByCategory = (category: EmailTemplate['category']): EmailTemplate[] => {
  return EMAIL_TEMPLATES.filter(template => template.category === category);
};

export const renderEmailTemplate = (template: EmailTemplate, variables: Record<string, string>): string => {
  let renderedBody = template.body;
  let renderedSubject = template.subject;

  // Replace variables in body
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    renderedBody = renderedBody.replace(regex, value);
    renderedSubject = renderedSubject.replace(regex, value);
  });

  return renderedBody;
};

export const getTemplateVariables = (template: EmailTemplate): string[] => {
  return template.variables;
};