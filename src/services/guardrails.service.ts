/**
 * Guardrails Service — EEO-safe mode, do-not-ask topics, jailbreak and toxicity detection.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrgGuardrails {
  eeoSafeMode: boolean;
  doNotAskTopics: string[];
  toxicityTerminateOnHigh: boolean;
}

export interface GuardrailCheckResult {
  promptInjection: { detected: boolean; reason?: string };
  toxicity: { level: "none" | "low" | "medium" | "high"; reason?: string };
}

export interface TranscriptGuardrailResult {
  violations: Array<{
    turnIndex: number;
    role: "user" | "assistant";
    type: "prompt_injection" | "toxicity";
    severity: "low" | "medium" | "high";
    reason: string;
  }>;
  shouldTerminate: boolean;
}

// ---------------------------------------------------------------------------
// EEO default do-not-ask topics (when eeoSafeMode is true)
// ---------------------------------------------------------------------------

export const EEO_DEFAULT_TOPICS = [
  "age",
  "date of birth",
  "race",
  "ethnicity",
  "national origin",
  "religion",
  "religious beliefs",
  "political affiliation",
  "marital status",
  "family plans",
  "pregnancy",
  "disability",
  "sexual orientation",
  "gender identity",
  "salary history",
  "citizenship status",
  "arrest record",
  "credit score",
];

// ---------------------------------------------------------------------------
// Build system instruction block for do-not-ask / EEO
// ---------------------------------------------------------------------------

export function buildDoNotAskInstruction(guardrails: OrgGuardrails): string {
  const topics: string[] =
    Array.isArray(guardrails.doNotAskTopics) && guardrails.doNotAskTopics.length > 0
      ? guardrails.doNotAskTopics
      : guardrails.eeoSafeMode
        ? EEO_DEFAULT_TOPICS
        : [];

  if (topics.length === 0) return "";

  const list = topics.map((t) => `- ${t}`).join("\n");
  return [
    "",
    "═══════════════════════════════════════",
    "COMPLIANCE — DO NOT ASK (STRICT)",
    "═══════════════════════════════════════",
    "You MUST NOT ask the candidate about, or make assumptions based on, any of the following topics. If the candidate volunteers such information, acknowledge briefly and steer the conversation back to job-related questions only.",
    list,
    "Do not ask follow-up questions about these topics. Keep the interview strictly job- and competency-based.",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Prompt injection detection (jailbreak resistance)
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i, reason: "Instruction override" },
  { pattern: /disregard\s+(your\s+)?(instructions?|system\s+prompt)/i, reason: "Instruction override" },
  { pattern: /you\s+are\s+now\s+/i, reason: "Role reassignment" },
  { pattern: /act\s+as\s+(if\s+)?(you\s+are\s+)?/i, reason: "Role reassignment" },
  { pattern: /pretend\s+(to\s+be|you\s+are)/i, reason: "Role reassignment" },
  { pattern: /system\s*:\s*|\[system\]|<\s*system\s*>/i, reason: "System prompt injection" },
  { pattern: /\[INST\]|\[/i, reason: "Prompt format injection" },
  { pattern: /jailbreak|bypass\s+(your\s+)?(safety|restrictions)/i, reason: "Jailbreak attempt" },
  { pattern: /reveal\s+(your\s+)?(system\s+)?prompt|show\s+(me\s+)?(your\s+)?instructions?/i, reason: "Prompt extraction" },
  { pattern: /new\s+instructions?\s*:\s*/i, reason: "Instruction injection" },
  { pattern: /human\s*:\s*.*(assistant|AI)\s*:\s*/i, reason: "Dialogue injection" },
  { pattern: /<\/?\s*system\s*>/i, reason: "XML-style injection" },
];

export function detectPromptInjection(text: string): { detected: boolean; reason?: string } {
  if (!text || typeof text !== "string") return { detected: false };
  const normalized = text.trim();
  if (normalized.length < 10) return { detected: false };

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) return { detected: true, reason };
  }
  return { detected: false };
}

// ---------------------------------------------------------------------------
// Toxicity / harassment detection (keyword + heuristic)
// ---------------------------------------------------------------------------

const TOXICITY_HIGH = [
  "kill", "murder", "rape", "abuse", "threat", "threaten", "harass", "harassment",
  "hate you", "hate speech", "slur", "racist", "sexist", "violent",
];
const TOXICITY_MEDIUM = [
  "stupid", "idiot", "dumb", "worthless", "pathetic", "shut up", "shut up",
  "disgusting", "hate", "terrible person", "worst", "ugly", "fat",
];
const TOXICITY_LOW = [
  "bad", "suck", "sucks", "annoying", "ridiculous",
];

function getToxicityLevel(text: string): "none" | "low" | "medium" | "high" {
  if (!text || typeof text !== "string") return "none";
  const lower = text.toLowerCase();
  for (const w of TOXICITY_HIGH) {
    if (lower.includes(w)) return "high";
  }
  for (const w of TOXICITY_MEDIUM) {
    if (lower.includes(w)) return "medium";
  }
  for (const w of TOXICITY_LOW) {
    if (lower.includes(w)) return "low";
  }
  return "none";
}

export function detectToxicity(text: string): { level: "none" | "low" | "medium" | "high"; reason?: string } {
  const level = getToxicityLevel(text);
  if (level === "none") return { level };
  return { level, reason: "Detected language that may be unprofessional or harassing." };
}

// ---------------------------------------------------------------------------
// Run guardrails on full transcript (user turns only for injection/toxicity)
// ---------------------------------------------------------------------------

export function checkTranscriptGuardrails(
  transcript: Array<{ role: string; text: string }>,
  toxicityTerminateOnHigh: boolean,
): TranscriptGuardrailResult {
  const violations: TranscriptGuardrailResult["violations"] = [];
  let shouldTerminate = false;

  transcript.forEach((entry, i) => {
    if (entry.role !== "user") return;
    const text = entry.text || "";

    const inj = detectPromptInjection(text);
    if (inj.detected) {
      violations.push({
        turnIndex: i,
        role: "user",
        type: "prompt_injection",
        severity: "high",
        reason: inj.reason ?? "Possible prompt injection",
      });
      shouldTerminate = true;
    }

    const tox = detectToxicity(text);
    if (tox.level !== "none") {
      const severity = tox.level === "high" ? "high" : tox.level === "medium" ? "medium" : "low";
      violations.push({
        turnIndex: i,
        role: "user",
        type: "toxicity",
        severity,
        reason: tox.reason ?? `Toxicity level: ${tox.level}`,
      });
      if (toxicityTerminateOnHigh && tox.level === "high") shouldTerminate = true;
    }
  });

  return { violations, shouldTerminate };
}
