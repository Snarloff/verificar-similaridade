// Similarity and highlighting utilities

export type Token = {
  text: string;
  norm: string; // normalized for matching
  start: number; // char offset in original string
  end: number; // exclusive
  idx: number; // token index in its sequence
};

export type Analysis = {
  coverageSimilarChars: number; // percent of similar text chars covered by matches
  coverageOriginalChars: number; // percent of original text chars covered by matches
  lcsTokenMatch: number; // percent tokens in LCS over max(lenA, lenB)
  jaccard3gram: number; // Jaccard similarity over 3-grams of tokens
  cosineTF: number; // Cosine similarity using token TF
  overlapCoef: number; // Overlap coefficient on set of tokens
  levenshteinToken: number; // Normalized similarity based on token-level Levenshtein distance
  overallSimilarity: number; // Conservative overall similarity taking all metrics into account
  alignedSegments: Array<{
    start: number; // char start in similar text
    end: number; // char end in similar text
    kind: "exact" | "high" | "medium" | "low";
  }>;
};

// Basic normalization: lower, trim, collapse spaces, remove diacritics.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokenize: split by words but preserve char offsets; include punctuation as tokens to align visible text
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let idx = 0;
  const re = /(\p{L}+|\p{N}+|\S)/gu; // words, numbers, or single non-space symbol
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const text = m[0];
    const start = m.index;
    const end = start + text.length;
    tokens.push({
      text,
      norm: normalize(text),
      start,
      end,
      idx: idx++,
    });
  }
  return tokens;
}

// LCS on normalized token strings. Returns pairs of indices (aIdx, bIdx) that are in LCS
export function lcsMatch(a: Token[], b: Token[]): Array<{ a: number; b: number }> {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i].norm === b[j].norm) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: Array<{ a: number; b: number }> = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i].norm === b[j].norm) {
      pairs.push({ a: i, b: j });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return pairs;
}

// Group consecutive LCS matches in the similar text into segments and label strength by local density/context
export function segmentsFromMatches(a: Token[], b: Token[], pairs: Array<{ a: number; b: number }>): Analysis["alignedSegments"] {
  const segments: Analysis["alignedSegments"] = [];
  if (pairs.length === 0) return segments;
  // Build contiguous ranges by b indices
  let segStart = pairs[0].b;
  let segEnd = segStart;
  let lastA = pairs[0].a;
  let lastB = pairs[0].b;
  const ranges: Array<{ bStart: number; bEnd: number; aStart: number; aEnd: number; count: number }>
    = [];
  for (let k = 1; k < pairs.length; k++) {
    const { a: ai, b: bi } = pairs[k];
    if (bi === lastB + 1 && ai === lastA + 1) {
      segEnd = bi;
    } else {
      ranges.push({ bStart: segStart, bEnd: segEnd, aStart: lastA - (segEnd - segStart), aEnd: lastA, count: segEnd - segStart + 1 });
      segStart = bi;
      segEnd = bi;
    }
    lastA = ai; lastB = bi;
  }
  ranges.push({ bStart: segStart, bEnd: segEnd, aStart: lastA - (segEnd - segStart), aEnd: lastA, count: segEnd - segStart + 1 });
  
  // Precompute matched set for b
  const matchedB = new Set<number>(pairs.map(p => p.b));
  function scoreAround(i0: number, i1: number): number {
    const window = 2;
    let total = 0, hit = 0;
    for (let i = i0 - window; i <= i1 + window; i++) {
      if (i < 0 || i >= b.length) continue;
      total++;
      if (matchedB.has(i)) hit++;
    }
    return total ? hit / total : 1;
  }

  function classify(score: number): Analysis["alignedSegments"][number]["kind"] {
    if (score > 0.95) return "exact";
    if (score > 0.7) return "high";
    if (score > 0.4) return "medium";
    return "low";
  }

  for (const r of ranges) {
    const s = scoreAround(r.bStart, r.bEnd);
    const kind = classify(s);
    const start = b[r.bStart].start;
    const end = b[r.bEnd].end;
    segments.push({ start, end, kind });
  }
  return segments;
}

// 3-gram set from normalized tokens
function ngrams(tokens: Token[], n = 3): string[] {
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).map(t => t.norm).join(" "));
  }
  return grams;
}

// Jaccard over set of ngrams
function jaccard(a: string[], b: string[]): number {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  if (union === 0) {
    return (A.size === 0 && B.size === 0) ? 1 : 0;
  }
  return inter / union;
}

// Cosine similarity using token TF (norm tokens)
function cosineTF(a: Token[], b: Token[]): number {
  const fa = new Map<string, number>();
  const fb = new Map<string, number>();
  for (const t of a) fa.set(t.norm, (fa.get(t.norm) ?? 0) + 1);
  for (const t of b) fb.set(t.norm, (fb.get(t.norm) ?? 0) + 1);
  let dot = 0, na = 0, nb = 0;
  for (const [k, va] of fa) {
    const vb = fb.get(k) ?? 0;
    dot += va * vb;
    na += va * va;
  }
  for (const [, vb] of fb) nb += vb * vb;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Overlap coefficient on token sets
function overlapCoef(a: Token[], b: Token[]): number {
  const A = new Set(a.map(t => t.norm));
  const B = new Set(b.map(t => t.norm));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const denom = Math.min(A.size, B.size) || 1;
  return inter / denom;
}

// Levenshtein distance between arrays of strings (tokens), returns normalized similarity in [0,1]
function levenshteinSimilarityTokens(a: Token[], b: Token[]): number {
  const A = a.map(t => t.norm);
  const B = b.map(t => t.norm);
  const n = A.length, m = B.length;
  if (n === 0 && m === 0) return 1;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[n][m];
  const maxLen = Math.max(n, m) || 1;
  return 1 - dist / maxLen;
}

export function analyze(original: string, similar: string): Analysis {
  const a = tokenize(original);
  const b = tokenize(similar);
  const pairs = lcsMatch(a, b);
  const alignedSegments = segmentsFromMatches(a, b, pairs);

  // Character coverage in each text
  let coveredSimilar = 0;
  const coveredB: boolean[] = Array(similar.length).fill(false);
  for (const seg of alignedSegments) for (let i = seg.start; i < seg.end; i++) coveredB[i] = true;
  coveredSimilar = coveredB.reduce((acc, v) => acc + (v ? 1 : 0), 0);

  let coveredOriginal = 0;
  const matchedA = new Set<number>(pairs.map(p => p.a));
  // cover exact tokens (approximate original coverage)
  for (const idx of matchedA) {
    const t = a[idx];
    coveredOriginal += t.end - t.start;
  }

  const coverageSimilarChars = similar.length ? coveredSimilar / similar.length : 0;
  const coverageOriginalChars = original.length ? coveredOriginal / original.length : 0;

  const lcsTokenMatch = (pairs.length) / Math.max(1, Math.max(a.length, b.length));
  const j3 = jaccard(ngrams(a, 3), ngrams(b, 3));
  const cos = cosineTF(a, b);
  const ov = overlapCoef(a, b);
  const levTok = levenshteinSimilarityTokens(a, b);

  // Conservative overall similarity: weighted average penalized by dispersion
  const metrics = {
    coverageSimilarChars,
    coverageOriginalChars,
    lcsTokenMatch,
    jaccard3gram: j3,
    cosineTF: cos,
    overlapCoef: ov,
    levenshteinToken: levTok,
  };
  // Weights sum to 1
  const w = {
    coverageSimilarChars: 0.25,
    coverageOriginalChars: 0.15,
    lcsTokenMatch: 0.20,
    jaccard3gram: 0.15,
    cosineTF: 0.10,
    overlapCoef: 0.05,
    levenshteinToken: 0.10,
  } as const;
  const weighted = (
    metrics.coverageSimilarChars * w.coverageSimilarChars +
    metrics.coverageOriginalChars * w.coverageOriginalChars +
    metrics.lcsTokenMatch * w.lcsTokenMatch +
    metrics.jaccard3gram * w.jaccard3gram +
    metrics.cosineTF * w.cosineTF +
    metrics.overlapCoef * w.overlapCoef +
    metrics.levenshteinToken * w.levenshteinToken
  );
  const vals = Object.values(metrics);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals, 0.0001);
  // Penalize dispersion: if metrics disagree, reduce score; baseline keeps some robustness
  const dispersionPenalty = Math.max(0.7, minV / maxV); // in [0.7,1]
  const overallSimilarity = Math.max(0, Math.min(1, weighted * dispersionPenalty));

  return {
    coverageSimilarChars,
    coverageOriginalChars,
    lcsTokenMatch,
    jaccard3gram: j3,
    cosineTF: cos,
    overlapCoef: ov,
    levenshteinToken: levTok,
    overallSimilarity,
    alignedSegments,
  };
}
