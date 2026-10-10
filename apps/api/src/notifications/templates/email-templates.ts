import { FORBIDDEN_DEMOGRAPHIC_KEYS } from '@campusedge/shared';

export interface BaseEmailLayoutOptions {
  title: string;
  preheader: string;
  recipientName?: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  collegeName?: string;
  actionButton?: {
    label: string;
    url: string;
  };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function assertNoDemographicsInEmailContent(data: Record<string, unknown>): void {
  for (const key of Object.keys(data)) {
    if (FORBIDDEN_DEMOGRAPHIC_KEYS.includes(key.toLowerCase())) {
      throw new Error(
        `Email Security Guard: Sensitive identity field '${key}' is strictly forbidden in transactional email payloads.`,
      );
    }
  }
}

/**
 * Responsive, inline-styled transactional email shell adhering to email client best practices.
 */
export function renderEmailLayout(options: BaseEmailLayoutOptions): string {
  const { title, preheader, recipientName, bodyHtml, unsubscribeUrl, collegeName, actionButton } =
    options;

  const institution = collegeName ? escapeHtml(collegeName) : 'CampusEdge Institution';
  const greeting = recipientName ? `Hello ${escapeHtml(recipientName)},` : 'Hello,';

  const actionButtonHtml = actionButton
    ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(actionButton.url)}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; line-height: 44px; text-align: center; text-decoration: none; padding: 0 28px; border-radius: 6px; -webkit-text-size-adjust: none;">
              ${escapeHtml(actionButton.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-bottom: 3px solid #2563eb;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">CampusEdge</span>
                    <span style="font-size: 12px; color: #94a3b8; margin-left: 8px;">| ${institution}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; color: #334155; font-size: 15px; line-height: 24px;">
              <p style="margin: 0 0 16px 0; font-weight: 600; color: #0f172a;">${greeting}</p>
              ${bodyHtml}
              ${actionButtonHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; line-height: 18px;">
              <p style="margin: 0 0 8px 0;">This official placement notification was sent to you via <strong>${institution}</strong> on CampusEdge.</p>
              <p style="margin: 0 0 12px 0; color: #94a3b8;">
                CampusEdge adheres to strict privacy and data protection standards.
              </p>
              <p style="margin: 0;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color: #64748b; text-decoration: underline;">Manage notification preferences</a> &nbsp;•&nbsp; 
                <a href="${escapeHtml(unsubscribeUrl)}" style="color: #64748b; text-decoration: underline;">Unsubscribe from this category</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template Builders
// ---------------------------------------------------------------------------

export function renderDrivePublishedEmail(data: {
  recipientName?: string;
  companyName: string;
  driveTitle: string;
  rolesSummary: string;
  registrationDeadline: string;
  driveUrl: string;
  unsubscribeUrl: string;
  collegeName?: string;
}): { html: string; text: string; subject: string } {
  assertNoDemographicsInEmailContent(data as unknown as Record<string, unknown>);

  const subject = `New Recruitment Drive: ${data.companyName} (${data.driveTitle})`;
  const preheader = `Applications open for ${data.companyName}. Registration closes on ${data.registrationDeadline}.`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">A new on-campus placement drive has been published for eligible students:</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">${escapeHtml(data.companyName)}</p>
      <p style="margin: 0 0 6px 0; color: #475569;"><strong>Drive:</strong> ${escapeHtml(data.driveTitle)}</p>
      <p style="margin: 0 0 6px 0; color: #475569;"><strong>Roles Offered:</strong> ${escapeHtml(data.rolesSummary)}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Registration Deadline:</strong> ${escapeHtml(data.registrationDeadline)}</p>
    </div>
    <p style="margin: 0 0 16px 0;">Please check your eligibility criteria and register prior to the deadline.</p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    recipientName: data.recipientName,
    bodyHtml,
    unsubscribeUrl: data.unsubscribeUrl,
    collegeName: data.collegeName,
    actionButton: {
      label: 'View Drive & Apply',
      url: data.driveUrl,
    },
  });

  const text =
    `New Recruitment Drive: ${data.companyName} - ${data.driveTitle}\n\n` +
    `Roles: ${data.rolesSummary}\n` +
    `Registration Deadline: ${data.registrationDeadline}\n\n` +
    `Apply here: ${data.driveUrl}\n\n` +
    `Unsubscribe: ${data.unsubscribeUrl}`;

  return { html, text, subject };
}

export function renderRegistrationDeadlineEmail(data: {
  recipientName?: string;
  companyName: string;
  driveTitle: string;
  hoursRemaining: number;
  deadlineFormatted: string;
  driveUrl: string;
  unsubscribeUrl: string;
  collegeName?: string;
}): { html: string; text: string; subject: string } {
  assertNoDemographicsInEmailContent(data as unknown as Record<string, unknown>);

  const subject = `Urgent Reminder: ${data.hoursRemaining} hours left to register for ${data.companyName}`;
  const preheader = `Registration for ${data.companyName} closes on ${data.deadlineFormatted}.`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">This is an urgent reminder that registration is closing soon for <strong>${escapeHtml(data.companyName)}</strong>.</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #991b1b;">Registration Closes Soon</p>
      <p style="margin: 0 0 6px 0; color: #7f1d1d;"><strong>Company:</strong> ${escapeHtml(data.companyName)} (${escapeHtml(data.driveTitle)})</p>
      <p style="margin: 0; color: #b91c1c;"><strong>Deadline:</strong> ${escapeHtml(data.deadlineFormatted)} (${data.hoursRemaining} hours remaining)</p>
    </div>
    <p style="margin: 0 0 16px 0;">Late applications cannot be entertained after the server timestamp closes.</p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    recipientName: data.recipientName,
    bodyHtml,
    unsubscribeUrl: data.unsubscribeUrl,
    collegeName: data.collegeName,
    actionButton: {
      label: 'Complete Registration Now',
      url: data.driveUrl,
    },
  });

  const text =
    `Urgent Reminder: Registration for ${data.companyName} closes in ${data.hoursRemaining} hours (${data.deadlineFormatted}).\n\n` +
    `Register here: ${data.driveUrl}\n\n` +
    `Unsubscribe: ${data.unsubscribeUrl}`;

  return { html, text, subject };
}

export function renderEventReminderEmail(data: {
  recipientName?: string;
  companyName: string;
  eventTitle: string;
  kind: string;
  scheduledTime: string;
  mode: string;
  locationOrUrl: string;
  detailsUrl: string;
  unsubscribeUrl: string;
  collegeName?: string;
}): { html: string; text: string; subject: string } {
  assertNoDemographicsInEmailContent(data as unknown as Record<string, unknown>);

  const subject = `Event Reminder: ${data.eventTitle} (${data.companyName})`;
  const preheader = `${data.eventTitle} is scheduled for ${data.scheduledTime}.`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Your upcoming placement schedule update:</p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #166534;">${escapeHtml(data.eventTitle)}</p>
      <p style="margin: 0 0 6px 0; color: #15803d;"><strong>Company:</strong> ${escapeHtml(data.companyName)}</p>
      <p style="margin: 0 0 6px 0; color: #15803d;"><strong>Schedule:</strong> ${escapeHtml(data.scheduledTime)}</p>
      <p style="margin: 0 0 6px 0; color: #15803d;"><strong>Mode:</strong> ${escapeHtml(data.mode)}</p>
      <p style="margin: 0; color: #15803d;"><strong>Location / Link:</strong> ${escapeHtml(data.locationOrUrl)}</p>
    </div>
    <p style="margin: 0 0 16px 0;">Please ensure you are prepared and present on time with formal attire and necessary credentials.</p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    recipientName: data.recipientName,
    bodyHtml,
    unsubscribeUrl: data.unsubscribeUrl,
    collegeName: data.collegeName,
    actionButton: {
      label: 'View Calendar & Details',
      url: data.detailsUrl,
    },
  });

  const text =
    `Event Reminder: ${data.eventTitle} (${data.companyName})\n` +
    `Time: ${data.scheduledTime}\n` +
    `Mode: ${data.mode}\n` +
    `Location / Link: ${data.locationOrUrl}\n\n` +
    `Details: ${data.detailsUrl}\n\n` +
    `Unsubscribe: ${data.unsubscribeUrl}`;

  return { html, text, subject };
}

export function renderApplicationStatusEmail(data: {
  recipientName?: string;
  companyName: string;
  statusText: string;
  notes?: string;
  actionUrl: string;
  unsubscribeUrl: string;
  collegeName?: string;
}): { html: string; text: string; subject: string } {
  assertNoDemographicsInEmailContent(data as unknown as Record<string, unknown>);

  const subject = `Application Update: ${data.companyName} (${data.statusText})`;
  const preheader = `Your application status for ${data.companyName} has updated to ${data.statusText}.`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Your application status for <strong>${escapeHtml(data.companyName)}</strong> has been updated:</p>
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; margin: 16px 0; border-radius: 6px;">
      <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Status: ${escapeHtml(data.statusText)}</p>
      ${data.notes ? `<p style="margin: 0; color: #475569;">${escapeHtml(data.notes)}</p>` : ''}
    </div>
    <p style="margin: 0 0 16px 0;">Please log into your student dashboard for next steps and instructions.</p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    recipientName: data.recipientName,
    bodyHtml,
    unsubscribeUrl: data.unsubscribeUrl,
    collegeName: data.collegeName,
    actionButton: {
      label: 'View Application Status',
      url: data.actionUrl,
    },
  });

  const text =
    `Application Update: ${data.companyName} - Status: ${data.statusText}\n\n` +
    `${data.notes ? data.notes + '\n\n' : ''}` +
    `View status: ${data.actionUrl}\n\n` +
    `Unsubscribe: ${data.unsubscribeUrl}`;

  return { html, text, subject };
}

export function renderAccountSecurityEmail(data: {
  recipientName?: string;
  actionTitle: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  securityUrl: string;
  unsubscribeUrl: string;
  collegeName?: string;
}): { html: string; text: string; subject: string } {
  assertNoDemographicsInEmailContent(data as unknown as Record<string, unknown>);

  const subject = `Security Alert: ${data.actionTitle}`;
  const preheader = `A security event occurred on your CampusEdge account at ${data.timestamp}.`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">A security action occurred on your account:</p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #92400e;">${escapeHtml(data.actionTitle)}</p>
      <p style="margin: 0 0 4px 0; color: #78350f;"><strong>Time:</strong> ${escapeHtml(data.timestamp)}</p>
      ${data.ipAddress ? `<p style="margin: 0 0 4px 0; color: #78350f;"><strong>IP Address:</strong> ${escapeHtml(data.ipAddress)}</p>` : ''}
      ${data.userAgent ? `<p style="margin: 0; color: #78350f;"><strong>Device:</strong> ${escapeHtml(data.userAgent)}</p>` : ''}
    </div>
    <p style="margin: 0 0 16px 0;">If you did not initiate this action, please change your password immediately and notify your placement office.</p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    recipientName: data.recipientName,
    bodyHtml,
    unsubscribeUrl: data.unsubscribeUrl,
    collegeName: data.collegeName,
    actionButton: {
      label: 'Review Account Security',
      url: data.securityUrl,
    },
  });

  const text =
    `Security Alert: ${data.actionTitle}\n` +
    `Time: ${data.timestamp}\n` +
    `IP: ${data.ipAddress || 'N/A'}\n` +
    `Device: ${data.userAgent || 'N/A'}\n\n` +
    `If this wasn't you, review security: ${data.securityUrl}\n\n` +
    `Unsubscribe: ${data.unsubscribeUrl}`;

  return { html, text, subject };
}
