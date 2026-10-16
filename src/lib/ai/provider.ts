import { GoogleGenerativeAI } from "@google/generative-ai";

export type DamageSeverity = "NONE" | "MINOR" | "MODERATE" | "SEVERE";

export interface DamageClassification {
  severity: DamageSeverity;
  confidence: number;
  notes: string;
}

const SEVERITIES: DamageSeverity[] = ["NONE", "MINOR", "MODERATE", "SEVERE"];
// A rolling alias, not a pinned dated version — "gemini-1.5-flash" (the
// original pin) was retired by Google and started 404ing. Verified directly
// against the Gemini API that this alias resolves and this key can actually
// call it (some dated versions like gemini-2.5-flash 404 for this key even
// though they're listed by ListModels — access seems tier/key-scoped).
const MODEL_NAME = "gemini-flash-lite-latest";

// Every Gemini call falls back silently to the caller (by design — a bad key
// or an outage must never break a page). But silent meant undebuggable: a
// stale pinned model name 404ing was invisible until traced by hand. This
// logs server-side only, after the fallback has already been decided, so it
// never affects behavior — just makes "why is this using mock data" answerable
// from the server logs instead of a manual investigation.
function logGeminiFailure(fn: string, err: unknown) {
  console.error(`[gemini] ${fn} falling back to mock:`, err instanceof Error ? err.message : err);
}

// Stable (non-cryptographic) string hash so the mock path is deterministic
// across restarts and repeatable in a live demo.
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function mockClassifyDamage(photoDataUrl: string): DamageClassification {
  const hash = hashString(photoDataUrl);
  const severity = SEVERITIES[hash % SEVERITIES.length];
  const confidence = Math.round((0.55 + (hash % 41) / 100) * 100) / 100;
  return {
    severity,
    confidence,
    notes: `Mock classification (no GEMINI_API_KEY configured): estimated ${severity.toLowerCase()} damage.`,
  };
}

function extractBase64Image(photoDataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(photoDataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function parseGeminiResponse(text: string): DamageClassification | null {
  const jsonMatch = /\{[\s\S]*\}/.exec(text);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const severity = SEVERITIES.includes(parsed.severity) ? (parsed.severity as DamageSeverity) : "MODERATE";
    const confidence =
      typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7;
    const notes = typeof parsed.notes === "string" ? parsed.notes : "AI-classified damage severity.";
    return { severity, confidence, notes };
  } catch {
    return null;
  }
}

/**
 * Classifies shipment damage severity from a photo. Always attempts a real
 * Gemini call first; falls back to a deterministic mock on any failure or
 * when GEMINI_API_KEY is missing/blank.
 */
export async function classifyDamage(photoDataUrl: string): Promise<DamageClassification> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return mockClassifyDamage(photoDataUrl);
  }

  try {
    const image = extractBase64Image(photoDataUrl);
    if (!image) throw new Error("Unsupported photo data URL");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt =
      "Classify shipment package damage severity from this photo. Respond with strict JSON only, " +
      'no markdown fences: {"severity":"NONE|MINOR|MODERATE|SEVERE","confidence":0-1,"notes":"short reason"}.';

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: image.mimeType, data: image.data } },
    ]);

    const parsed = parseGeminiResponse(result.response.text());
    if (!parsed) throw new Error("Could not parse Gemini response");

    return parsed;
  } catch (err) {
    logGeminiFailure("classifyDamage", err);
    return mockClassifyDamage(photoDataUrl);
  }
}

export interface SummarizableException {
  type: string;
  description: string;
  severity?: string | null;
}

function mockSummarize({ type, description, severity }: SummarizableException): string {
  const severityPart = severity ? ` (${severity.toLowerCase()} severity)` : "";
  const trimmed = description.length > 100 ? `${description.slice(0, 97)}...` : description;
  return `${type.charAt(0)}${type.slice(1).toLowerCase()} exception${severityPart}: ${trimmed}`;
}

/**
 * Produces a short natural-language summary of an exception for triage
 * queues. Always attempts a real Gemini call first; falls back to a
 * deterministic rule-based summary on any failure or missing API key.
 */
export async function summarize(exception: SummarizableException): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return mockSummarize(exception);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt =
      "Summarize this delivery exception in one short sentence (under 25 words) for a " +
      "warehouse triage queue. Respond with plain text only, no markdown.\n" +
      `Type: ${exception.type}\n` +
      `Severity: ${exception.severity ?? "unknown"}\n` +
      `Description: ${exception.description}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty Gemini response");

    return text;
  } catch (err) {
    logGeminiFailure("summarize", err);
    return mockSummarize(exception);
  }
}

export interface PatternFacts {
  dimension: "driver" | "carrier" | "route" | "warehouse";
  label: string;
  count: number;
  windowDays: number;
  topType: string;
}

function mockPhraseInsight({ dimension, label, count, windowDays, topType }: PatternFacts): string {
  return (
    `${label} has ${count} exceptions in the last ${windowDays} days, mostly ${topType.toLowerCase()} ` +
    `— a repeated pattern worth investigating at the ${dimension} level.`
  );
}

/**
 * Phrases a rule-detected exception pattern (driver/carrier/route/warehouse
 * grouping exceeding a threshold) as a short natural-language insight. The
 * *facts* (which group, how many, over what window) are always rule-computed
 * — Gemini only phrases them. Falls back to a deterministic template.
 */
export async function phraseInsight(facts: PatternFacts): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return mockPhraseInsight(facts);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt =
      "Phrase this repeated delivery-exception pattern as one short, plain-English insight " +
      "(under 30 words) for a regional operations manager. Respond with plain text only, no markdown.\n" +
      `Grouping: ${facts.dimension}\n` +
      `Name: ${facts.label}\n` +
      `Exception count: ${facts.count}\n` +
      `Window: last ${facts.windowDays} days\n` +
      `Most common exception type: ${facts.topType}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty Gemini response");

    return text;
  } catch (err) {
    logGeminiFailure("phraseInsight", err);
    return mockPhraseInsight(facts);
  }
}

export interface RecommendationFacts {
  recommendationType: string;
  details: string;
  exceptionType: string;
  severity: string | null;
  slaStatus: string;
}

function mockJustifyRecommendation(facts: RecommendationFacts): string {
  return `${facts.details} (based on a ${facts.exceptionType.toLowerCase()} exception${
    facts.severity ? ` with ${facts.severity.toLowerCase()} severity` : ""
  }${facts.slaStatus === "BREACHED" ? " that has breached SLA" : ""}).`;
}

/**
 * Writes a 1-sentence justification for an already-chosen recommendation
 * type. The type/details are always decided by the deterministic rule engine
 * in lib/ai/recommend.ts — Gemini only phrases why it makes sense.
 */
export async function justifyRecommendation(facts: RecommendationFacts): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return mockJustifyRecommendation(facts);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt =
      "Write one short, confident sentence (under 25 words) justifying this delivery-exception " +
      "recommendation to a warehouse manager. Respond with plain text only, no markdown.\n" +
      `Recommendation: ${facts.recommendationType} — ${facts.details}\n` +
      `Exception type: ${facts.exceptionType}\n` +
      `Severity: ${facts.severity ?? "unknown"}\n` +
      `SLA status: ${facts.slaStatus}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty Gemini response");

    return text;
  } catch (err) {
    logGeminiFailure("justifyRecommendation", err);
    return mockJustifyRecommendation(facts);
  }
}

// Internal identifiers (cuids, raw grouping keys) aren't meaningful to a
// person reading a chat answer — drop them from the fallback table rather
// than dumping them raw.
function isInternalIdColumn(column: string): boolean {
  return column === "key" || /Ids?$/.test(column);
}

function formatValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return String(value.length);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ");
  }
  return String(value);
}

const MAX_FALLBACK_ROWS = 5;

/** Formats an arbitrary query result as plain text — the "never fail silently" chatbot fallback. */
function formatDataAsText(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return "No results.";
    if (typeof data[0] === "object" && data[0] !== null) {
      const allRows = data as Record<string, unknown>[];
      const columns = Object.keys(allRows[0]).filter((col) => !isInternalIdColumn(col));
      const rows = allRows.slice(0, MAX_FALLBACK_ROWS);
      const header = columns.join(" | ");
      const separator = columns.map(() => "---").join(" | ");
      const body = rows.map((row) => columns.map((col) => formatValue(row[col])).join(" | ")).join("\n");
      const table = `${header}\n${separator}\n${body}`;
      return allRows.length > rows.length
        ? `${table}\n\n(showing ${rows.length} of ${allRows.length})`
        : table;
    }
    return data.map((v) => `- ${formatValue(v)}`).join("\n");
  }
  if (typeof data === "object" && data !== null) {
    return Object.entries(data as Record<string, unknown>)
      .filter(([key]) => !isInternalIdColumn(key))
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join("\n");
  }
  return String(data);
}

/**
 * Phrases a scoped Prisma query result as a natural-language chat answer.
 * The data itself is always produced by a role-scoped query chosen before
 * this is called — Gemini only phrases it. On any failure, falls back to a
 * formatted plain-text table/list of the raw data (never fails silently).
 */
export async function answerChatQuery(question: string, data: unknown): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return formatDataAsText(data);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt =
      "Answer this operations question in 1-3 short sentences using ONLY the data provided below. " +
      "Do not invent numbers not present in the data. Respond with plain text only, no markdown.\n" +
      `Question: ${question}\n` +
      `Data (JSON): ${JSON.stringify(data)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty Gemini response");

    return text;
  } catch (err) {
    logGeminiFailure("answerChatQuery", err);
    return formatDataAsText(data);
  }
}
