import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { scoreResume } from "../utils/resume-scoring.js";

const parseResultSchema = z.object({
  aiMatchScore: z.number().min(0).max(100),
  aiSummary: z.string().min(1),
  extractedSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([])
});

interface ResumeParseInput {
  requiredSkills: string[];
  resumeText: string | null;
}

function buildFallback(input: ResumeParseInput) {
  return scoreResume(input.requiredSkills, input.resumeText);
}

async function parseWithOpenAI(input: ResumeParseInput) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an HR resume parsing assistant. Return valid JSON only with keys aiMatchScore, aiSummary, extractedSkills, strengths, gaps."
        },
        {
          role: "user",
          content: JSON.stringify({
            requiredSkills: input.requiredSkills,
            resumeText: (input.resumeText ?? "").slice(0, 16000)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty completion");
  }

  const parsed = parseResultSchema.parse(JSON.parse(content));
  return {
    aiMatchScore: Math.round(parsed.aiMatchScore),
    aiSummary: parsed.aiSummary,
    extractedSkills: Array.from(
      new Set(parsed.extractedSkills.map((skill) => skill.trim()).filter(Boolean))
    ),
    strengths: parsed.strengths.map((value) => value.trim()).filter(Boolean),
    gaps: parsed.gaps.map((value) => value.trim()).filter(Boolean)
  };
}

export async function parseResumeAgainstJob(input: ResumeParseInput) {
  if (!input.resumeText?.trim()) {
    return buildFallback(input);
  }

  if (!env.OPENAI_API_KEY) {
    return buildFallback(input);
  }

  try {
    return await parseWithOpenAI(input);
  } catch (error) {
    logger.warn("OpenAI resume parsing failed, falling back to heuristic scoring", error);
    return buildFallback(input);
  }
}
