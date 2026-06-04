export function scoreResume(requiredSkills: string[], resumeText: string | null) {
  const normalized = (resumeText ?? "").toLowerCase();
  const extractedSkills = requiredSkills.filter((skill) => normalized.includes(skill.toLowerCase()));
  const gaps = requiredSkills.filter((skill) => !extractedSkills.includes(skill));
  const aiMatchScore =
    requiredSkills.length === 0 ? 0 : Math.round((extractedSkills.length / requiredSkills.length) * 100);

  return {
    extractedSkills,
    gaps,
    strengths: extractedSkills.map((skill) => `Relevant evidence for ${skill}`),
    aiSummary:
      aiMatchScore >= 75
        ? "Strong alignment with the role based on submitted resume content."
        : "Partial alignment detected; recruiter review recommended.",
    aiMatchScore
  };
}
