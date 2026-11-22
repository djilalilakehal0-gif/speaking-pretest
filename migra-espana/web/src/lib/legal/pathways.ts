import type { L, Pathway } from './types';

const l = (es: string, en: string, fr: string, ar: string): L => ({ es, en, fr, ar });
const REF = 'RD 1155/2024';

const RENEWAL_AMEND = l(
  'Prórroga (art. 132.2.a, redactado por RD 316/2026, vigente desde 16-04-2026): condicionada a acreditar búsqueda activa de empleo e inscripción en el servicio público de empleo, salvo circunstancias justificadas que impidan el acceso al empleo (enfermedad, discapacidad, edad de jubilación).',
  'Extension (art. 132.2.a, as worded by RD 316/2026, in force since 16-04-2026): conditional on proving active job search and registration with the public employment service, unless justified circumstances prevent access to employment (illness, disability, retirement age).',
  "Prorogation (art. 132.2.a, rédaction du RD 316/2026, en vigueur depuis le 16-04-2026) : subordonnée à la preuve d'une recherche active d'emploi et à l'inscription au service public de l'emploi, sauf circonstances justifiées empêchant l'accès à l'emploi (maladie, handicap, âge de la retraite).",
  'التمديد (المادة 132.2.أ بصيغة المرسوم الملكي 316/2026، ساري منذ 16-04-2026): مشروط بإثبات البحث النشط عن عمل والتسجيل في خدمة التوظيف العامة، ما لم تحُل ظروف مبررة دون الوصول إلى العمل (مرض، إعاقة، سن التقاعد).');

const ARRAIGO_DEF = l(
  'Autorización de residencia temporal por circunstancias excepcionales por razones de arraigo. El Reglamento distingue cinco modalidades: segunda oportunidad, sociolaboral, social, socioformativo y familiar (art. 125).',
  'Temporary residence authorisation for exceptional circumstances based on "arraigo" (roots). The Regulation distinguishes five types: second chance, socio-labour, social, socio-training and family (art. 125).',
  "Autorisation de séjour temporaire pour circonstances exceptionnelles fondée sur l'« arraigo » (enracinement). Le Règlement distingue cinq modalités : seconde chance, socio-professionnel, social, socio-formation et familial (art. 125).",
  'تصريح إقامة مؤقتة لظروف استثنائية بسبب «الأرايغو» (الاندماج والتجذّر). تميّز اللائحة خمسة أنواع: الفرصة الثانية، والاجتماعي-المهني، والاجتماعي، والاجتماعي-التكويني، والعائلي (المادة 125).');

const TWO_YEARS = l(
  'El Reglamento reduce a dos años la permanencia en España exigida para el arraigo (excepto el arraigo familiar) — Preámbulo del RD 1155/2024. La redacción exacta del requisito de permanencia continuada debe contrastarse con el articulado consolidado vigente.',
  'The Regulation reduces the required stay in Spain for arraigo to two years (except family arraigo) — preamble of RD 1155/2024. The exact wording of the continuous-stay requirement must be checked against the current consolidated articles.',
  "Le Règlement ramène à deux ans la durée de présence exigée en Espagne pour l'arraigo (sauf arraigo familial) — préambule du RD 1155/2024. La formulation exacte de l'exigence de présence continue doit être vérifiée dans le texte consolidé en vigueur.",
  'تخفّض اللائحة مدة الإقامة المطلوبة في إسبانيا للأرايغو إلى سنتين (باستثناء الأرايغو العائلي) — ديباجة المرسوم الملكي 1155/2024. يجب مطابقة الصياغة الدقيقة لشرط الإقامة المتواصلة مع النص الموحّد الساري.');

const V = '2026-11-22';
const base = { translationsReviewed: false } as const;

export const PATHWAYS: Pathway[] = [
  {
    ...base, slug: 'arraigo-social', group: 'A', code: 'A', spanishTerm: 'Arraigo social',
    title: l('Arraigo social', 'Social arraigo', 'Arraigo social', 'الأرايغو الاجتماعي'),
    summary: l('Residencia por vínculos familiares con extranjeros residentes o por integración acreditada.', 'Residence based on family ties with foreign residents or on proven integration.', "Séjour fondé sur des liens familiaux avec des étrangers résidents ou sur une intégration prouvée.", 'إقامة تستند إلى روابط عائلية مع أجانب مقيمين أو إلى اندماج مثبت.'),
    status: 'amended', legalReference: `${REF}, arts. 125, 127.c, 132.2.a; modif. RD 316/2026`, sourceIds: ['boe-rd-1155-2024', 'boe-rd-316-2026'],
    effectiveOn: '2025-05-20', lastVerifiedOn: V, verifiedSections: ['definition', 'conditions', 'residence', 'renewal'],
    sections: {
      definition: [ARRAIGO_DEF], residence: [TWO_YEARS],
      conditions: [l(
        'Vínculos familiares (cónyuge o pareja registrada, o familiares de primer grado en línea directa) con extranjeros titulares de autorización de residencia, y medios económicos suficientes que alcancen al menos el 100 % del IPREM, disponibles en España (art. 127.c).',
        'Family ties (spouse or registered partner, or first-degree direct-line relatives) with foreigners holding a residence authorisation, and sufficient means reaching at least 100% of the IPREM, available in Spain (art. 127.c).',
        "Liens familiaux (conjoint ou partenaire enregistré, ou parents au premier degré en ligne directe) avec des étrangers titulaires d'une autorisation de séjour, et ressources suffisantes atteignant au moins 100 % de l'IPREM, disponibles en Espagne (art. 127.c).",
        'روابط عائلية (زوج أو شريك مسجّل أو أقارب من الدرجة الأولى في خط مباشر) مع أجانب يحملون تصريح إقامة، وموارد كافية لا تقل عن 100% من مؤشر IPREM ومتاحة في إسبانيا (المادة 127.ج).'),
      l('Si no se acreditan esos vínculos, se valora el esfuerzo de integración mediante un informe favorable de integración social de la Comunidad Autónoma de residencia, emitido en el plazo de un mes desde su solicitud (art. 127.c).',
        'If those ties cannot be proven, integration effort is assessed through a favourable social-integration report from the autonomous community of residence, issued within one month of request (art. 127.c).',
        "Si ces liens ne peuvent être prouvés, l'effort d'intégration est apprécié par un rapport favorable d'intégration sociale de la communauté autonome de résidence, délivré dans un délai d'un mois à compter de la demande (art. 127.c).",
        'إذا تعذّر إثبات تلك الروابط، يُقيَّم جهد الاندماج بتقرير اندماج اجتماعي إيجابي من الحكم الذاتي محل الإقامة، يصدر خلال شهر من طلبه (المادة 127.ج).')],
      renewal: [RENEWAL_AMEND],
    },
  },
  {
    ...base, slug: 'arraigo-sociolaboral', group: 'A', code: 'B', spanishTerm: 'Arraigo sociolaboral',
    title: l('Arraigo sociolaboral', 'Socio-labour arraigo', 'Arraigo sociolaboral', 'الأرايغو الاجتماعي-المهني'),
    summary: l('Residencia basada en uno o varios contratos de trabajo que sumen al menos 20 horas semanales.', 'Residence based on one or more work contracts totalling at least 20 hours per week.', "Séjour fondé sur un ou plusieurs contrats de travail totalisant au moins 20 heures par semaine.", 'إقامة تستند إلى عقد عمل واحد أو أكثر لا يقل مجموعها عن 20 ساعة أسبوعيًا.'),
    status: 'amended', legalReference: `${REF}, arts. 125, 127.b, 132.2.a; modif. RD 316/2026`, sourceIds: ['boe-rd-1155-2024', 'boe-rd-316-2026'],
    effectiveOn: '2025-05-20', lastVerifiedOn: V, verifiedSections: ['definition', 'conditions', 'employment', 'residence', 'renewal'],
    sections: {
      definition: [ARRAIGO_DEF], residence: [TWO_YEARS],
      employment: [l(
        'Uno o varios contratos que garanticen al menos el salario mínimo interprofesional o el del convenio aplicable en el momento de la solicitud, en proporción a la jornada, y cuya suma represente una jornada semanal no inferior a 20 horas (art. 127.b).',
        'One or more contracts guaranteeing at least the minimum interprofessional wage or the applicable collective-agreement wage at the time of application, pro rata, and totalling no less than 20 hours per week (art. 127.b).',
        "Un ou plusieurs contrats garantissant au moins le salaire minimum interprofessionnel ou celui de la convention applicable au moment de la demande, au prorata, et totalisant au moins 20 heures hebdomadaires (art. 127.b).",
        'عقد أو أكثر يضمن على الأقل الحد الأدنى المهني للأجور أو أجر الاتفاقية الجماعية المطبّقة وقت الطلب، بنسبة ساعات العمل، ولا يقل مجموع ساعاته عن 20 ساعة أسبوعيًا (المادة 127.ب).'),
      l('Pueden aportarse varios contratos en trabajos estacionales o de temporada (concatenados, con distintos empleadores) y cuando se trabaje parcial y simultáneamente para más de un empleador (art. 127.b, 1.º y 2.º).',
        'Several contracts may be provided for seasonal work (consecutive, different employers) and when working part-time simultaneously for more than one employer (art. 127.b, 1st and 2nd).',
        "Plusieurs contrats peuvent être présentés pour des travaux saisonniers (successifs, employeurs différents) et en cas de travail à temps partiel simultané pour plusieurs employeurs (art. 127.b, 1.º et 2.º).",
        'يجوز تقديم عدة عقود في الأعمال الموسمية (متتابعة ولدى أصحاب عمل مختلفين) وعند العمل جزئيًا وبالتزامن لدى أكثر من صاحب عمل (المادة 127.ب، البندان 1 و2).')],
      conditions: [l('Aportación del contrato o contratos descritos (art. 127.b); el resto de requisitos generales del arraigo deben contrastarse en el texto consolidado.', 'Providing the contract(s) described (art. 127.b); other general arraigo requirements must be checked in the consolidated text.', "Présentation du ou des contrats décrits (art. 127.b) ; les autres conditions générales de l'arraigo doivent être vérifiées dans le texte consolidé.", 'تقديم العقد أو العقود الموصوفة (المادة 127.ب)؛ ويجب التحقق من باقي الشروط العامة للأرايغو في النص الموحّد.')],
      renewal: [RENEWAL_AMEND],
    },
  },
  {
    ...base, slug: 'arraigo-socioformativo', group: 'A', code: 'C', spanishTerm: 'Arraigo socioformativo',
    title: l('Arraigo socioformativo', 'Socio-training arraigo', 'Arraigo socioformativo', 'الأرايغو الاجتماعي-التكويني'),
    summary: l('Residencia para quien está matriculado o cursa formación reglada cualificante.', 'Residence for people enrolled in or attending qualifying formal training.', "Séjour pour les personnes inscrites ou suivant une formation qualifiante.", 'إقامة لمن هو مسجّل أو يتابع تكوينًا نظاميًا مؤهِّلًا.'),
    status: 'active', legalReference: `${REF}, arts. 125, 127.d`, sourceIds: ['boe-rd-1155-2024'],
    effectiveOn: '2025-05-20', lastVerifiedOn: V, verifiedSections: ['definition', 'conditions', 'residence'],
    sections: {
      definition: [ARRAIGO_DEF], residence: [TWO_YEARS],
      conditions: [l('Estar matriculado o cursando las formaciones de los arts. 52.1.b) y 52.1.e) 5.º (incluido el nivel uno), así como la oferta presencial de enseñanzas obligatorias de educación de personas adultas (art. 127.d).',
        'Being enrolled in or attending the training in arts. 52.1.b) and 52.1.e) 5th (including level one), and in-person compulsory adult education (art. 127.d).',
        "Être inscrit ou suivre les formations des art. 52.1.b) et 52.1.e) 5.º (y compris le niveau un), ainsi que l'offre présentielle d'enseignement obligatoire pour adultes (art. 127.d).",
        'التسجيل أو متابعة التكوينات المنصوص عليها في المادتين 52.1.ب و52.1.هـ (البند 5، بما فيه المستوى الأول)، وكذلك التعليم الإلزامي الحضوري للبالغين (المادة 127.د).')],
    },
  },
  {
    ...base, slug: 'arraigo-familiar', group: 'A', code: 'D', spanishTerm: 'Arraigo familiar',
    title: l('Arraigo familiar', 'Family arraigo', 'Arraigo familial', 'الأرايغو العائلي'),
    summary: l('Limitado a progenitores de ciudadanos de otro Estado miembro de la UE, del EEE o de Suiza.', 'Limited to parents of citizens of another EU, EEA or Swiss state.', "Limité aux parents de citoyens d'un autre État membre de l'UE, de l'EEE ou de la Suisse.", 'يقتصر على والدي مواطني دولة أخرى في الاتحاد الأوروبي أو المنطقة الاقتصادية الأوروبية أو سويسرا.'),
    status: 'active', legalReference: `${REF}, art. 125 y Preámbulo`, sourceIds: ['boe-rd-1155-2024'],
    effectiveOn: '2025-05-20', lastVerifiedOn: V, verifiedSections: ['definition', 'who'],
    sections: {
      definition: [ARRAIGO_DEF],
      who: [l('Se limita a los progenitores de ciudadanos de otro Estado miembro de la UE, del EEE o de Suiza. La autorización para progenitores de menores de nacionalidad española se regula en el capítulo VI del título IV (Preámbulo RD 1155/2024).',
        'Limited to parents of citizens of another EU/EEA/Swiss state. Residence for parents of Spanish minors is regulated in chapter VI of title IV (preamble of RD 1155/2024).',
        "Limité aux parents de citoyens d'un autre État UE/EEE/Suisse. Le séjour des parents de mineurs de nationalité espagnole est régi par le chapitre VI du titre IV (préambule du RD 1155/2024).",
        'يقتصر على والدي مواطني دولة أخرى في الاتحاد/المنطقة الاقتصادية الأوروبية/سويسرا. أما إقامة والدي القاصرين الإسبان فينظّمها الفصل السادس من الباب الرابع (ديباجة المرسوم الملكي 1155/2024).')],
    },
  },
  {
    ...base, slug: 'arraigo-segunda-oportunidad', group: 'A', code: 'E', spanishTerm: 'Arraigo de segunda oportunidad',
    title: l('Arraigo de segunda oportunidad', 'Second-chance arraigo', 'Arraigo de seconde chance', 'أرايغو الفرصة الثانية'),
    summary: l('Para quien fue titular de una autorización de residencia que no pudo renovar.', 'For people who held a residence authorisation they could not renew.', "Pour les personnes ayant détenu une autorisation de séjour qu'elles n'ont pu renouveler.", 'لمن كان يحمل تصريح إقامة ولم يتمكن من تجديده.'),
    status: 'amended', legalReference: `${REF}, arts. 125, 127.a, 132.2.a; modif. RD 316/2026`, sourceIds: ['boe-rd-1155-2024', 'boe-rd-316-2026'],
    effectiveOn: '2025-05-20', lastVerifiedOn: V, verifiedSections: ['definition', 'conditions', 'renewal'],
    sections: {
      definition: [ARRAIGO_DEF],
      conditions: [l('Haber sido titular, en los dos años inmediatamente anteriores a la solicitud, de una autorización de residencia no concedida por circunstancias excepcionales, cuya renovación no se produjo por motivos distintos de orden público, seguridad y salud pública (art. 127.a).',
        'Having held, in the two years immediately before applying, a residence authorisation not granted for exceptional circumstances, whose renewal did not occur for reasons other than public order, security and public health (art. 127.a).',
        "Avoir été titulaire, dans les deux ans précédant immédiatement la demande, d'une autorisation de séjour non accordée pour circonstances exceptionnelles, dont le renouvellement n'a pas eu lieu pour des motifs autres que l'ordre public, la sécurité et la santé publique (art. 127.a).",
        'أن يكون قد حمل، خلال السنتين السابقتين مباشرة للطلب، تصريح إقامة لم يُمنح لظروف استثنائية، ولم يُجدَّد لأسباب غير النظام العام والأمن والصحة العامة (المادة 127.أ).')],
      renewal: [RENEWAL_AMEND],
    },
  },
  {
    ...base, slug: 'extraordinary-regularisation', group: 'A', code: 'E', spanishTerm: 'Regularización extraordinaria',
    title: l('Otras vías y regularizaciones extraordinarias', 'Other exceptional pathways and extraordinary regularisation', 'Autres voies exceptionnelles et régularisations extraordinaires', 'مسارات استثنائية أخرى وبرامج التسوية الاستثنائية'),
    summary: l('Estado pendiente de verificación en el BOE. No se presenta como disponible.', 'Status pending verification in the BOE. Not presented as available.', "Statut en attente de vérification au BOE. Non présenté comme disponible.", 'الوضع بانتظار التحقق في الجريدة الرسمية. لا يُعرض على أنه متاح.'),
    status: 'under_review', legalReference: 'Verificar en BOE antes de publicar', sourceIds: ['portal-inmigracion'], lastVerifiedOn: null, verifiedSections: [], sections: {},
  },
  { ...base, slug: 'family-reunification', group: 'B', code: 'F', spanishTerm: 'Reagrupación familiar',
    title: l('Reagrupación familiar', 'Family reunification', 'Regroupement familial', 'لمّ الشمل العائلي'),
    summary: l('Residencia temporal por reagrupación familiar (capítulo II del Reglamento).', 'Temporary residence by family reunification (chapter II of the Regulation).', 'Séjour temporaire par regroupement familial (chapitre II du Règlement).', 'إقامة مؤقتة بموجب لمّ الشمل العائلي (الفصل الثاني من اللائحة).'),
    status: 'under_review', legalReference: `${REF}, Título IV, cap. II`, sourceIds: ['boe-rd-1155-2024'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'family-of-spanish-citizens', group: 'B', code: 'H', spanishTerm: 'Residencia de familiares de ciudadanos españoles',
    title: l('Residencia de familiares de ciudadanos españoles', 'Residence for family of Spanish citizens', 'Séjour des membres de famille de citoyens espagnols', 'إقامة أفراد عائلة المواطنين الإسبان'),
    summary: l('El Reglamento introduce la autorización de residencia temporal de familiares de personas con nacionalidad española.', 'The Regulation introduces a temporary residence authorisation for family members of Spanish nationals.', "Le Règlement introduit l'autorisation de séjour temporaire pour les membres de famille de personnes de nationalité espagnole.", 'تستحدث اللائحة تصريح إقامة مؤقتة لأفراد عائلة الأشخاص ذوي الجنسية الإسبانية.'),
    status: 'under_review', legalReference: `${REF}, Preámbulo`, sourceIds: ['boe-rd-1155-2024'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'work-residence', group: 'C', code: 'G', spanishTerm: 'Residencia por cuenta ajena',
    title: l('Residencia y trabajo por cuenta ajena', 'Residence through employment', 'Séjour par emploi salarié', 'الإقامة عبر العمل لدى الغير'),
    summary: l('Autorización inicial de residencia y trabajo por cuenta ajena.', 'Initial residence and employed-work authorisation.', 'Autorisation initiale de séjour et de travail salarié.', 'تصريح أولي للإقامة والعمل لدى الغير.'),
    status: 'under_review', legalReference: REF, sourceIds: ['boe-rd-1155-2024'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'work-authorization', group: 'C', code: 'L', spanishTerm: 'Autorización de trabajo',
    title: l('Autorización de trabajo', 'Work authorisation', 'Autorisation de travail', 'تصريح العمل'),
    summary: l('Condiciones de acceso al empleo para extranjeros.', 'Conditions for foreigners to access employment.', "Conditions d'accès à l'emploi pour les étrangers.", 'شروط حصول الأجانب على العمل.'),
    status: 'under_review', legalReference: REF, sourceIds: ['boe-rd-1155-2024'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'international-protection', group: 'D', code: 'I', spanishTerm: 'Protección internacional y asilo',
    title: l('Protección internacional y asilo', 'International protection and asylum', 'Protection internationale et asile', 'الحماية الدولية واللجوء'),
    summary: l('Regulada por la Ley 12/2009, reguladora del derecho de asilo y de la protección subsidiaria.', 'Governed by Law 12/2009 on the right of asylum and subsidiary protection.', "Régie par la loi 12/2009 sur le droit d'asile et la protection subsidiaire.", 'ينظّمها القانون 12/2009 المتعلق بحق اللجوء والحماية الفرعية.'),
    status: 'under_review', legalReference: 'Ley 12/2009', sourceIds: ['ley-12-2009'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'long-term-residence', group: 'E', code: 'J', spanishTerm: 'Residencia de larga duración',
    title: l('Residencia de larga duración', 'Long-term residence', 'Séjour de longue durée', 'الإقامة طويلة الأمد'),
    summary: l('Estatuto de residente de larga duración.', 'Long-term resident status.', 'Statut de résident de longue durée.', 'وضع المقيم طويل الأمد.'),
    status: 'under_review', legalReference: REF, sourceIds: ['boe-rd-1155-2024'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'renewal-modification', group: 'E', code: 'K', spanishTerm: 'Prórroga y modificación',
    title: l('Renovación y modificación de autorizaciones', 'Renewal and modification of permits', 'Renouvellement et modification des titres', 'تجديد التصاريح وتعديلها'),
    summary: l('Prórroga y modificación de las autorizaciones de residencia.', 'Extension and modification of residence authorisations.', 'Prorogation et modification des autorisations de séjour.', 'تمديد تصاريح الإقامة وتعديلها.'),
    status: 'under_review', legalReference: REF, sourceIds: ['boe-rd-1155-2024'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
  { ...base, slug: 'nie-tie', group: 'E', code: 'M', spanishTerm: 'NIE y TIE',
    title: l('NIE y TIE', 'NIE and TIE', 'NIE et TIE', 'رقم NIE وبطاقة TIE'),
    summary: l('Número de identidad de extranjero y Tarjeta de Identidad de Extranjero.', 'Foreigner identity number and Foreigner Identity Card.', "Numéro d'identité d'étranger et Carte d'identité d'étranger.", 'رقم هوية الأجنبي وبطاقة هوية الأجنبي.'),
    status: 'under_review', legalReference: REF, sourceIds: ['portal-inmigracion'], lastVerifiedOn: null, verifiedSections: [], sections: {} },
];

export const pathwayBySlug = (slug: string) => PATHWAYS.find((p) => p.slug === slug);
