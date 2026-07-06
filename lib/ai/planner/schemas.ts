import { z } from "zod";

export const plannerSchema = z.object({
  agent: z.enum(["analytics", "content", "both"]),
  reasoning: z.string().describe("Explanation for choosing this agentic path."),
});

export type PlannerResponse = z.infer<typeof plannerSchema>;
