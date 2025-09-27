import { analyze } from "@/shared/similarity";

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const originalEl = $("#original") as HTMLTextAreaElement;
const similarEl = $("#similar") as HTMLTextAreaElement;
const metricsEl = $("#metrics");
const highlightedEl = $("#highlighted");

function percent(n: number) { return (n * 100).toFixed(1) + "%"; }

function renderMetrics(a: ReturnType<typeof analyze>) {
  metricsEl.innerHTML = `
    <h3>Métricas</h3>
    <div class="metric-grid">
      <div class="metric highlight"><div class="label">Similaridade geral</div><div class="value">${percent(a.overallSimilarity)}</div></div>
      <div class="metric"><div class="label">Cobertura (texto similar)</div><div class="value">${percent(a.coverageSimilarChars)}</div></div>
      <div class="metric"><div class="label">Cobertura (texto original)</div><div class="value">${percent(a.coverageOriginalChars)}</div></div>
      <div class="metric"><div class="label">LCS (tokens)</div><div class="value">${percent(a.lcsTokenMatch)}</div></div>
      <div class="metric"><div class="label">Jaccard 3-gram</div><div class="value">${percent(a.jaccard3gram)}</div></div>
      <div class="metric"><div class="label">Cosseno (TF)</div><div class="value">${percent(a.cosineTF)}</div></div>
      <div class="metric"><div class="label">Coef. Overlap</div><div class="value">${percent(a.overlapCoef)}</div></div>
      <div class="metric"><div class="label">Levenshtein (tokens)</div><div class="value">${percent(a.levenshteinToken)}</div></div>
    </div>
    ${renderBadge(a.overallSimilarity)}
  `;
}

function renderBadge(score: number) {
  let level = "BAIXA";
  let cls = "badge-low";
  if (score >= 0.75) { level = "ALTA"; cls = "badge-high"; }
  else if (score >= 0.45) { level = "MEDIA"; cls = "badge-medium"; }
  return `<div class="overall-badge ${cls}">Similaridade ${level}</div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

function renderHighlights(similar: string, a: ReturnType<typeof analyze>) {
  if (!similar) { highlightedEl.innerHTML = ""; return; }
  const segments = [...a.alignedSegments].sort((x: { start: number }, y: { start: number }) => x.start - y.start);
  let out = "";
  let pos = 0;
  for (const seg of segments) {
    if (seg.start > pos) {
      out += escapeHtml(similar.slice(pos, seg.start));
    }
  let cls: string;
  if (seg.kind === "exact") cls = "hl-exact";
  else if (seg.kind === "high") cls = "hl-high";
  else if (seg.kind === "medium") cls = "hl-medium";
  else cls = "hl-low";
    out += `<span class="${cls}">` + escapeHtml(similar.slice(seg.start, seg.end)) + `</span>`;
    pos = seg.end;
  }
  if (pos < similar.length) out += escapeHtml(similar.slice(pos));
  highlightedEl.innerHTML = out;
}

function analyzeNow() {
  const original = originalEl.value;
  const similar = similarEl.value;
  const res = analyze(original, similar);
  renderMetrics(res);
  renderHighlights(similar, res);
}

function debounce<T extends (...args: any[]) => any>(fn: T, ms = 200) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const onInput = debounce(analyzeNow, 200);
originalEl.addEventListener("input", onInput);
similarEl.addEventListener("input", onInput);

// Example text for quick demo
originalEl.value = "O rápido marrom raposa pula sobre o cão preguiçoso. Este é um exemplo de texto para teste.";
similarEl.value = "A raposa marrom rápida saltou sobre um cachorro preguiçoso. Este é um texto de teste.";
analyzeNow();
