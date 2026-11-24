import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-3.1-flash-lite';

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('GEMINI_API_KEY_MISSING') ||
        attempt === maxRetries
      ) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY_MISSING')) {
    return {
      status: 500,
      message: 'مفتاح Gemini API مش متضاف في الإعدادات (Settings > Secrets).',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      message: 'مفتاح الـ API محتاج مراجعة في Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'العيادة زحمة جداً دلوقتي (Rate limit)، جرب تبعت تاني بعد ثواني.',
    };
  }
  return {
    status: 500,
    message: `حصل عطل فني بسيط في العيادة: ${raw}`,
  };
}

const DOCTOR_SYSTEM_INSTRUCTION = `
أنت "د. خليل فاكر"، استشاري مخ وأعصاب وذاكرة مصري، شاطر جداً في شغلك، بس دمك خفيف، مرح، وبتتكلم بالعامية المصرية الأصيلة (بدون تكلف أو فصحى ثقيلة).
مهمتك تاخد تاريخ مرضي (Medical History) كامل ومنظم من مريض بيشتكي من ضعف الذاكرة أو النسيان، خطوة بخطوة بطريقة تفاعلية لذيذة ومريحة.

قواعد الشخصية والأسلوب:
1. اتكلم باللهجة المصرية المحببة والذكية ("ازيك يا فندم"، "منور العيادة"، "متقلقش خالص"، "ده الطبيعي في زمن الريلز والزحمة"، "بتحط الموبايل في التلاجة ولا لسه موصلناش للمرحلة دي؟").
2. خلي ردودك مركزة وممتعة (2 إلى 4 جمل بالكتير): الأول تعلّق بظرافة وتعاطف على كلام المريض، وبعدين تسأل سؤال واحد محدد وواضح عن المرحلة اللي بعدها في التاريخ المرضي.
3. مراحل أخذ التاريخ المرضي بالترتيب المرن:
   - chief_complaint: طبيعة النسيان وأمثلته (ذاكرة قريبة زي أسماء ومفاتيح ومواعيد ولا بعيدة؟)
   - onset_duration: الموضوع بدأ امتى وبيتطور إزاي؟
   - lifestyle_sleep: النوم، القلق والتوتر، ضغط الشغل، شرب القهوة والشاي والموبايل قبل النوم.
   - medical_history: الأمراض المزمنة (ضغط، سكر، غدة درقية، أنيميا)، الأدوية اللي بياخدها، وأي علامات خطر (توهان في أماكن مألوفة، صداع شديد، دوخة).
   - memory_check: عمل اختبار ذاكرة سريع تفاعلي (تقدر تقترح triggerMiniTest لو المريض لسه معملش اختبارات).
   - ready_for_diagnosis: لما تجمع صورة واضحة (بعد حوالي 4 إلى 6 أسئلة أو لو عمل اختبار).
4. في كل رد، اقترح 3 أو 4 ردود سريعة (quickReplies) بالعامية المصرية المرحة والواقعية عشان المريض يقدر يختار منها بضغطة واحدة أو يكتب بنفسه.
5. استخرج البيانات الطبية في extractedFindings عشان نحدث ملف المريض لحظياً، واكتب doctorWittyNote (ملحوظة طبية مرحة قصيرة على جنب).
6. لو المريض ذكر علامة خطر حقيقية (توهان في الشارع، فقدان وعي، ضعف مفاجئ في الكلام أو الحركة، خبطة رأس قوية)، خليك لطيف وطمّنه بس سجّل ده في redFlagsCheck ووجّهه إن التشخيص النهائي يستدعي فحص مباشر.
7. ممنوع تكرار نفس السؤال اللي المريض جاوب عليه بالفعل! لو المريض لسه ما عملش أي اختبار ذاكرة في completedTests، اقترح triggerMiniTest: "word_recall" في نص الجلسة (مثلاً في الدور التالت أو الرابع) أو "sequence_match" لو خلص word_recall. ولو عملهم خلاص خلي triggerMiniTest يساوي null.
`;

const STEP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    doctorReply: {
      type: Type.STRING,
      description: 'رد الدكتور خليل بالعامية المصرية المرحة مع تعليق لطيف وسؤال واحد واضح.',
    },
    doctorMood: {
      type: Type.STRING,
      description: 'One of: welcoming, curious, amused, focused, reassuring',
    },
    quickReplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 4 witty realistic Egyptian Arabic quick reply options for the patient.',
    },
    currentTopic: {
      type: Type.STRING,
      description:
        'One of: chief_complaint, onset_duration, lifestyle_sleep, medical_history, memory_check, ready_for_diagnosis',
    },
    progressPercent: {
      type: Type.INTEGER,
      description: 'Progress from 10 to 100 representing medical history completeness.',
    },
    extractedFindings: {
      type: Type.OBJECT,
      properties: {
        chiefComplaint: { type: Type.STRING },
        duration: { type: Type.STRING },
        forgetfulnessTriggers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        sleepPattern: { type: Type.STRING },
        stressAndMood: { type: Type.STRING },
        caffeineAndHabits: { type: Type.STRING },
        medicalAndMeds: { type: Type.STRING },
        redFlagsCheck: { type: Type.STRING },
        doctorWittyNote: { type: Type.STRING },
      },
    },
    triggerMiniTest: {
      type: Type.STRING,
      description:
        'Either "word_recall", "sequence_match", "daily_scenario", or "none" if no test should be triggered right now.',
    },
    readyForDiagnosis: {
      type: Type.BOOLEAN,
      description: 'True when enough medical history has been collected to give diagnosis and prescription.',
    },
  },
  required: [
    'doctorReply',
    'doctorMood',
    'quickReplies',
    'currentTopic',
    'progressPercent',
    'extractedFindings',
    'triggerMiniTest',
    'readyForDiagnosis',
  ],
};

const DIAGNOSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    diagnosisTitle: {
      type: Type.STRING,
      description: 'عنوان تشخيص مصري مرح وذكي ويعبر عن الحالة بدقة.',
    },
    clinicalClassification: {
      type: Type.STRING,
      description: 'التصنيف الطبي الواضح بالعربية (مثلاً: إجهاد ذهني وتشتت انتباه حميد).',
    },
    severityLevel: {
      type: Type.STRING,
      description: 'Must be exactly one of: خفيف ومطمئن, متوسط ويحتاج متابعة, يستدعي فحص طبي مباشر',
    },
    doctorSummary: {
      type: Type.STRING,
      description: 'شرح د. خليل بالعامية المصرية المرحة والمطمئنة للحالة وسبب النسيان بناءً على كلام المريض واختباراته.',
    },
    cognitiveProfile: {
      type: Type.OBJECT,
      properties: {
        shortTermMemory: { type: Type.INTEGER },
        focusAndAttention: { type: Type.INTEGER },
        sleepRecovery: { type: Type.INTEGER },
        stressResilience: { type: Type.INTEGER },
      },
      required: ['shortTermMemory', 'focusAndAttention', 'sleepRecovery', 'stressResilience'],
    },
    prescriptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          dosage: { type: Type.STRING },
          timing: { type: Type.STRING },
          duration: { type: Type.STRING },
          doctorNote: { type: Type.STRING },
        },
        required: ['name', 'category', 'dosage', 'timing', 'duration', 'doctorNote'],
      },
      description: '4 to 5 items mixing practical safe OTC vitamins/supplements (like B12, Omega 3, Magnesium) with humorous practical Egyptian lifestyle prescriptions.',
    },
    recommendedLabs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 4 relevant medical lab tests in Arabic (e.g., فيتامين B12, وظائف الغدة الدرقية TSH, صورة دم كاملة CBC).',
    },
    lifestyleTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '4 funny yet practical Egyptian daily tips to boost memory.',
    },
    followUpJoke: {
      type: Type.STRING,
      description: 'جملة ختامية خفيفة الظل من د. خليل عن ميعاد الاستشارة الجاية.',
    },
    medicalDisclaimer: {
      type: Type.STRING,
      description: 'تنبيه طبي لطيف بالعامية المصرية يوضح إن ده تقييم تفاعلي وتوعوي ولا يغني عن الكشف الفعلي عند دكتور مخ وأعصاب لو الأعراض مستمرة.',
    },
  },
  required: [
    'diagnosisTitle',
    'clinicalClassification',
    'severityLevel',
    'doctorSummary',
    'cognitiveProfile',
    'prescriptions',
    'recommendedLabs',
    'lifestyleTips',
    'followUpJoke',
    'medicalDisclaimer',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/consult/step', async (req: Request, res: Response) => {
    try {
      const {
        patientProfile,
        messages,
        findings,
        completedTests,
        isInitial,
      } = req.body ?? {};

      if (!patientProfile || !patientProfile.name) {
        res.status(400).json({ error: 'بيانات المريض ناقصة يا فندم.' });
        return;
      }

      const ai = getAIClient();

      const transcriptText = Array.isArray(messages) && messages.length > 0
        ? messages
            .map((m: { role: string; text: string }) =>
              `${m.role === 'doctor' ? 'د. خليل' : m.role === 'system_test' ? 'نتيجة اختبار' : 'المريض'}: ${m.text}`
            )
            .join('\n')
        : 'لسه الكشف بيبدأ حالاً.';

      const testsSummary = Array.isArray(completedTests) && completedTests.length > 0
        ? completedTests
            .map((t: { title: string; score: number; maxScore: number; details: string }) =>
              `- ${t.title}: ${t.score}/${t.maxScore} (${t.details})`
            )
            .join('\n')
        : 'المريض لسه معملش اختبارات ذاكرة.';

      const userTurnsCount = Array.isArray(messages)
        ? messages.filter((m: { role: string }) => m.role === 'patient').length
        : 0;

      const prompt = `
بيانات المريض:
- الاسم: ${patientProfile.name}
- السن: ${patientProfile.age} سنة
- طبيعة الشغل/الحياة: ${patientProfile.occupation || 'غير محدد'}
- تقييم المريض الشخصي للنسيان (من 10): ${patientProfile.selfRatedForgetfulness}/10
- عدد ردود المريض لحد دلوقتي: ${userTurnsCount}

الملف الطبي المسجل حالياً:
${JSON.stringify(findings || {}, null, 2)}

الاختبارات اللي خلصها المريض:
${testsSummary}

سجل المحادثة لحد دلوقتي:
${transcriptText}

المطلوب دلوقتي:
${
  isInitial
    ? `رحّب بـ "${patientProfile.name}" بروح مصرية دمه خفيف جداً في بداية الكشف، وعلق على تقييمه (${patientProfile.selfRatedForgetfulness}/10) أو شغله (${patientProfile.occupation || 'حياته اليومية'})، واسأله أول سؤال في التاريخ المرضي عن طبيعة النسيان اللي بيحصله وأمثلته.`
    : `رد على آخر كلام قاله المريض بظرافة واهتمام طبي حقيقي، وحدّث extractedFindings بالمعلومات الجديدة فقط (متنساش تحافظ على المعلومات القديمة أو تحسنها)، واسأله السؤال التالي المنطقي في التاريخ المرضي.
ملاحظة مهمة: لو عدد ردود المريض 2 أو 3 ولسه معملش اختبار "word_recall"، اقترح triggerMiniTest: "word_recall" عشان نعمله تحدي بسيط! ولو عمله ولسه معملش "sequence_match" في الدور 4، ممكن تقترح "sequence_match" أو تكمل للأسئلة. لو عدد الردود وصل 5 أو أكتر وعندك معلومات كافية، خلي readyForDiagnosis = true واسأله لو جاهز يشوف التشخيص والروشتة أو فيه حاجة تانية يحب يضيفها.`
}
`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: DOCTOR_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: STEP_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        })
      );

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);

      if (parsed.triggerMiniTest === 'none' || parsed.triggerMiniTest === '') {
        parsed.triggerMiniTest = null;
      }

      res.json(parsed);
    } catch (err: unknown) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/consult/diagnose', async (req: Request, res: Response) => {
    try {
      const { patientProfile, messages, findings, completedTests } = req.body ?? {};

      if (!patientProfile || !patientProfile.name) {
        res.status(400).json({ error: 'محتاجين بيانات المريض عشان نكتب الروشتة.' });
        return;
      }

      const ai = getAIClient();

      const transcriptText = Array.isArray(messages)
        ? messages
            .map((m: { role: string; text: string }) =>
              `${m.role === 'doctor' ? 'د. خليل' : m.role === 'system_test' ? 'نتيجة اختبار' : 'المريض'}: ${m.text}`
            )
            .join('\n')
        : '';

      const testsSummary = Array.isArray(completedTests) && completedTests.length > 0
        ? completedTests
            .map((t: { title: string; score: number; maxScore: number; details: string }) =>
              `- ${t.title}: ${t.score}/${t.maxScore} (${t.details})`
            )
            .join('\n')
        : 'لم يتم إجراء اختبارات تفاعلية.';

      const prompt = `
أنت د. خليل فاكر، استشاري المخ والأعصاب والذاكرة. خلصت أخذ التاريخ المرضي من "${patientProfile.name}" (السن: ${patientProfile.age} سنة، الشغل: ${patientProfile.occupation || 'غير محدد'})، ودلوقتي بتكتبله التشخيص النهائي والروشتة الطبية باللهجة المصرية المرحة، بس بشكل طبي محترم ومفيد وآمن.

بيانات الكشف الكاملة:
- تقييم المريض لنسيانه: ${patientProfile.selfRatedForgetfulness}/10
- الملخص السريري: ${JSON.stringify(findings || {}, null, 2)}
- نتائج اختبارات الذاكرة:
${testsSummary}
- نص الحوار:
${transcriptText}

تعليمات كتابة التشخيص والروشتة:
1. اديله عنوان تشخيص دمه خفيف ويعكس حالته بالظبط (مثلاً: "متلازمة السرحان القاهري وإرهاق قلة النوم" أو "تشوش الذاكرة الحميد بسبب ضغط الشغل ونقص الفيتامينات").
2. حدد severityLevel بدقة واحدة من القيم الثلاثة فقط: "خفيف ومطمئن" أو "متوسط ويحتاج متابعة" أو "يستدعي فحص طبي مباشر" (اختار التالتة لو ذكر أعراض خطر حقيقية زي توهان شديد أو سن كبير مع تدهور سريع أو خبطة رأس).
3. في cognitiveProfile ادي درجات واقعية من 25 إلى 98 بناءً على كلامه ونتائج اختباراته.
4. في prescriptions اكتب 4 أو 5 حاجات في الروشتة:
   - ابدأ بمكملات/فيتامينات آمنة ومشهورة للذاكرة في مصر (مثلاً: فيتامين B12 / أوميجا 3 / ماغنيسيوم بلس / جينكو بيلوبا أو فيتامين د حسب حالته) بجرعات استرشادية واضحة مع تعليق مصري دمه خفيف من الدكتور.
   - وحط عنصر أو اتنين في الروشتة كـ "علاج سلوكي مصري" (مثلاً: "دواء الصمت الرقمي قبل النوم بساعة" أو "كراسة النوتة الصفراء أم 10 جنيه" أو "كوباية نعناع دافية بدون سكر").
5. في recommendedLabs اكتب التحاليل الطبية المناسبة لحالته (مثل فيتامين B12، TSH، CBC، فيتامين D، سكر تراكمي).
6. في medicalDisclaimer وضح بروح لطيفة إن دي استشارة تفاعلية مرحة وتوعوية، ولازم مراجعة طبيب مخ وأعصاب لو الأعراض بتزيد.
`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: DOCTOR_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: DIAGNOSIS_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        })
      );

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);

      const now = new Date();
      const codeNum = Math.floor(100000 + Math.random() * 900000);
      const issuedDate = now.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      res.json({
        prescriptionCode: `RX-${codeNum}`,
        issuedDate,
        ...parsed,
      });
    } catch (err: unknown) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/consult/followup', async (req: Request, res: Response) => {
    try {
      const { patientProfile, diagnosis, question } = req.body ?? {};
      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: 'اكتب سؤالك للدكتور الأول يا فندم.' });
        return;
      }

      const ai = getAIClient();
      const prompt = `
المريض "${patientProfile?.name || 'بطلنا'}" أخد الروشتة دي:
التشخيص: ${diagnosis?.diagnosisTitle || ''}
الأدوية: ${JSON.stringify(diagnosis?.prescriptions || [])}

المريض بيسأل سؤال بعد الروشتة:
"${question}"

جاوبه بالعامية المصرية المرحة في 2-4 جمل، إجابة طبية واضحة ومطمنة ومفيدة من غير رغي كتير.
`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: DOCTOR_SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        })
      );

      res.json({ answer: (response.text ?? '').trim() });
    } catch (err: unknown) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dr. Faker Clinic server listening on http://localhost:${PORT}`);
  });
}

startServer();
