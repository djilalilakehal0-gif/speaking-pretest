/**
 * Pre-payment disclosure. Text is a DRAFT until reviewed by a lawyer; bump DISCLOSURE_VERSION on every wording change.
 * Placeholders {plan} {price} are filled at render time from the plan config — never hard-coded prices.
 */
export const DISCLOSURE_VERSION = '2026-11-25-v1';
export type DisclosureLocale = 'ar' | 'es' | 'fr' | 'en';

export const DISCLOSURE: Record<DisclosureLocale, { title: string; items: string[]; check: string; nextLabel: string; back: string }> = {
  es: {
    title: 'Antes de pagar',
    items: [
      'Qué compras: suscripción {plan} por {price} al mes.',
      'Qué no incluye: esta suscripción no garantiza ninguna autorización de residencia ni ningún resultado administrativo. La aplicación es una herramienta de orientación; no es un despacho de abogados ni un organismo público.',
      'Tasas oficiales: cualquier tasa pagada a la Administración española es totalmente independiente y la aplicación no la recibe. Consulta la fuente oficial.',
      'Honorarios de abogado: si contratas una consulta con un abogado, sus honorarios los fija el abogado y se te muestran antes de pagar.',
      'Cancelación: puedes cancelar en cualquier momento desde tu cuenta. Sigue activa hasta el final del periodo pagado y no se renueva después.',
      'Reembolso: {refund}.',
      'Impuestos: se añade el IVA cuando corresponda, y el importe final aparece antes de pagar.',
      'Tus datos: el pago se procesa con Stripe. No guardamos los datos de tu tarjeta.',
    ],
    check: 'He leído lo anterior y entiendo que la suscripción no garantiza ningún resultado administrativo.',
    nextLabel: 'Continuar al pago', back: 'Volver',
  },
  ar: {
    title: 'قبل أن تدفع',
    items: [
      'ما الذي تشتريه: اشتراك {plan} بسعر {price} شهريًا.',
      'ما الذي لا يشمله: هذا الاشتراك لا يضمن الحصول على أي تصريح إقامة أو أي نتيجة إدارية. التطبيق أداة إرشاد، وليس مكتب محاماة ولا جهة حكومية.',
      'الرسوم الحكومية: أي تكلفة تُدفع للإدارة الإسبانية منفصلة تمامًا، ولا يتلقاها التطبيق. تحقق منها في المصدر الرسمي.',
      'أتعاب المحامي: إن استشرت محاميًا، فالأتعاب يحددها المحامي، وتظهر لك قبل الدفع.',
      'الإلغاء: يمكنك إلغاء الاشتراك في أي وقت من حسابك. يبقى فعالًا حتى نهاية الفترة المدفوعة، ولا يُجدَّد بعدها.',
      'الاسترداد: {refund}.',
      'الضريبة: تُضاف ضريبة القيمة المضافة عند الاقتضاء، ويظهر المبلغ النهائي قبل الدفع.',
      'بياناتك: يتم الدفع عبر Stripe، ولا نحفظ بيانات بطاقتك.',
    ],
    check: 'قرأتُ ما سبق، وأفهم أن الاشتراك لا يضمن أي نتيجة إدارية.',
    nextLabel: 'متابعة إلى الدفع', back: 'رجوع',
  },
  fr: {
    title: 'Avant de payer',
    items: [
      'Ce que vous achetez : abonnement {plan} à {price} par mois.',
      'Ce qui n’est pas inclus : cet abonnement ne garantit aucune autorisation de séjour ni aucun résultat administratif. L’application est un outil d’orientation ; ce n’est ni un cabinet d’avocats ni un organisme public.',
      'Taxes officielles : toute taxe payée à l’administration espagnole est totalement distincte et n’est pas reçue par l’application. Consultez la source officielle.',
      'Honoraires d’avocat : si vous consultez un avocat, ses honoraires sont fixés par lui et vous sont présentés avant le paiement.',
      'Résiliation : vous pouvez résilier à tout moment depuis votre compte. L’abonnement reste actif jusqu’à la fin de la période payée, sans renouvellement ensuite.',
      'Remboursement : {refund}.',
      'Taxes : la TVA est ajoutée le cas échéant, et le montant final s’affiche avant le paiement.',
      'Vos données : le paiement est traité par Stripe. Nous ne conservons pas les données de votre carte.',
    ],
    check: 'J’ai lu ce qui précède et je comprends que l’abonnement ne garantit aucun résultat administratif.',
    nextLabel: 'Continuer vers le paiement', back: 'Retour',
  },
  en: {
    title: 'Before you pay',
    items: [
      'What you are buying: a {plan} subscription at {price} per month.',
      'What it does not include: this subscription does not guarantee any residence authorisation or any administrative outcome. The app is an information tool; it is not a law firm or a public body.',
      'Official fees: any fee paid to the Spanish administration is entirely separate and the app does not receive it. Check the official source.',
      'Lawyer fees: if you book a consultation with a lawyer, the lawyer sets the fee and it is shown to you before you pay.',
      'Cancellation: you can cancel at any time from your account. It stays active until the end of the paid period and is not renewed afterwards.',
      'Refunds: {refund}.',
      'Tax: VAT is added where applicable and the final amount is shown before you pay.',
      'Your data: payment is processed by Stripe. We do not store your card details.',
    ],
    check: 'I have read the above and understand that the subscription does not guarantee any administrative result.',
    nextLabel: 'Continue to payment', back: 'Back',
  },
};

export const REFUND_TEXT: Record<DisclosureLocale, string> = {
  es: 'pendiente de definir con asesoría legal', ar: 'بانتظار تحديد الشروط مع المستشار القانوني',
  fr: 'à définir avec un conseil juridique', en: 'to be defined with legal counsel',
};

export function renderDisclosure(locale: DisclosureLocale, plan: string, price: string): string[] {
  const d = DISCLOSURE[locale];
  return d.items.map((s) => s.replace('{plan}', plan).replace('{price}', price).replace('{refund}', REFUND_TEXT[locale]));
}
