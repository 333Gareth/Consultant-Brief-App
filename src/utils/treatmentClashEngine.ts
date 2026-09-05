import { BaselineProfile, Medication } from '../types';

export type ClashSeverity = 'critical' | 'high' | 'moderate' | 'caution' | 'safe';
export type ClashCategory =
  | 'drug-drug'
  | 'drug-disease'
  | 'drug-allergy'
  | 'procedure-safety'
  | 'otc-supplement';

export interface ProcedureAnalytics {
  procedureName: string;
  withholdingWindow: string; // e.g., "Hold on morning of procedure (24h before)"
  renalImpact: 'low' | 'moderate' | 'high';
  hemodynamicImpact: 'low' | 'moderate' | 'high';
  riskLevel: 'routine' | 'moderate' | 'high-risk';
  preProcedureChecklist: string[];
  postProcedureGuidance: string;
}

export interface CommunicationScript {
  consultantRole: string; // e.g. "Cardiologist", "Surgeon / Anesthesiologist", "Rheumatologist / PCP"
  talkingPointSummary: string;
  verbatimScript: string; // Ready-to-say or copy phrase
  keyQuestionsToAsk: string[];
  documentationTip: string;
}

export interface DecisionAlternative {
  name: string;
  pros: string;
  cons: string;
  safetyTier: 'recommended' | 'acceptable' | 'avoid';
}

export interface DecisionAnalytics {
  scenarioTitle: string;
  recommendedDecision: string;
  clinicalRationale: string;
  alternatives: DecisionAlternative[];
  monitoringProtocol: string;
}

export interface TreatmentClashAlert {
  id: string;
  title: string;
  category: ClashCategory;
  severity: ClashSeverity;
  substancesInvolved: string[];
  summary: string;
  clinicalMechanism: string;
  procedureAnalytics?: ProcedureAnalytics;
  communication: CommunicationScript;
  decisionAnalytics: DecisionAnalytics;
  actionRequired: string;
  isProspective?: boolean;
}

export interface TreatmentSafetyEvaluation {
  alerts: TreatmentClashAlert[];
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  cautionCount: number;
  overallStatus: 'critical-action' | 'high-caution' | 'review-recommended' | 'clear';
  consultationChecklist: string[];
  procedureReadinessTips: string[];
}

/**
 * Standardized knowledge base of clinically recognized interactions, contraindications,
 * allergy cross-reactivities, and procedural withholding guidelines.
 */
export function evaluateProfileSafety(
  baseline: BaselineProfile,
  prospectiveTreatment?: string
): TreatmentSafetyEvaluation {
  const alerts: TreatmentClashAlert[] = [];

  const medsLower = (baseline.medications || []).map((m) => m.name.toLowerCase());
  const condsLower = (baseline.conditions || []).map((c) => c.toLowerCase());
  const allergiesLower = (baseline.allergies || []).map((a) => a.toLowerCase());
  const prospective = prospectiveTreatment?.trim().toLowerCase() || '';

  const hasCandesartan = medsLower.some((m) => m.includes('candesartan') || m.includes('arb'));
  const hasAmlodipine = medsLower.some((m) => m.includes('amlodipine') || m.includes('norvasc'));
  const hasParacetamol = medsLower.some((m) => m.includes('paracetamol') || m.includes('acetaminophen'));
  const hasHypertension = condsLower.some((c) => c.includes('hypertension') || c.includes('blood pressure'));
  const hasNSAIDAllergy = allergiesLower.some(
    (a) => a.includes('nsaid') || a.includes('ibuprofen') || a.includes('naproxen')
  );
  const hasPenicillinAllergy = allergiesLower.some((a) => a.includes('penicillin') || a.includes('amoxicillin'));

  // 1. BASELINE ALERT: Candesartan + Amlodipine Dual Antihypertensive Hemodynamic Monitoring
  if (hasCandesartan && hasAmlodipine) {
    alerts.push({
      id: 'alert-candesartan-amlodipine',
      title: 'Dual Vasodilatory Regimen (ARB + DHP-CCB)',
      category: 'drug-drug',
      severity: 'moderate',
      substancesInvolved: ['Candesartan (ARB)', 'Amlodipine (CCB)'],
      summary:
        'Synergistic blood pressure lowering with additive vasodilation. Heightened risk of first-dose postural hypotension, peripheral edema, and acute pressure dips during dehydration or acute illness.',
      clinicalMechanism:
        'Candesartan inhibits angiotensin II type 1 (AT1) receptors reducing peripheral resistance; Amlodipine inhibits L-type calcium channels causing arterial vasodilation. Dual therapy is guideline-recommended for stage 2 hypertension but requires strict postural blood pressure tracking.',
      procedureAnalytics: {
        procedureName: 'General Anesthesia / Major Surgical Interventions',
        withholdingWindow: 'Withhold Candesartan on morning of surgery; continue or consult on Amlodipine',
        renalImpact: 'moderate',
        hemodynamicImpact: 'high',
        riskLevel: 'high-risk',
        preProcedureChecklist: [
          'Verify baseline morning blood pressure prior to pre-medication',
          'Ensure anesthesiologist is alerted to current ARB therapy at pre-op assessment',
          'Have IV ephedrine or phenylephrine accessible due to blunted sympathetic compensatory tone under anesthesia',
        ],
        postProcedureGuidance:
          'Resume Candesartan only once euvolemia is restored, oral fluid intake is verified, and systolic BP > 110 mmHg.',
      },
      communication: {
        consultantRole: 'Cardiologist / Anesthetist / General Physician',
        talkingPointSummary:
          'Confirm whether morning Candesartan should be withheld before upcoming procedures and clarify target home BP thresholds.',
        verbatimScript:
          '"Dr. [Consultant], I take Candesartan 16mg and Amlodipine 5mg daily. Are my morning standing blood pressures in the safe range, and what is your protocol for withholding Candesartan before scheduled procedures to avoid anesthesia drops?"',
        keyQuestionsToAsk: [
          'Should I hold Candesartan on the morning of any sedation or surgical procedure?',
          'If I experience lightheadedness on standing, which dose should be adjusted first?',
          'What is the threshold for orthostatic drop (e.g. >20 mmHg systolic) where I should notify your team?',
        ],
        documentationTip:
          'Maintain a 7-day dual-reading log (seated vs standing at 2 minutes) to present at your next review.',
      },
      decisionAnalytics: {
        scenarioTitle: 'Optimizing Dual Antihypertensive Regimen vs Orthostatic Symptoms',
        recommendedDecision:
          'Maintain current dual doses while monitoring standing BP; ensure adequate hydration and avoid sudden posture changes.',
        clinicalRationale:
          'Dual combination provides comprehensive cardioprotective efficacy; premature reduction risks rebound uncontrolled hypertension.',
        alternatives: [
          {
            name: 'Split Timing (Candesartan AM, Amlodipine Bedtime)',
            pros: 'Reduces peak coincident hypotensive nadir and minimizes daytime peripheral ankle swelling.',
            cons: 'Requires adherence to twice-daily dosing routine.',
            safetyTier: 'recommended',
          },
          {
            name: 'Dose Down-Titration (Candesartan to 8mg)',
            pros: 'Eliminates dizziness if mean BP is < 115/70 mmHg.',
            cons: 'May lead to loss of optimal 24-hour ambulatory arterial pressure control.',
            safetyTier: 'acceptable',
          },
        ],
        monitoringProtocol:
          'Record seated and standing BP twice weekly; re-check serum creatinine and electrolytes every 6 months.',
      },
      actionRequired:
        'Confirm pre-procedure withholding schedule with surgical/anesthetic team prior to any planned intervention.',
    });
  }

  // 2. BASELINE ALERT: Documented NSAID Allergy / Intolerance vs Cervical Spine Osteoarthritis Pain
  if (hasNSAIDAllergy) {
    alerts.push({
      id: 'alert-nsaid-intolerance',
      title: 'NSAID / Ibuprofen Intolerance vs Osteoarthritis Treatment',
      category: 'drug-allergy',
      severity: 'high',
      substancesInvolved: ['Ibuprofen / Naproxen / NSAIDs', 'Gastric Mucosa'],
      summary:
        'Documented history of gastric intolerance to NSAIDs. Systemic NSAIDs are strictly contraindicated due to acute gastritis or ulceration risk, exacerbated by concurrent hypertension.',
      clinicalMechanism:
        'Non-selective COX-1 inhibition impairs gastric cytoprotective prostaglandin E2 synthesis and causes renal vasoconstriction, increasing blood pressure and counteracting Candesartan.',
      procedureAnalytics: {
        procedureName: 'Gastrointestinal Endoscopy / Orthopedic Injections',
        withholdingWindow: 'No systemic NSAIDs to withhold (strictly avoided)',
        renalImpact: 'high',
        hemodynamicImpact: 'moderate',
        riskLevel: 'moderate',
        preProcedureChecklist: [
          'Ensure patient allergy wristband explicitly lists NSAIDs / Ibuprofen intolerance',
          'Document past reaction severity (gastric pain vs anaphylaxis) in surgical pre-assessment record',
          'Confirm no accidental OTC combination cold/flu products containing ibuprofen or aspirin have been taken',
        ],
        postProcedureGuidance:
          'For post-procedure analgesia, request non-NSAID options (e.g. scheduled paracetamol, weak opioids if indicated).',
      },
      communication: {
        consultantRole: 'Orthopedic Specialist / Rheumatologist / PCP',
        talkingPointSummary:
          'Advocate for non-NSAID multimodal cervical spine analgesia, emphasizing past gastric intolerance and hypertension.',
        verbatimScript:
          '"Because I have a documented gastric intolerance to NSAIDs and also take blood pressure medication, oral ibuprofen and naproxen are off-limits for my neck arthritis. What topical, physical therapy, or targeted interventional alternatives do you recommend?"',
        keyQuestionsToAsk: [
          'Can we trial a targeted topical anti-inflammatory gel (like topical diclofenac) with lower systemic absorption, or is that also inadvisable?',
          'Would structured physiotherapy, cervical traction, or facet joint injections be safer long-term options?',
          'How can I optimize my paracetamol regimen safely without exceeding 4,000 mg daily?',
        ],
        documentationTip:
          'Ensure the clinic chart highlights "Gastric Intolerance to NSAIDs" so no oral anti-inflammatories are reflexively prescribed.',
      },
      decisionAnalytics: {
        scenarioTitle: 'Pain Management in Cervical Osteoarthritis with NSAID Contraindication',
        recommendedDecision:
          'Tier 1: Scheduled Paracetamol (up to 1,000mg TID) + Cervical Physical Therapy + Heat therapy. Avoid all systemic NSAIDs.',
        clinicalRationale:
          'Prevents gastric ulceration, avoids blunt of ARB antihypertensive efficacy, and preserves eGFR.',
        alternatives: [
          {
            name: 'Topical NSAID Gel (Diclofenac 1.16%) with Gastro-Protection',
            pros: 'Provides localized anti-inflammatory relief with < 6% systemic plasma absorption compared to oral tablets.',
            cons: 'Still carries minor systemic absorption caution in severe gastric ulcer history.',
            safetyTier: 'acceptable',
          },
          {
            name: 'Targeted Interventional Cervical Facet Injection / Radiofrequency Ablation',
            pros: 'Direct mechanical relief without systemic pharmacologic toxicity or drug clashes.',
            cons: 'Invasive procedure requiring specialist referral and localized recovery.',
            safetyTier: 'recommended',
          },
        ],
        monitoringProtocol:
          'Monitor cervical neck range of motion, functional sleep interference, and report any dark stools or epigastric discomfort.',
      },
      actionRequired:
        'Confirm all prescribed and over-the-counter analgesic recommendations are 100% free of oral NSAIDs.',
    });
  }

  // 3. BASELINE ALERT: Documented Penicillin Allergy
  if (hasPenicillinAllergy) {
    alerts.push({
      id: 'alert-penicillin-allergy',
      title: 'Penicillin Allergy Cross-Reactivity Precautions',
      category: 'drug-allergy',
      severity: 'high',
      substancesInvolved: ['Penicillin', 'Amoxicillin', 'Cephalosporins (1st gen)'],
      summary:
        'History of maculopapular rash to Penicillin (2014). Avoid all aminopenicillins (Amoxicillin, Co-amoxiclav) and exercise caution with 1st-generation cephalosporins.',
      clinicalMechanism:
        'Beta-lactam ring immune sensitization. While rash in 2014 was non-IgE mediated (maculopapular), re-challenge carries unpredictable escalation risk unless formally de-labeled.',
      procedureAnalytics: {
        procedureName: 'Surgical Antimicrobial Prophylaxis',
        withholdingWindow: 'Alert surgical team at least 48h prior for prophylactic antibiotic selection',
        renalImpact: 'low',
        hemodynamicImpact: 'low',
        riskLevel: 'moderate',
        preProcedureChecklist: [
          'Verify allergy badge is affixed to surgical chart and patient wristband',
          'Ensure surgical prophylaxis order specifies non-penicillin alternatives (e.g. Cefazolin only with allergy consultation, or Clindamycin / Vancomycin / Gentamicin depending on hospital protocol)',
        ],
        postProcedureGuidance:
          'Monitor skin for delayed exanthem 24-72h following any intravenous hospital antibiotics.',
      },
      communication: {
        consultantRole: 'Surgeon / Infectious Disease / Primary Care Physician',
        talkingPointSummary:
          'Clarify the nature of the 2014 penicillin rash to ensure safe surgical antibiotic prophylaxis or infection coverage.',
        verbatimScript:
          '"In 2014, I developed a maculopapular rash after taking penicillin. For any surgical prophylaxis or future infections, what is your preferred non-penicillin alternative, and should I undergo formal allergy testing?"',
        keyQuestionsToAsk: [
          'Is 1st-generation or 3rd-generation cephalosporin safe for me, or should we strictly use macrolides or clindamycin?',
          'Would formal allergy skin testing or oral challenge be worthwhile to see if I have outgrown the 2014 allergy?',
          'What is documented in my hospital admission notes regarding antibiotic allergies?',
        ],
        documentationTip:
          'Clarify in records that the 2014 reaction was cutaneous (rash) without angioedema or airway involvement.',
      },
      decisionAnalytics: {
        scenarioTitle: 'Antibiotic Selection for Acute Infections or Surgical Prophylaxis',
        recommendedDecision:
          'Prescribe non-beta-lactam antibiotics (e.g. Doxycycline, Macrolides [Azithromycin], or Quinolones) for routine infections.',
        clinicalRationale:
          'Eliminates allergic reaction recurrence while providing targeted antimicrobial efficacy.',
        alternatives: [
          {
            name: '3rd-Generation Cephalosporin (Ceftriaxone / Cefixime)',
            pros: 'Cross-reactivity with non-anaphylactic penicillin rash is < 1%.',
            cons: 'Still carries minor theoretical cross-sensitivity.',
            safetyTier: 'acceptable',
          },
          {
            name: 'Formal Allergy Testing / Penicillin De-Labeling',
            pros: 'Over 80-90% of patients lose penicillin sensitivity after 10 years, unlocking first-line antibiotics.',
            cons: 'Requires specialized allergy clinic referral and supervised challenge.',
            safetyTier: 'recommended',
          },
        ],
        monitoringProtocol:
          'Inspect skin daily during any antibiotic course; seek immediate care if urticaria, facial swelling, or dyspnea occurs.',
      },
      actionRequired:
        'Ensure non-penicillin antimicrobial orders are pre-cleared for any hospital or clinic procedures.',
    });
  }

  // 4. PROSPECTIVE / SIMULATED TREATMENT CLASH CHECKS
  // Check if prospective treatment was passed, or evaluate key clinical candidates:
  const prospectiveTriggers = [
    {
      keywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'diclofenac', 'meloxicam', 'nsaid', 'aspirin'],
      title: 'CRITICAL CLASH: NSAID Administration with Documented Allergy & Hypertension',
      severity: 'critical' as ClashSeverity,
      category: 'drug-allergy' as ClashCategory,
      substances: ['Prospective NSAID', 'Candesartan (ARB)', 'Hypertension', 'Gastric Intolerance'],
      summary:
        'Severe triple clash: 1) Direct trigger of documented gastric intolerance allergy; 2) Significant blunt of Candesartan antihypertensive effect; 3) Heightened acute kidney injury (AKI) risk.',
      mechanism:
        'NSAIDs inhibit vasodilatory renal prostaglandins. When combined with an ARB (Candesartan), the efferent and afferent arteriolar balance is disrupted, drastically dropping glomerulation filtration rate (eGFR).',
      withholdingWindow: 'Strictly avoid; if taken inadvertently, stop immediately',
      consultantScript:
        '"Doctor, an NSAID was mentioned for pain, but I have a documented gastric allergy to ibuprofen, plus I take Candesartan for high blood pressure. Can we discuss non-NSAID options like physical therapy or nerve pain modulators?"',
      decision: 'Avoid all oral NSAIDs. Use optimized Paracetamol or targeted local modalities.',
      action: 'Do not start oral NSAID. Request alternative pain management regimen.',
    },
    {
      keywords: ['pseudoephedrine', 'sudafed', 'decongestant', 'phenylephrine', 'cold medicine'],
      title: 'HIGH ALERT: Oral Decongestant Contraindicated with Essential Hypertension',
      severity: 'high' as ClashSeverity,
      category: 'drug-disease' as ClashCategory,
      substances: ['Pseudoephedrine / Phenylephrine', 'Essential Hypertension', 'Candesartan'],
      summary:
        'Systemic alpha-1 adrenergic agonism causes peripheral vasoconstriction, triggering acute hypertensive spikes that directly counteract Candesartan and Amlodipine.',
      mechanism:
        'Oral sympathomimetics stimulate vascular alpha-adrenergic receptors, elevating peripheral vascular resistance and cardiac output, risking hypertensive crisis.',
      withholdingWindow: 'Discontinue 48h prior to any cardiovascular or blood pressure evaluation',
      consultantScript:
        '"I am seeking relief for seasonal allergic rhinitis, but I know oral decongestants like pseudoephedrine raise blood pressure. What nasal corticosteroid or non-drowsy antihistamine is safe for my hypertension?"',
      decision:
        'Substitute with topical intranasal corticosteroid (e.g. Fluticasone) or saline irrigation and 2nd-gen oral antihistamine (Cetirizine / Loratadine).',
      action: 'Avoid oral pseudoephedrine; use steroid nasal spray for allergic rhinitis.',
    },
    {
      keywords: ['contrast', 'ct scan', 'iodinated', 'angiogram', 'radiology'],
      title: 'PROCEDURE PREPARATION: Iodinated Contrast Medium & Renal Safety Protocol',
      severity: 'high' as ClashSeverity,
      category: 'procedure-safety' as ClashCategory,
      substances: ['Iodinated IV Contrast', 'Candesartan (ARB)', 'Renal Function (eGFR)'],
      summary:
        'Intravenous iodinated contrast media can cause contrast-induced nephropathy (CIN). Patients taking ARBs (Candesartan) require pre-hydration and pre-procedure eGFR verification.',
      mechanism:
        'Contrast causes intense medullary vasoconstriction and tubular toxicity. ARB blockade impairs autoregulatory efferent tone, exacerbating transient renal ischemia.',
      withholdingWindow: 'Withhold Candesartan 24-48h prior if eGFR < 60 mL/min; ensure pre- and post-procedure hydration',
      consultantScript:
        '"I have a contrast-enhanced imaging study scheduled. My baseline eGFR was >85 mL/min on my last blood test, and I take Candesartan 16mg daily. What is your specific hydration and medication-withholding protocol for this scan?"',
      decision:
        'Obtain fresh creatinine/eGFR within 30 days; maintain oral hydration (1-1.5L water day prior); hold Candesartan on the morning of scan if requested by radiologist.',
      action: 'Confirm renal function lab panel is up to date before contrast administration.',
    },
    {
      keywords: ['potassium', 'salt substitute', 'kcl', 'spironolactone'],
      title: 'HIGH ALERT: Potassium Supplementation & ARB Hyperkalemia Risk',
      severity: 'high' as ClashSeverity,
      category: 'drug-drug' as ClashCategory,
      substances: ['Potassium Supplements / Salt Substitutes', 'Candesartan Cilexetil'],
      summary:
        'Candesartan reduces aldosterone secretion, decreasing potassium excretion. Adding potassium supplements or "Lo-Salt" potassium chloride substitutes can trigger severe cardiac hyperkalemia.',
      mechanism:
        'Inhibition of angiotensin II leads to reduced aldosterone in the adrenal cortex, impairing distal renal tubule K+ secretion. Unmonitored intake leads to serum potassium > 5.5 mmol/L.',
      withholdingWindow: 'Discontinue potassium supplements immediately unless specifically prescribed by nephrologist',
      consultantScript:
        '"Because Candesartan can raise potassium levels, should I be cautious with high-potassium foods, dietary supplements, or potassium-based salt substitutes?"',
      decision:
        'Avoid over-the-counter potassium supplements and potassium-based table salt substitutes. Regular dietary intake of fruits/vegetables is safe.',
      action: 'Check all dietary supplements for hidden potassium chloride content.',
    },
    {
      keywords: ['surgery', 'operation', 'anesthesia', 'sedation', 'biopsy'],
      title: 'PROCEDURE PROTOCOL: Perioperative Medication Withholding Schedule',
      severity: 'critical' as ClashSeverity,
      category: 'procedure-safety' as ClashCategory,
      substances: ['General Anesthesia', 'Candesartan', 'Amlodipine'],
      summary:
        'Major surgery under general anesthesia carries severe refractory hypotension risk if ARBs (Candesartan) are taken on the morning of surgery due to blunted sympathetic compensatory tone.',
      mechanism:
        'Volatile anesthetics induce systemic vasodilation and cardiac depression. When the renin-angiotensin-aldosterone system is pharmacologically blocked by Candesartan, standard intraoperative vasopressors may be less effective.',
      withholdingWindow: 'Hold Candesartan on the morning of surgery (24h before); continue Amlodipine with a sip of water unless instructed otherwise',
      consultantScript:
        '"Dr. [Anesthetist], I take Candesartan 16mg and Amlodipine 5mg. Exactly what time should I take my last dose before my surgery, and what is your plan for resuming blood pressure medications after recovery?"',
      decision:
        'Strict adherence to institutional enhanced recovery protocol: withhold ARB on morning of surgery; check pre-op BP; resume post-op when oral fluids tolerated.',
      action: 'Obtain written medication-withholding instructions from the surgical pre-admission clinic.',
    },
  ];

  // If prospective treatment matched any triggers
  if (prospective) {
    for (const trigger of prospectiveTriggers) {
      if (trigger.keywords.some((kw) => prospective.includes(kw))) {
        alerts.unshift({
          id: `prospective-${Date.now()}-${trigger.keywords[0]}`,
          title: trigger.title,
          category: trigger.category,
          severity: trigger.severity,
          substancesInvolved: trigger.substances,
          summary: trigger.summary,
          clinicalMechanism: trigger.mechanism,
          isProspective: true,
          procedureAnalytics: {
            procedureName: trigger.title,
            withholdingWindow: trigger.withholdingWindow,
            renalImpact: 'moderate',
            hemodynamicImpact: 'high',
            riskLevel: trigger.severity === 'critical' ? 'high-risk' : 'moderate',
            preProcedureChecklist: [
              'Inform prescribing physician of all baseline medications and allergy history',
              'Verify blood pressure and renal lab metrics before starting',
              'Set a clinical follow-up appointment within 14 days',
            ],
            postProcedureGuidance:
              'Monitor for dizziness, headache, swelling, or rash; report any acute changes immediately.',
          },
          communication: {
            consultantRole: 'Specialist Consultant / Prescribing Clinician',
            talkingPointSummary:
              'Present the prospective treatment conflict clearly and request safe alternative therapies.',
            verbatimScript: trigger.consultantScript,
            keyQuestionsToAsk: [
              'What non-clashing alternative drug class provides equivalent clinical efficacy?',
              'What specific blood tests or monitoring will be required if this is deemed essential?',
              'What symptoms should prompt me to stop this medication immediately?',
            ],
            documentationTip:
              'Request that the consultant document the rationale in the clinic letter back to your primary care physician.',
          },
          decisionAnalytics: {
            scenarioTitle: `Decision Analysis: Prospective Treatment with ${prospectiveTreatment}`,
            recommendedDecision: trigger.decision,
            clinicalRationale: trigger.summary,
            alternatives: [
              {
                name: 'Safer Non-Clashing Alternative',
                pros: 'Avoids drug-drug interaction, preserves organ function, avoids allergy triggers.',
                cons: 'May require specialist prescription or localized application.',
                safetyTier: 'recommended',
              },
              {
                name: 'Dose-Reduced Regimen with Intensive Surveillance',
                pros: 'Allows use if no clinical alternative exists.',
                cons: 'Requires weekly blood tests, blood pressure tracking, and gastroprotection.',
                safetyTier: 'avoid',
              },
            ],
            monitoringProtocol:
              'Track symptoms daily in your treatment log; record blood pressure mornings and evenings.',
          },
          actionRequired: trigger.action,
        });
      }
    }
  }

  // Count severities
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const moderateCount = alerts.filter((a) => a.severity === 'moderate').length;
  const cautionCount = alerts.filter((a) => a.severity === 'caution').length;

  let overallStatus: TreatmentSafetyEvaluation['overallStatus'] = 'clear';
  if (criticalCount > 0) overallStatus = 'critical-action';
  else if (highCount > 0) overallStatus = 'high-caution';
  else if (moderateCount > 0) overallStatus = 'review-recommended';

  // Standardized consultation preparation checklist
  const consultationChecklist = [
    'Bring complete, up-to-date medication list with exact doses and schedules (including OTCs & vitamins)',
    'Highlight documented allergies (Penicillin, NSAIDs) at the start of the consultation',
    'Review 7-day vitals trends (Blood pressure, heart rate, symptom severity)',
    'Have the 3 prioritized consultation questions written down or printed in your summary brief',
    'Confirm whether any upcoming procedures require withholding morning medications (e.g. Candesartan)',
    'Ask for written instructions or follow-up milestones for any new medication change',
  ];

  const procedureReadinessTips = [
    'Morning of Surgery: Hold Candesartan unless explicitly instructed by anesthesia to continue.',
    'Hydration: Ensure adequate oral hydration before imaging studies involving intravenous contrast.',
    'Allergy Check: Re-confirm that hospital surgical charts document NSAID and Penicillin allergies.',
    'Post-Op Pain: Plan for non-NSAID analgesia (scheduled paracetamol, localized therapies) in advance.',
  ];

  return {
    alerts,
    criticalCount,
    highCount,
    moderateCount,
    cautionCount,
    overallStatus,
    consultationChecklist,
    procedureReadinessTips,
  };
}
