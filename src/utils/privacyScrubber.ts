import { BaselineProfile, TreatmentLogEntry, RedactionResult } from '../types';

export function scrubText(
  text: string,
  patientName?: string
): { cleaned: string; count: number; log: Array<{ field: string; originalMatch: string; replacedWith: string }> } {
  if (!text || typeof text !== 'string') {
    return { cleaned: '', count: 0, log: [] };
  }

  let cleaned = text;
  let count = 0;
  const log: Array<{ field: string; originalMatch: string; replacedWith: string }> = [];

  const recordRedaction = (field: string, match: string, replacement: string) => {
    count++;
    log.push({ field, originalMatch: match, replacedWith: replacement });
  };

  // 1. Explicit patient name if provided
  if (patientName && patientName.trim().length > 1) {
    const escaped = patientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
    cleaned = cleaned.replace(nameRegex, (m) => {
      recordRedaction('Patient Name', m, '[REDACTED-NAME]');
      return '[REDACTED-NAME]';
    });
  }

  // Common Name Patterns with titles (Mr. John Smith, Patient: Sarah Connor)
  const titleNameRegex = /\b(?:Mr\.|Mrs\.|Ms\.|Miss|Master|Dr\.|Patient:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
  cleaned = cleaned.replace(titleNameRegex, (m, namePart) => {
    recordRedaction('Personal Name', namePart, '[REDACTED-NAME]');
    return `[REDACTED-TITLE-NAME]`;
  });

  // 2. NHS Number (UK: 10 digits formatted as 3-3-4 or 10 continuous digits)
  const nhsRegex = /\b(?:\d{3}[\s-]?\d{3}[\s-]?\d{4})\b/g;
  cleaned = cleaned.replace(nhsRegex, (m) => {
    // Exclude basic dates like 2024-05-12
    if (/^\d{4}-\d{2}-\d{2}$/.test(m)) return m;
    const digitsOnly = m.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      recordRedaction('NHS/National ID', m, '[REDACTED-NHS-ID]');
      return '[REDACTED-NHS-ID]';
    }
    return m;
  });

  // US SSN or Generic National ID
  const ssnRegex = /\b(?:\d{3}-\d{2}-\d{4})\b/g;
  cleaned = cleaned.replace(ssnRegex, (m) => {
    recordRedaction('National Identifier / SSN', m, '[REDACTED-ID]');
    return '[REDACTED-ID]';
  });

  // Explicit ID prefixes like "NHS: 123456" or "MRN: 98765432"
  const mrnRegex = /\b(?:NHS|MRN|Patient ID|Hospital ID|ID Number)\s*[:#]?\s*([A-Za-z0-9-]{4,14})\b/gi;
  cleaned = cleaned.replace(mrnRegex, (m, idPart) => {
    recordRedaction('Hospital/MRN Identifier', idPart, '[REDACTED-ID]');
    return `ID: [REDACTED-ID]`;
  });

  // 3. Date of Birth (DOB)
  const dobRegex = /\b(?:DOB|Date of Birth|born on|born:?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})\b/gi;
  cleaned = cleaned.replace(dobRegex, (m, datePart) => {
    recordRedaction('Date of Birth', datePart, '[REDACTED-DOB]');
    return `DOB: [REDACTED-DOB]`;
  });

  // 4. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  cleaned = cleaned.replace(emailRegex, (m) => {
    recordRedaction('Email Address', m, '[REDACTED-EMAIL]');
    return '[REDACTED-EMAIL]';
  });

  // 5. Phone numbers (UK mobile/landline 07xxx, 01xxx, 02xxx, or +44 / +1 international)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/g;
  cleaned = cleaned.replace(phoneRegex, (m) => {
    const digits = m.replace(/\D/g, '');
    // Only redact if string looks genuinely like a phone number (10 to 13 digits)
    if (digits.length >= 10 && digits.length <= 13) {
      recordRedaction('Phone Number', m, '[REDACTED-PHONE]');
      return '[REDACTED-PHONE]';
    }
    return m;
  });

  // 6. Street addresses & UK/US Postal codes
  // UK Postcodes: SW1A 1AA, EC1A 1BB, M1 1AE, B33 8TH
  const ukPostcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;
  cleaned = cleaned.replace(ukPostcodeRegex, (m) => {
    recordRedaction('Postal Code', m, '[REDACTED-POSTCODE]');
    return '[REDACTED-POSTCODE]';
  });

  // Street address pattern (e.g. 14 Elm Street, 22 Baker Rd)
  const streetRegex = /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Close|Way|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct)\b/gi;
  cleaned = cleaned.replace(streetRegex, (m) => {
    recordRedaction('Residential Address', m, '[REDACTED-ADDRESS]');
    return '[REDACTED-ADDRESS]';
  });

  return { cleaned, count, log };
}

export function redactPayloadForAI(
  baseline: BaselineProfile,
  recentLogs: TreatmentLogEntry[]
): RedactionResult<{
  baseline: {
    conditions: string[];
    medications: Array<{ name: string; dose: string; frequency: string; notes?: string }>;
    allergies: string[];
    surgeriesAndInvestigations: string[];
  };
  recentLogs: TreatmentLogEntry[];
}> {
  let totalCount = 0;
  const fullLog: Array<{ field: string; originalMatch: string; replacedWith: string }> = [];

  const patientName = baseline.patientPseudonym || '';

  // Redact conditions
  const cleanConditions = baseline.conditions.map((c) => {
    const res = scrubText(c, patientName);
    totalCount += res.count;
    fullLog.push(...res.log);
    return res.cleaned;
  });

  // Redact medications
  const cleanMeds = baseline.medications.map((m) => {
    const nameRes = scrubText(m.name, patientName);
    const doseRes = scrubText(m.dose, patientName);
    const freqRes = scrubText(m.frequency, patientName);
    const notesRes = scrubText(m.notes || '', patientName);

    totalCount += nameRes.count + doseRes.count + freqRes.count + notesRes.count;
    fullLog.push(...nameRes.log, ...doseRes.log, ...freqRes.log, ...notesRes.log);

    return {
      name: nameRes.cleaned,
      dose: doseRes.cleaned,
      frequency: freqRes.cleaned,
      notes: notesRes.cleaned,
    };
  });

  // Redact allergies
  const cleanAllergies = baseline.allergies.map((a) => {
    const res = scrubText(a, patientName);
    totalCount += res.count;
    fullLog.push(...res.log);
    return res.cleaned;
  });

  // Redact surgeries / investigations
  const cleanSurgeries = baseline.surgeriesAndInvestigations.map((s) => {
    const titleRes = scrubText(s.title, patientName);
    const dateRes = scrubText(s.dateOrYear || '', patientName);
    const outcomeRes = scrubText(s.outcome || '', patientName);

    totalCount += titleRes.count + dateRes.count + outcomeRes.count;
    fullLog.push(...titleRes.log, ...dateRes.log, ...outcomeRes.log);

    const parts = [titleRes.cleaned];
    if (dateRes.cleaned) parts.push(`(${dateRes.cleaned})`);
    if (outcomeRes.cleaned) parts.push(`- ${outcomeRes.cleaned}`);
    return parts.join(' ');
  });

  // Redact recent logs
  const cleanLogs: TreatmentLogEntry[] = recentLogs.map((entry) => {
    const symRes = scrubText(entry.symptomsDescription || '', patientName);
    const medChangeRes = scrubText(entry.medicationChanges || '', patientName);
    const notesRes = scrubText(entry.notes || '', patientName);

    totalCount += symRes.count + medChangeRes.count + notesRes.count;
    fullLog.push(...symRes.log, ...medChangeRes.log, ...notesRes.log);

    return {
      ...entry,
      symptomsDescription: symRes.cleaned,
      medicationChanges: medChangeRes.cleaned,
      notes: notesRes.cleaned,
    };
  });

  return {
    sanitizedData: {
      baseline: {
        conditions: cleanConditions,
        medications: cleanMeds,
        allergies: cleanAllergies,
        surgeriesAndInvestigations: cleanSurgeries,
      },
      recentLogs: cleanLogs,
    },
    redactedCount: totalCount,
    redactionLog: fullLog,
  };
}
