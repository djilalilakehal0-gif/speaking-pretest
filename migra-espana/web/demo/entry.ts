// Standalone demo bundle: vanilla UI over the REAL engine, dictionaries and legal seed (no backend, nothing stored).
import { DICTIONARIES } from '@/i18n';
import { LOCALES, LOCALE_NAMES, INTL_LOCALE, dirOf, type Locale } from '@/i18n/config';
import { assess, groupByBucket } from '@/lib/eligibility/engine';
import { ASYLUM_OPTIONS, PERMIT_OPTIONS, QUESTIONS, isVisible } from '@/lib/eligibility/questions';
import { COUNTRY_CODES } from '@/lib/eligibility/countries';
import { PATHWAYS } from '@/lib/legal/pathways';
import { SOURCES, RESOURCES } from '@/lib/legal/sources';
import { HELP_ORGS, HELP_SOURCE } from '@/lib/legal/help';
import type { Answers, PathwayResult } from '@/lib/eligibility/types';
import type { SectionKey } from '@/lib/legal/types';
import { ICON, laurel } from '@/lib/ui/icons';
import heroImg from './brand/hero.jpg';
import heroCleanImg from './brand/hero-clean.jpg';
import { POSTER, posterLabels } from '@/lib/ui/poster';
import logoImg from './brand/logo.jpg';
import clipImg from './brand/clipboard.jpg';
import roadImg from './brand/road.jpg';
import gavelImg from './brand/gavel.jpg';
import folderImg from './brand/folder.jpg';

let locale: Locale = (['es', 'en', 'fr', 'ar'] as Locale[]).find((l) => navigator.language?.startsWith(l)) ?? 'es';
let answers: Answers = {}; let qi = 0; let done = false;
const t = (k: string) => DICTIONARIES[locale][k] ?? DICTIONARIES.es[k] ?? k;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const app = document.getElementById('app')!;
const route = () => location.hash.slice(1) || 'home';

const SECTIONS: [SectionKey, string][] = [['definition', 'legal.definition'], ['who', 'legal.who'], ['conditions', 'legal.conditions'], ['residence', 'legal.residence'], ['employment', 'legal.employment'], ['renewal', 'legal.renewal']];
const GROUPS = { A: 'legal.groupA', B: 'legal.groupB', C: 'legal.groupC', D: 'legal.groupD', E: 'legal.groupE' } as const;

function stars() {
  const pts = Array.from({ length: 9 }, (_, i) => { const a = (200 + i * 14) * Math.PI / 180; return [170 + Math.cos(a) * 140, 300 + Math.sin(a) * 140]; });
  const star = (x: number, y: number) => `<polygon points="${Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 6 : 15; const a = (k * 36 - 90) * Math.PI / 180; return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`; }).join(' ')}" fill="#c7a45b" opacity=".75"/>`;
  return `<svg class="stars" viewBox="0 0 340 300" aria-hidden="true">${pts.map(([x, y]) => star(x, y)).join('')}</svg>`;
}

function header() {
  const r = route();
  const link = (h: string, k: string, icon: string) => `<a href="#${h}" ${r.startsWith(h) ? 'aria-current="page"' : ''}>${icon}<span>${esc(t(k))}</span></a>`;
  return `${stars()}<header class="in"><div class="mast"><div class="flag" aria-hidden="true"><i></i></div><img class="seal" src="${logoImg}" alt="">
    <div class="brandrow">${laurel()}<div><div class="wordmark">MIGRA ESPAÑA</div><div class="tag">${esc(t('brand.tagline'))}</div></div>${laurel(true)}</div></div>
    <nav class="navwrap" aria-label="Main"><a class="homebtn" href="#home">${ICON.home}${esc(t('nav.home'))}</a><span class="bell" aria-hidden="true">${ICON.bell}</span>
      <div class="pill-nav">${link('law', 'nav.law', ICON.book)}${link('eligibility', 'nav.eligibility', ICON.people)}${link('guides', 'nav.guides', ICON.scales)}${link('help', 'help.title', ICON.chat)}</div></nav>
    <div class="langrow"><label class="lang">${ICON.pin}<select id="lang" aria-label="${esc(t('nav.language'))}">${LOCALES.map((l) => `<option value="${l}" ${l === locale ? 'selected' : ''}>${LOCALE_NAMES[l]}</option>`).join('')}</select>${ICON.chevronDown}</label><span class="bell" aria-hidden="true">${ICON.globe}</span></div></header>`;
}

function posterHtml() {
  const labels = posterLabels(locale);
  const spans = (labels ?? []).map((l) => `<span class="poster-label" dir="ltr" aria-hidden="true" style="left:${(l.slot.x / POSTER.w) * 100}%;top:${(l.slot.y / POSTER.h) * 100}%;width:${(l.slot.w / POSTER.w) * 100}%;font-size:${(l.size / POSTER.w) * 100}cqw;transform:translate(-50%,-50%) rotate(${l.slot.rot}deg)">${l.lines.map((x) => `<span>${esc(x)}</span>`).join('')}</span>`).join('');
  return `<div class="poster-wrap"><img src="${labels ? heroCleanImg : heroImg}" alt="MIGRA ESPAÑA" width="1200" height="1311">${spans}</div>`;
}

function home() {
  const chev = ICON.chevron;
  return `<section class="in"><div class="hero">${posterHtml()}<div class="hero-copy"><span class="eyebrow">${esc(t('hero.eyebrow'))}</span><h1>${t('hero.title').split(/(?<=[.。])\s+/).map((x) => `<span style="display:block">${esc(x)}</span>`).join('')}</h1><p class="lead">${esc(t('hero.sub'))}</p></div></div>
    <div class="ctas"><a class="btn gold" href="#eligibility">${ICON.rocket}${esc(t('hero.cta1'))}</a><a class="btn" href="#law">${ICON.scales}${esc(t('hero.cta2'))}</a><a class="btn" href="#start">${ICON.doc}${esc(t('start.homeLink'))}</a></div></section>
  <section class="in sec"><h2 class="rule-title">${esc(t('home.shortcuts'))}</h2>
    <div class="tiles">
      <a class="tile t-elig" href="#eligibility"><h3>${chev}${esc(t('shortcut.eligibility'))}</h3><img src="${clipImg}" alt=""></a>
      <a class="tile t-road" href="#start"><h3>${chev}${esc(t('shortcut.pathway'))}</h3><img src="${roadImg}" alt=""></a>
      <a class="tile t-law" href="#law"><h3>${chev}${esc(t('shortcut.law'))}</h3><img src="${gavelImg}" alt=""></a>
    </div>
    <div class="trust"><div class="ribbon" aria-hidden="true"><i></i></div><div><h3>${ICON.badge}${esc(t('home.trust.title'))}</h3><p>${esc(t('home.trust.body'))}</p><p class="meta" style="margin:0">${esc(t('home.notLawyer'))}</p></div><img src="${folderImg}" alt=""></div>
    <p class="note info" style="margin-top:18px">${esc(t('common.demo'))}</p></section>`;
}

function law() {
  return `<div class="title"><div class="in"><h1>${esc(t('nav.law'))}</h1></div></div><section class="in sec"><p class="note">${esc(t('legal.draftBanner'))}</p><p class="note info"><b>${esc(t('legal.extraordinaryTitle'))}.</b> ${esc(t('legal.extraordinaryBody'))}</p>
  ${(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => { const items = PATHWAYS.filter((p) => p.group === g && p.slug !== 'extraordinary-regularisation'); return items.length ? `<h2 style="margin-top:28px">${esc(t(GROUPS[g]))}</h2><div class="grid">${items.map((p) => `<a class="card" href="#law-${p.slug}"><span class="badge ${p.status}">${esc(t('status.' + p.status))}</span><h3>${esc(p.title[locale])}</h3><p class="meta">${esc(p.legalReference)}</p><p>${esc(p.summary[locale])}</p><p class="meta">${esc(t('common.lastVerified'))}: ${esc(p.lastVerifiedOn ?? t('common.notVerified'))}</p></a>`).join('')}</div>` : ''; }).join('')}</section>`;
}

function pathway(slug: string) {
  const p = PATHWAYS.find((x) => x.slug === slug); if (!p) return law();
  const srcs = SOURCES.filter((s) => p.sourceIds.includes(s.id));
  return `<div class="title"><div class="in"><h1>${esc(p.title[locale])}</h1><p>${esc(p.summary[locale])}</p></div></div><section class="in sec prose">
  <p class="meta"><span class="badge ${p.status}">${esc(t('status.' + p.status))}</span> ${esc(t('legal.spanishTerm'))}: <b>${esc(p.spanishTerm)}</b> · ${esc(t('common.legalRef'))}: ${esc(p.legalReference)} · ${esc(t('common.lastVerified'))}: ${esc(p.lastVerifiedOn ?? t('common.notVerified'))}</p>
  <p class="note">${esc(t('legal.draftBanner'))}</p>${locale !== 'es' ? `<p class="note info">${esc(t('legal.translationBanner'))}</p>` : ''}
  ${SECTIONS.map(([k, lab]) => { const items = p.sections[k]; return `<h3>${esc(t(lab))}</h3>` + (p.verifiedSections.includes(k) && items?.length ? `<ul>${items.map((i) => `<li>${esc(i[locale])}</li>`).join('')}</ul>` : `<p class="pending">${esc(t('legal.pendingSection'))}</p>`); }).join('')}
  <h3>${esc(t('legal.fees'))}</h3><p class="pending">${esc(t('legal.feesNote'))}</p><h3>${esc(t('legal.remedies'))}</h3><p>${esc(t('legal.remediesGeneric'))}</p>
  <h3>${esc(t('legal.references'))}</h3><ul>${srcs.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> — ${esc(s.issuer)}</li>`).join('')}</ul></section>`;
}


function start() {
  return `<section class="hero"><div class="in"><p class="eyebrow">${esc(t('start.eyebrow'))}</p><h1 style="font-size:clamp(1.8rem,4.5vw,2.8rem)">${esc(t('start.title'))}</h1><p class="lead">${esc(t('start.sub'))}</p><div class="actions"><a class="btn gold" href="#eligibility">${esc(t('start.cta'))}</a></div></div></section>
  <section class="in sec" style="max-width:820px"><ol class="steps">${[1, 2, 3, 4].map((n) => `<li><div><h3>${esc(t(`start.s${n}.t`))}</h3><p>${esc(t(`start.s${n}.b`))}</p></div></li>`).join('')}</ol>
  <div class="card" style="margin-top:24px"><h2>${esc(t('start.proofTitle'))}</h2><p>${esc(t('start.proofBody'))}</p><ul>${[1, 2, 3, 4].map((n) => `<li>${esc(t(`start.proof${n}`))}</li>`).join('')}</ul><p class="note info">${esc(t('docs.noSelfData'))}</p></div>
  <h2 style="margin-top:26px">${esc(t('start.faqTitle'))}</h2>${[1, 2].map((n) => `<details class="card" style="margin-bottom:10px"><summary><b>${esc(t(`start.faq${n}q`))}</b></summary><p class="note" style="margin-top:10px">${esc(t('start.faqPending'))}</p></details>`).join('')}
  <p class="note">${esc(t('elig.disclaimer'))}</p><p><a class="btn gold" href="#help">${esc(t('help.title'))}</a></p></section>`;
}

function help() {
  const censo = RESOURCES.find((r) => r.key === 'censo')!;
  return `<div class="title"><div class="in"><h1>${esc(t('help.title'))}</h1><p>${esc(t('help.intro'))}</p></div></div><section class="in sec"><div class="grid">${HELP_ORGS.map((o) => `<article class="card"><h3>${o.url ? `<a href="${o.url}" target="_blank" rel="noopener noreferrer">${esc(o.name)}</a>` : esc(o.name)}</h3><p class="meta">${esc(t('help.scope.' + o.scope))}</p><p><b dir="ltr">${esc(o.phone)}</b>${o.hours ? ` <span class="meta">· ${esc(o.hours)}</span>` : ''}</p></article>`).join('')}</div>
  <p class="note info">${esc(t('help.note'))} ${esc(t('help.source'))}: <a href="${HELP_SOURCE.url}" target="_blank" rel="noopener noreferrer">${esc(HELP_SOURCE.title)}</a> (${esc(t('help.checked'))} ${HELP_SOURCE.checkedOn}).</p>
  <p class="note">${esc(t('help.verify'))} <a href="${censo.url}" target="_blank" rel="noopener noreferrer">${esc(censo.name)}</a></p></section>`;
}

function guides() {
  return `<div class="title"><div class="in"><h1>${esc(t('guide.title'))}</h1><p>${esc(t('guide.timing'))}</p></div></div><section class="in sec"><ol class="steps">${Array.from({ length: 14 }, (_, i) => `<li><div><h3>${esc(t(`guide.s${i + 1}.t`))}</h3><p>${esc(t(`guide.s${i + 1}.b`))}</p></div></li>`).join('')}</ol></section>`;
}

function question() {
  const vis = QUESTIONS.filter((q) => isVisible(q, answers)); const q = vis[Math.min(qi, vis.length - 1)]; const cur = (answers as Record<string, string>)[q.code];
  let input = '';
  if (q.kind === 'country') { const dn = new Intl.DisplayNames([INTL_LOCALE[locale]], { type: 'region' }); const list = COUNTRY_CODES.map((c) => ({ c, n: dn.of(c) ?? c })).sort((a, b) => a.n.localeCompare(b.n, INTL_LOCALE[locale])); input = `<select id="ans" aria-label="${esc(t('q.' + q.code))}"><option value="">${esc(t('common.select'))}</option>${list.map((x) => `<option value="${x.c}" ${cur === x.c ? 'selected' : ''}>${esc(x.n)}</option>`).join('')}</select>`; }
  else if (q.kind === 'date') input = `<input id="ans" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${cur ?? ''}" dir="ltr">`;
  else { const opts: [string, string][] = q.kind === 'asylum' ? ASYLUM_OPTIONS.map((o) => [o, t('opt.asylum.' + o)]) : q.kind === 'permit' ? PERMIT_OPTIONS.map((o) => [o, t('opt.permit.' + o)]) : [['yes', t('common.yes')], ['no', t('common.no')], ...(q.kind === 'yesnounsure' ? [['unsure', t('common.unsure')] as [string, string]] : [])];
    input = `<div class="opts" role="radiogroup">${opts.map(([v, l]) => `<label class="opt"><input type="radio" name="ans" value="${v}" ${cur === v ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>`; }
  const help = t('q.help.' + q.code); const last = qi >= vis.length - 1;
  return `<div class="title"><div class="in"><h1>${esc(t('elig.title'))}</h1><p>${esc(t('elig.intro'))}</p></div></div><section class="in sec" style="max-width:780px"><div class="card"><div class="bar"><i style="width:${((qi + 1) / vis.length) * 100}%"></i></div>
  <p class="meta">${esc(t('elig.question'))} ${qi + 1} ${esc(t('elig.of'))} ${vis.length}${q.additional ? ' · ' + esc(t('elig.additional')) : ''}</p><h2>${esc(t('q.' + q.code))}</h2>${help !== 'q.help.' + q.code ? `<p class="pending">${esc(help)}</p>` : ''}${input}
  <div class="actions"><button class="btn" id="back" ${qi === 0 ? 'disabled' : ''}>${esc(t('common.back'))}</button><button class="btn gold" id="next">${esc(last ? t('elig.seeResults') : t('common.next'))}</button></div><p class="pending">${esc(t('elig.disclaimer'))}</p></div></section>`;
}

function card(r: PathwayResult) {
  const l = (title: string, codes: string[], pre = 'elig.code.') => codes.length ? `<h4>${esc(title)}</h4><ul>${codes.map((c) => `<li>${esc(t(pre + c))}</li>`).join('')}</ul>` : '';
  return `<article class="card bucket ${r.bucket}"><h3>${esc(t('pathway.' + r.pathway))}</h3>${l(t('elig.met'), r.met)}${l(t('elig.missing'), r.missing)}${l(t('elig.notMet'), r.notMet)}${l(t('elig.docsNeeded'), r.documents, 'doc.')}${l(t('elig.nextSteps'), r.nextSteps)}</article>`;
}
function results() {
  const res = assess(answers); const g = groupByBucket(res);
  return `<div class="title"><div class="in"><h1>${esc(t('elig.title'))}</h1></div></div><section class="in sec" style="max-width:780px"><p class="note">${esc(t('elig.disclaimer'))}</p>
  ${res.monthsInSpain !== null ? `<p class="meta">${esc(t('elig.monthsInSpain'))}: <b>${res.monthsInSpain} ${esc(t('elig.months'))}</b> · ${esc(t('common.lastVerified'))}: ${res.rulesSnapshotDate}</p>` : ''}
  ${res.results.length === 0 ? `<p class="card">${esc(t('elig.empty'))}</p>` : ''}
  ${(['eligible', 'needs_info', 'not_met'] as const).map((b) => g[b].length ? `<h2 style="margin-top:26px">${esc(t('elig.' + b))}</h2><div class="stack">${g[b].map(card).join('')}</div>` : '').join('')}
  ${(() => { const d = [...new Set(res.results.filter((x) => x.bucket !== 'not_met').flatMap((x) => x.documents))]; return d.length ? `<div class="card" style="margin-top:24px"><h2>${esc(t('checklist.title'))}</h2><p class="pending">${esc(t('checklist.hint'))}</p><div class="opts">${d.map((c) => `<label class="opt"><input type="checkbox">${esc(t('doc.' + c))}</label>`).join('')}</div></div>` : ''; })()}
  ${res.needsLawyerReview ? `<div class="card gold-b"><h3>${esc(t('elig.lawyerTitle'))}</h3><ul>${res.lawyerReviewReasons.map((x) => `<li>${esc(t('elig.reason.' + x))}</li>`).join('')}</ul></div>` : ''}
  <div class="actions"><button class="btn gold" id="restart">${esc(t('elig.restart'))}</button></div></section>`;
}

function render() {
  document.documentElement.lang = locale; document.documentElement.dir = dirOf(locale);
  const r = route(); let body: string;
  if (r === 'law') body = law(); else if (r.startsWith('law-')) body = pathway(r.slice(4)); else if (r === 'guides') body = guides(); else if (r === 'start') body = start(); else if (r === 'help') body = help();
  else if (r === 'eligibility') body = done ? results() : question(); else body = home();
  app.innerHTML = header() + `<main>${body}</main><footer class="in"><div>© MIGRA ESPAÑA — ${esc(t('footer.disclaimer'))}</div></footer>`;
  const get = () => { const el = document.getElementById('ans') as HTMLInputElement | null; if (el) return el.value; return (document.querySelector('input[name=ans]:checked') as HTMLInputElement | null)?.value ?? ''; };
  document.getElementById('lang')?.addEventListener('change', (e) => { locale = (e.target as HTMLSelectElement).value as Locale; render(); });
  document.getElementById('theme')?.addEventListener('click', () => { const d = document.documentElement; const cur = d.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); d.dataset.theme = cur === 'dark' ? 'light' : 'dark'; });
  document.getElementById('next')?.addEventListener('click', () => { const v = get(); const q = QUESTIONS.filter((x) => isVisible(x, answers)); const cq = q[Math.min(qi, q.length - 1)]; if (v) (answers as Record<string, string>)[cq.code] = v; if (qi >= q.length - 1) done = true; else qi++; render(); });
  document.getElementById('back')?.addEventListener('click', () => { qi = Math.max(0, qi - 1); render(); });
  document.getElementById('restart')?.addEventListener('click', () => { answers = {}; qi = 0; done = false; render(); });
}
addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });
render();
