import { describe, expect, it } from "vitest";
import { createAssignmentSchema, gradeSubmissionSchema } from "./schemas";

describe("assignment schemas", () => {
  it("accepts a valid create payload", () => {
    const parsed = createAssignmentSchema.safeParse({
      courseId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Problem set 1",
      description: "",
      dueAt: "",
      published: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid grades", () => {
    const parsed = gradeSubmissionSchema.safeParse({
      submissionId: "550e8400-e29b-41d4-a716-446655440000",
      grade: 150,
      feedback: "",
    });
    expect(parsed.success).toBe(false);
  });
});

