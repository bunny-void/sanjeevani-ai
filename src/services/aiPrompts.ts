import { PatientProfile, LanguageOption } from '../types';

export const AI_SYSTEM_DISCLAIMER =
  'Prototype for demonstration purposes. Not a medical diagnosis or emergency response service.';

export const AI_PROMPT_TEMPLATES = {
  morningGreeting: (patient: PatientProfile): string => {
    const isTelugu = patient.language === 'Telugu' || patient.language === 'Telgish';
    if (isTelugu) {
      return `నమస్కారం ${patient.name}. నేను మీ సంజీవని AI హెల్త్ గార్డియన్. ఈ రోజు ఉదయం మీరు ఎలా ఉన్నారు?`;
    }
    return `Good morning, ${patient.name}. This is your Sanjeevani AI Health Guardian checking in. How are you feeling this morning?`;
  },

  personalizedFollowUp: (patient: PatientProfile, initialFeeling: 'GOOD' | 'CONCERN'): string => {
    const isTelugu = patient.language === 'Telugu' || patient.language === 'Telgish';
    const conditions = patient.healthProfile?.currentHealthIssues || patient.medicalConditions || [];
    const hasDiabetes = conditions.some((c) => c.toLowerCase().includes('diabetes'));
    const hasHypertension = conditions.some((c) => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'));
    const hasArthritis = conditions.some((c) => c.toLowerCase().includes('arthritis') || c.toLowerCase().includes('joint'));
    const hasHeart = conditions.some((c) => c.toLowerCase().includes('heart'));

    if (isTelugu) {
      if (initialFeeling === 'GOOD') {
        return 'అది వినడానికి చాలా సంతోషంగా ఉంది! ఈ ఉదయం మీకు కళ్ళు తిరగడం, నీరసం లేదా ఏదైనా అసౌకర్యం అనిపించిందా?';
      }
      return 'మీరు ఇబ్బంది పడుతున్నందుకు విచారిస్తున్నాను. మీకు కళ్ళు తిరగడం, నీరసం లేదా నొప్పి ఎలా ఉందో కొంచెం వివరంగా చెప్తారా?';
    }

    if (initialFeeling === 'GOOD') {
      if (hasDiabetes && hasHypertension) {
        return "That's wonderful to hear. Keeping your diabetes and blood pressure wellness in mind, have you noticed any unusual dizziness, weakness, or discomfort this morning?";
      }
      if (hasDiabetes) {
        return "That's good to hear. Since you track diabetes wellness in your profile, have you experienced any unusual weakness, lightheadedness, or fatigue this morning?";
      }
      if (hasHypertension || hasHeart) {
        return "That's good to hear. With your blood pressure profile in mind, are you feeling steady without any unusual headache or dizziness this morning?";
      }
      if (hasArthritis) {
        return "That's great to hear. How is your mobility today—any unusual stiffness or discomfort this morning?";
      }
      return "That's good to hear. Did you experience any unusual symptoms or discomfort this morning?";
    } else {
      if (hasDiabetes || hasHypertension) {
        return "I'm sorry to hear you're not feeling your best. Given your wellness profile, are you experiencing any dizziness, unusual weakness, or steadiness concerns right now?";
      }
      return "I'm sorry to hear that you're not feeling well. Could you tell me a little more about what kind of discomfort or fatigue you're noticing?";
    }
  },

  medicationFollowUp: (patient: PatientProfile): string => {
    const isTelugu = patient.language === 'Telugu' || patient.language === 'Telgish';
    const morningMed = patient.currentMedicines?.find((m) => m.timing === 'Morning') || patient.currentMedicines?.[0];
    const medName = morningMed ? `${morningMed.name} (${morningMed.dosage})` : 'your morning medication';

    if (isTelugu) {
      return `ధన్యవాదాలు. మీరు ఈ రోజు ఉదయం తీసుకోవాల్సిన ${morningMed?.name || 'మందులు'} వేసుకున్నారా?`;
    }
    return `Thank you for letting me know. Were you able to take ${medName} as scheduled this morning?`;
  },

  closingSafe: ( language: LanguageOption = 'English'): string => {
    if (language === 'Telugu' || language === 'Telgish') {
      return 'ధన్యవాదాలు. మీ ఉదయం చెక్-ఇన్ పూర్తయింది. మీ AI వెల్‌నెస్ స్టేటస్ SAFE గా నమోదు చేయబడింది. శుభదినం!';
    }
    return 'Thank you. Your morning check-in is complete and your AI wellness status is recorded as SAFE. Have a calm and healthy day!';
  },

  closingNotOk: (language: LanguageOption = 'English'): string => {
    if (language === 'Telugu' || language === 'Telgish') {
      return 'సమాచారం తెలిపినందుకు ధన్యవాదాలు. మీ వెల్‌నెస్ స్టేటస్ NOT OK గా నమోదు చేయబడింది. దయచేసి విశ్రాంతి తీసుకోండి.';
    }
    return 'Thank you for sharing that with me. I have recorded your AI wellness status as NOT OK for closer wellness attention. Please rest comfortably and consider checking in with your family or care provider.';
  },

  closingCritical: (language: LanguageOption = 'English'): string => {
    if (language === 'Telugu' || language === 'Telgish') {
      return 'మీ మాటల్లో తీవ్రమైన అత్యవసర సంకేతం కనిపిస్తోంది. వెంటనే 10-సెకన్ల అత్యవసర నిర్ధారణ కౌంట్‌డౌన్ ప్రారంభిస్తున్నాను.';
    }
    return 'I noticed urgent distress in your response. I am starting the 10-second emergency check countdown right now to make sure you are safe.';
  },

  medicationReminderCall: (medName: string, dosage: string): string => {
    return `Hello. This is your Sanjeevani medication reminder. I noticed your ${medName} ${dosage} hasn't been confirmed yet. Were you able to take it?`;
  },

  medicationRefillOffer: (medName: string): string => {
    return `I understand you have run out of ${medName}. Would you like to request a refill from Medicare Pharmacy?`;
  },

  appointmentReminderCall: (doctorName: string, time: string, address: string): string => {
    return `Hello. This is your Sanjeevani AI assistant. You have a doctor appointment scheduled today with ${doctorName} at ${time}, located at ${address}. Please let me know if you acknowledge this reminder.`;
  }
};
