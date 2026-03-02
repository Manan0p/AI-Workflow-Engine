import { z } from "zod";

export const WorkflowSchema = z.object({
  trigger: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      condition: z.string().optional()
    })
  )
});