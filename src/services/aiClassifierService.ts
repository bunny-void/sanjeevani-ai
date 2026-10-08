import { PrototypeState, LanguageOption, PatientProfile, AIStatusAssessment } from '../types';
import { AI_PROMPT_TEMPLATES } from './aiPrompts';

export interface DynamicSymptomOption {
  id: string;
  label: string;
  emoji: string;
  spokenEquivalent: string;
  category: 'SAFE' | 'CONCERN' | 'CRITICAL' | 'REFILL';
}

export interface AIConversationTurnResult {
  state: PrototypeState | 'REFILL_REQUEST';
  aiResponse: string;
  summary: string;
  followUp?: string;
  reason: string;
  confidence: string;
  toneSignal?: string;
  detectedKeyword?: string;
  shouldEndCall?: boolean;
  nextStep?: 'INITIAL_CHECKIN' | 'FOLLOWUP_QUESTIONS' | 'MEDICATION_CHECK' | 'COMPLETE';
}

export class AIService {
  /**
   * Generates a personalized morning greeting using the patient's stored health profile.
   */
  public static getMorningGreeting(patient: PatientProfile): string {
    return AI_PROMPT_TEMPLATES.morningGreeting(patient);
  }

  /**
   * Dynamically generates 5 to 7 large selectable symptom/feeling options based on:
   * - current conversation step
   * - patient's age
   * - patient's stored health conditions (Hypertension, Diabetes, Asthma, Heart condition, Arthritis, etc.)
   * - patient's allergies
   * - current medication refill needs
   */
  public static generateDynamicSymptomOptions(
    patient: PatientProfile,
    currentStep: 'INITIAL_CHECKIN' | 'FOLLOWUP_QUESTIONS' | 'MEDICATION_CHECK' | 'COMPLETE',
    lastDetectedState?: PrototypeState | 'REFILL_REQUEST' | null
  ): { heading: string; options: DynamicSymptomOption[] } {
    const conditions = (
      patient.healthProfile?.currentHealthIssues ||
      patient.medicalConditions ||
      []
    ).map((c) => c.toLowerCase());
    const allergies = (patient.healthProfile?.allergies || []).map((a) => a.toLowerCase());
    const age = patient.age || 68;

    const hasHypertension = conditions.some(
      (c) => c.includes('hypertension') || c.includes('blood pressure') || c.includes('bp')
    );
    const hasDiabetes = conditions.some((c) => c.includes('diabetes') || c.includes('sugar'));
    const hasAsthma = conditions.some(
      (c) => c.includes('asthma') || c.includes('breathing') || c.includes('copd')
    );
    const hasHeart = conditions.some((c) => c.includes('heart') || c.includes('cardiac'));
    const hasArthritis = conditions.some(
      (c) => c.includes('arthritis') || c.includes('joint') || c.includes('knee')
    );
    const hasAllergies = allergies.length > 0;

    // Step 3: Medication check options
    if (currentStep === 'MEDICATION_CHECK') {
      const morningMed =
        patient.currentMedicines?.find((m) => m.timing === 'Morning') ||
        patient.currentMedicines?.[0];
      const medLabel = morningMed ? morningMed.name : 'my morning medicine';

      return {
        heading: 'MEDICATION CHECK',
        options: [
          {
            id: 'med-taken',
            label: `Took ${medLabel}`,
            emoji: '✅',
            spokenEquivalent: `Yes, I took my ${medLabel} this morning.`,
            category: 'SAFE'
          },
          {
            id: 'med-feeling-normal',
            label: 'Feeling normal & steady',
            emoji: '😊',
            spokenEquivalent: 'Everything is good, I took my medicine and feel normal.',
            category: 'SAFE'
          },
          {
            id: 'med-not-yet',
            label: 'Will take after breakfast',
            emoji: '⏰',
            spokenEquivalent: 'I feel fine and will take my medicine right after breakfast.',
            category: 'SAFE'
          },
          {
            id: 'med-ran-out',
            label: 'Ran out of medicine',
            emoji: '💊',
            spokenEquivalent: 'I ran out of my medicine and need a refill.',
            category: 'REFILL'
          },
          {
            id: 'med-dizzy',
            label: 'Feeling a bit dizzy',
            emoji: '🌀',
            spokenEquivalent: 'Actually I am feeling a bit dizzy right now.',
            category: 'CONCERN'
          }
        ]
      };
    }

    // Step 2: Follow-up question options
    if (currentStep === 'FOLLOWUP_QUESTIONS') {
      if (lastDetectedState === 'NOT_OK') {
        const followUpConcernOptions: DynamicSymptomOption[] = [
          {
            id: 'fu-mild',
            label: 'Mild discomfort, resting now',
            emoji: '🛋️',
            spokenEquivalent: 'It is mild discomfort. I am resting comfortably right now.',
            category: 'CONCERN'
          },
          {
            id: 'fu-weak-dizzy',
            label: 'Still feeling weak or dizzy',
            emoji: '🌀',
            spokenEquivalent: 'I am still feeling weak and dizzy this morning.',
            category: 'CONCERN'
          },
          {
            id: 'fu-better',
            label: 'Feeling fine now',
            emoji: '😊',
            spokenEquivalent: 'Actually I feel fine and steady now, no problem.',
            category: 'SAFE'
          }
        ];

        if (hasHypertension || hasDiabetes) {
          followUpConcernOptions.push({
            id: 'fu-headache-thirst',
            label: hasDiabetes ? 'Unusually tired & thirsty' : 'Mild morning headache',
            emoji: '😓',
            spokenEquivalent: hasDiabetes
              ? 'I feel unusually tired and thirsty this morning.'
              : 'I have a mild headache this morning.',
            category: 'CONCERN'
          });
        }

        followUpConcernOptions.push({
          id: 'fu-urgent',
          label: 'Severe chest pain / Need help',
          emoji: '🚨',
          spokenEquivalent: 'It feels severe. I have chest pain and need help.',
          category: 'CRITICAL'
        });

        return {
          heading: 'HOW DOES IT FEEL RIGHT NOW?',
          options: followUpConcernOptions.slice(0, 6)
        };
      }

      // Follow-up when initial response was GOOD/SAFE
      const followUpGoodOptions: DynamicSymptomOption[] = [
        {
          id: 'fu-no-symptoms',
          label: 'No unusual symptoms',
          emoji: '😊',
          spokenEquivalent: 'No, I have no unusual symptoms this morning. Feeling fine.',
          category: 'SAFE'
        },
        {
          id: 'fu-feeling-normal',
          label: 'Feeling normal',
          emoji: '👍',
          spokenEquivalent: 'Everything feels completely normal today.',
          category: 'SAFE'
        }
      ];

      if (hasHypertension) {
        followUpGoodOptions.push({
          id: 'fu-bp-dizzy',
          label: 'Slightly dizzy standing up',
          emoji: '🌀',
          spokenEquivalent: 'I felt slightly dizzy when standing up this morning.',
          category: 'CONCERN'
        });
      }
      if (hasDiabetes) {
        followUpGoodOptions.push({
          id: 'fu-dm-weak',
          label: 'Feeling a bit weak',
          emoji: '🔋',
          spokenEquivalent: 'I am feeling a little weak this morning.',
          category: 'CONCERN'
        });
      }
      if (hasArthritis) {
        followUpGoodOptions.push({
          id: 'fu-joint-stiff',
          label: 'Mild joint stiffness',
          emoji: '🦵',
          spokenEquivalent: 'My knees feel a little stiff and sore today.',
          category: 'CONCERN'
        });
      }
      if (hasAllergies) {
        followUpGoodOptions.push({
          id: 'fu-allergy',
          label: 'Mild allergy congestion',
          emoji: '🌿',
          spokenEquivalent: 'Just a bit of mild allergy discomfort today.',
          category: 'CONCERN'
        });
      }

      return {
        heading: 'ANY UNUSUAL SYMPTOMS THIS MORNING?',
        options: followUpGoodOptions.slice(0, 6)
      };
    }

    // Step 1: INITIAL_CHECKIN — Dynamic options tailored to patient's stored health profile
    const initialOptions: DynamicSymptomOption[] = [
      {
        id: 'opt-feeling-fine',
        label: 'Feeling fine',
        emoji: '😊',
        spokenEquivalent: 'I feel fine today. I slept well.',
        category: 'SAFE'
      },
      {
        id: 'opt-feeling-normal',
        label: 'Feeling normal',
        emoji: '👍',
        spokenEquivalent: 'I am feeling normal and comfortable this morning.',
        category: 'SAFE'
      }
    ];

    if (hasHypertension || hasHeart) {
      initialOptions.push(
        {
          id: 'opt-dizzy',
          label: 'Dizzy',
          emoji: '🌀',
          spokenEquivalent: 'I am feeling dizzy this morning.',
          category: 'CONCERN'
        },
        {
          id: 'opt-headache',
          label: 'Headache',
          emoji: '🤕',
          spokenEquivalent: 'I woke up with a headache this morning.',
          category: 'CONCERN'
        }
      );
    }

    if (hasDiabetes) {
      if (!initialOptions.some((o) => o.id === 'opt-dizzy')) {
        initialOptions.push({
          id: 'opt-dizzy',
          label: 'Dizzy',
          emoji: '🌀',
          spokenEquivalent: 'I am feeling dizzy this morning.',
          category: 'CONCERN'
        });
      }
      initialOptions.push(
        {
          id: 'opt-feeling-weak',
          label: 'Feeling weak',
          emoji: '🔋',
          spokenEquivalent: 'I have been feeling unusually weak this morning.',
          category: 'CONCERN'
        },
        {
          id: 'opt-thirsty',
          label: 'Unusually thirsty',
          emoji: '💧',
          spokenEquivalent: 'I am feeling unusually thirsty and tired this morning.',
          category: 'CONCERN'
        }
      );
    }

    if (hasAsthma) {
      initialOptions.push({
        id: 'opt-winded',
        label: 'Mildly winded',
        emoji: '🌬️',
        spokenEquivalent: 'I feel a little winded and tired this morning.',
        category: 'CONCERN'
      });
    }

    if (hasArthritis && initialOptions.length < 6) {
      initialOptions.push({
        id: 'opt-joint-pain',
        label: 'Joint stiffness',
        emoji: '🦵',
        spokenEquivalent: 'I have some joint pain and stiffness this morning.',
        category: 'CONCERN'
      });
    }

    // Add tired option if not already full or for older adults
    if (age >= 60 || initialOptions.length < 5) {
      initialOptions.push({
        id: 'opt-very-tired',
        label: 'Very tired',
        emoji: '😴',
        spokenEquivalent: 'I feel very tired and low energy this morning.',
        category: 'CONCERN'
      });
    }

    if (!initialOptions.some((o) => o.id === 'opt-feeling-weak') && initialOptions.length < 6) {
      initialOptions.push({
        id: 'opt-feeling-weak',
        label: 'Feeling weak',
        emoji: '🔋',
        spokenEquivalent: 'I am feeling weak this morning.',
        category: 'CONCERN'
      });
    }

    // Deduplicate and cap at 6 choices, plus 7th "Something else / Need help"
    const uniqueOptions = initialOptions.slice(0, 6);

    return {
      heading: 'HOW ARE YOU FEELING?',
      options: uniqueOptions
    };
  }

  /**
   * Generates medication reminder call opening prompt.
   */
  public static getMedicationCallPrompt(medName: string, dosage: string): string {
    return AI_PROMPT_TEMPLATES.medicationReminderCall(medName, dosage);
  }

  /**
   * Generates appointment reminder call opening prompt.
   */
  public static getAppointmentCallPrompt(doctorName: string, time: string, address: string): string {
    return AI_PROMPT_TEMPLATES.appointmentReminderCall(doctorName, time, address);
  }

  /**
   * Evaluates spoken user input during the Medication Reminder Stage 3 AI voice call.
   */
  public static analyzeMedicationCallResponse(
    spokenText: string,
    medName: string,
    currentStage: 'ASK_TAKEN' | 'ASK_REFILL'
  ): {
    intent: 'TAKEN' | 'RAN_OUT' | 'CONFIRM_REFILL' | 'DECLINE_REFILL' | 'LATER';
    aiReply: string;
  } {
    const lower = spokenText.toLowerCase().trim();

    if (currentStage === 'ASK_REFILL') {
      const yesWords = ['yes', 'yeah', 'sure', 'please', 'ok', 'okay', 'open', 'refill', 'order', 'అవును', 'సరే'];
      if (yesWords.some((w) => lower.includes(w))) {
        return {
          intent: 'CONFIRM_REFILL',
          aiReply: `Opening Medicare Pharmacy with ${medName} selected so you can review and confirm your refill order.`
        };
      }
      return {
        intent: 'DECLINE_REFILL',
        aiReply: `No problem. I have marked ${medName} as needing a refill on your dashboard whenever you are ready.`
      };
    }

    const ranOutKeywords = [
      'ran out',
      'out of',
      'finished',
      'no more',
      'empty',
      'need a refill',
      'need refill',
      'dont have',
      "don't have",
      'over',
      'aipoyayi',
      'aipoyindi'
    ];
    if (ranOutKeywords.some((k) => lower.includes(k))) {
      return {
        intent: 'RAN_OUT',
        aiReply: AI_PROMPT_TEMPLATES.medicationRefillOffer(medName)
      };
    }

    const takenKeywords = ['took', 'taken', 'yes', 'yeah', 'already', 'done', 'had it', 'vesukunnanu'];
    if (takenKeywords.some((k) => lower.includes(k))) {
      return {
        intent: 'TAKEN',
        aiReply: `Thank you for confirming! I have marked ${medName} as taken for today.`
      };
    }

    return {
      intent: 'LATER',
      aiReply: `Okay, I will keep ${medName} marked as a reminder for a little later.`
    };
  }

  /**
   * Evaluates spoken user input or tapped symptom option during the Morning Check-In conversation
   * with multi-turn context and personalized health profile awareness.
   */
  public static analyzeCheckInTurn(
    text: string,
    currentStep: 'INITIAL_CHECKIN' | 'FOLLOWUP_QUESTIONS' | 'MEDICATION_CHECK' | 'EMERGENCY_VERIFY',
    patient: PatientProfile,
    conversationHistory: string[] = []
  ): AIConversationTurnResult {
    const language: LanguageOption = patient.language || 'English';
    const lower = text.toLowerCase().trim();
    const fullContext = [...conversationHistory, lower].join(' ').toLowerCase();

    // 1. CRITICAL WELLNESS SIGNALS (Only when explicitly triggered by severe/emergency phrases)
    const criticalKeywords = [
      'chest pain',
      'cannot breathe',
      "can't breathe",
      'shortness of breath',
      'heart attack',
      'collapsed',
      'fell down',
      'severe pain',
      'unconscious',
      'stroke',
      'bleeding',
      'dying',
      'help me',
      'need help',
      'emergency',
      'extreme pain',
      'fainting',
      'gundelo noppi',
      'gundelonoppi',
      'oopiri aadadam ledu',
      'aayasam',
      'padipoyanu',
      'kapadandi',
      'severe chest',
      'breathing problem'
    ];

    for (const kw of criticalKeywords) {
      if (lower.includes(kw)) {
        return {
          state: 'CRITICAL',
          aiResponse: AI_PROMPT_TEMPLATES.closingCritical(language),
          summary: `Urgent wellness concern reported ("${text}"). Immediate safety check initiated.`,
          followUp: 'Initiate 10-second safety countdown and alert emergency contact if unresponsive.',
          reason: `Detected urgent distress phrase ("${kw}") during voice check-in.`,
          confidence: 'Prototype Indicator: High Urgency Match (Non-diagnostic)',
          toneSignal: 'Urgent / Distress vocal pattern',
          detectedKeyword: kw,
          shouldEndCall: true,
          nextStep: 'COMPLETE'
        };
      }
    }

    // 2. MEDICATION REFILL SIGNALS
    const refillKeywords = [
      'finished my medicine',
      'finished medicine',
      'no more medicine',
      'out of pills',
      'out of medicine',
      'need a refill',
      'medicine is over',
      "don't have it anymore",
      "don't have my medicine",
      'ran out',
      'mandulu aipoyayi',
      'tablets aipoyayi',
      'refill kaavali',
      'reorder'
    ];

    for (const kw of refillKeywords) {
      if (lower.includes(kw)) {
        const medToRefill =
          patient.currentMedicines?.find((m) => m.status === 'NEEDS_REFILL') ||
          patient.currentMedicines?.[0];
        const medName = medToRefill ? medToRefill.name : 'your medication';
        return {
          state: 'REFILL_REQUEST',
          aiResponse: AI_PROMPT_TEMPLATES.medicationRefillOffer(medName),
          summary: `User noted they ran out of ${medName} and requested a refill.`,
          followUp: `Review and confirm refill for ${medName} on Medicare Pharmacy.`,
          reason: `Detected medication refill request ("${kw}").`,
          confidence: 'Prototype Indicator: Direct Refill Intent',
          toneSignal: 'Conversational request',
          detectedKeyword: kw,
          shouldEndCall: true,
          nextStep: 'COMPLETE'
        };
      }
    }

    // 3. NOT OK / SYMPTOM CONCERN SIGNALS
    // Guard against negations like "no dizziness" or "no unusual symptoms"
    const isNegatedSymptom =
      lower.startsWith('no ') ||
      lower.includes('no unusual') ||
      lower.includes('no symptoms') ||
      lower.includes('no pain') ||
      lower.includes('no problem') ||
      lower.includes('feeling fine now');

    const notOkKeywords = [
      'not feeling well',
      'not good',
      'feel weak',
      'feeling weak',
      'weak',
      'dizzy',
      'dizziness',
      'headache',
      'nausea',
      'sick',
      'pain',
      'discomfort',
      'uncomfortable',
      "don't feel normal",
      'not normal',
      'very tired',
      'unusually tired',
      'unusually thirsty',
      'thirsty',
      'winded',
      'stiff',
      'stiffness',
      'exhausted',
      'vomiting',
      'fever',
      'chills',
      'sore',
      'shaking',
      'blurry',
      'bagaledu',
      'baaledhu',
      'kallu thiruguthunnayi',
      'thala noppi',
      'jwaram',
      'noppi',
      'neerasam'
    ];

    const matchedNotOk = !isNegatedSymptom
      ? notOkKeywords.find((kw) => lower.includes(kw))
      : undefined;
    const historyHasNotOk =
      !isNegatedSymptom &&
      conversationHistory.some((entry) => {
        const el = entry.toLowerCase();
        return !el.startsWith('no ') && notOkKeywords.some((kw) => el.includes(kw));
      });

    if (matchedNotOk || (currentStep !== 'INITIAL_CHECKIN' && historyHasNotOk)) {
      const kw = matchedNotOk || 'reported discomfort';
      const conditions = patient.healthProfile?.currentHealthIssues || patient.medicalConditions || [];
      const conditionContext =
        conditions.length > 0 ? ` alongside profile context (${conditions.slice(0, 2).join(', ')})` : '';

      if (currentStep === 'INITIAL_CHECKIN') {
        let customFollowUp = AI_PROMPT_TEMPLATES.personalizedFollowUp(patient, 'CONCERN');
        if (kw.includes('dizzy') || kw.includes('dizziness')) {
          customFollowUp = 'I understand. How severe does the dizziness feel right now, and are you sitting or lying down safely?';
        } else if (kw.includes('headache')) {
          customFollowUp = 'I understand you have a headache this morning. How severe does it feel right now, and are you feeling steady?';
        } else if (kw.includes('weak') || kw.includes('tired') || kw.includes('thirsty')) {
          customFollowUp = `I understand you are feeling ${kw}. Have you been able to drink some water or rest comfortably this morning?`;
        }

        return {
          state: 'NOT_OK',
          aiResponse: customFollowUp,
          summary: `User reported feeling unwell ("${text}"). Asking personalized wellness follow-up.`,
          followUp: 'Monitor discomfort and check if symptoms persist.',
          reason: `User mentioned "${kw}"${conditionContext}.`,
          confidence: 'Prototype Indicator: Moderate Wellness Concern',
          toneSignal: 'Low energy / Discomfort noted',
          detectedKeyword: kw,
          shouldEndCall: false,
          nextStep: 'FOLLOWUP_QUESTIONS'
        };
      }

      return {
        state: 'NOT_OK',
        aiResponse: AI_PROMPT_TEMPLATES.closingNotOk(language),
        summary: `Recorded that user is not feeling their usual self ("${text}"). Status set to NOT OK.`,
        followUp: 'Recommend rest, hydration, and checking in with family or a healthcare professional if discomfort continues.',
        reason: `Reported wellness symptoms ("${kw}")${conditionContext} during morning check-in.`,
        confidence: 'Prototype Indicator: Wellness Attention Advised (Non-diagnostic)',
        toneSignal: 'Subdued / Discomfort noted',
        detectedKeyword: kw,
        shouldEndCall: true,
        nextStep: 'COMPLETE'
      };
    }

    // 4. SAFE / POSITIVE OR NO-SYMPTOM FLOW
    if (currentStep === 'INITIAL_CHECKIN') {
      return {
        state: 'SAFE',
        aiResponse: AI_PROMPT_TEMPLATES.personalizedFollowUp(patient, 'GOOD'),
        summary: `User greeted and reported feeling well ("${text}").`,
        followUp: 'Continue routine daily check-in.',
        reason: 'Positive initial morning response; checking personalized wellness indicators.',
        confidence: 'Prototype Indicator: Normal Wellness Pattern',
        toneSignal: 'Calm & steady vocal tone',
        shouldEndCall: false,
        nextStep: 'FOLLOWUP_QUESTIONS'
      };
    }

    if (currentStep === 'FOLLOWUP_QUESTIONS') {
      return {
        state: 'SAFE',
        aiResponse: AI_PROMPT_TEMPLATES.medicationFollowUp(patient),
        summary: 'No unusual morning symptoms reported. Checking daily medication intake.',
        followUp: 'Confirm morning medication schedule.',
        reason: 'User confirmed no dizziness, weakness, or unusual symptoms.',
        confidence: 'Prototype Indicator: Normal Wellness Pattern',
        toneSignal: 'Calm & steady vocal tone',
        shouldEndCall: false,
        nextStep: 'MEDICATION_CHECK'
      };
    }

    // Final step completion -> SAFE
    return {
      state: 'SAFE',
      aiResponse: AI_PROMPT_TEMPLATES.closingSafe(language),
      summary: 'Morning check-in completed. User reported feeling well with no unusual symptoms.',
      followUp: 'Next scheduled AI morning check-in tomorrow at ' + (patient.checkInTime || '9:00 AM') + '.',
      reason: 'User reported steady morning energy, no concerning symptoms, and reviewed medication status.',
      confidence: 'Prototype Indicator: Consistent Wellness Pattern (Non-diagnostic)',
      toneSignal: 'Calm & clear vocal tone',
      shouldEndCall: true,
      nextStep: 'COMPLETE'
    };
  }

  /**
   * Formats structured AI status assessment for display after conversation completion.
   */
  public static buildAssessment(turnResult: AIConversationTurnResult): AIStatusAssessment {
    const status: 'SAFE' | 'NOT_OK' | 'CRITICAL' =
      turnResult.state === 'CRITICAL'
        ? 'CRITICAL'
        : turnResult.state === 'NOT_OK'
        ? 'NOT_OK'
        : 'SAFE';

    return {
      status,
      summary: turnResult.summary,
      followUp: turnResult.followUp,
      reason: turnResult.reason,
      confidence: turnResult.confidence
    };
  }
}

export const AIClassifierService = {
  analyzeResponse: (
    text: string,
    currentStep: 'INITIAL_CHECKIN' | 'FOLLOWUP_QUESTIONS' | 'MEDICATION_CHECK' | 'EMERGENCY_VERIFY',
    language: LanguageOption = 'English',
    conversationHistory: string[] = []
  ) => {
    const dummyProfile: any = {
      name: 'Alex Johnson',
      language,
      checkInTime: '9:00 AM',
      medicalConditions: ['Hypertension', 'Diabetes'],
      healthProfile: {
        currentHealthIssues: ['Hypertension', 'Diabetes']
      },
      currentMedicines: []
    };
    return AIService.analyzeCheckInTurn(text, currentStep, dummyProfile, conversationHistory);
  }
};
