import "server-only";
import { prisma } from "@/lib/db/prisma";
import { listAssignmentsForCourse, listSubmissionsForAssignment } from "@/services/assignments";
import { getAttempt, listAssessmentsForCourse } from "@/services/assessments";
import type { AssignmentListItem } from "@/features/assignments/assignments-panel";
import type { AssessmentListItem } from "@/features/assessments/assessments-panel";

export async function loadCourseLearningPanels(input: {
  courseId: string;
  institutionId: string;
  viewerUserId: string;
  includeSubmissions: boolean;
  includeQuestionsForTake: boolean;
}) {
  const [rawAssignments, rawAssessments] = await Promise.all([
    listAssignmentsForCourse(input.courseId, input.institutionId),
    listAssessmentsForCourse(input.courseId, input.institutionId),
  ]);

  const assignments: AssignmentListItem[] = await Promise.all(
    rawAssignments.map(async (a) => {
      const mySubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_userId: {
            assignmentId: a.id,
            userId: input.viewerUserId,
          },
        },
      });

      let submissions: AssignmentListItem["submissions"];
      if (input.includeSubmissions) {
        const rows = await listSubmissionsForAssignment(a.id, input.institutionId);
        submissions = rows.map((s) => ({
          id: s.id,
          userName: s.user.fullName,
          textContent: s.textContent,
          grade: s.grade,
          feedback: s.feedback,
          submittedAt: s.submittedAt.toISOString(),
        }));
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        dueAt: a.dueAt?.toISOString() ?? null,
        published: a.published,
        submissionCount: a._count.submissions,
        mySubmission: mySubmission
          ? {
              id: mySubmission.id,
              textContent: mySubmission.textContent,
              grade: mySubmission.grade,
              feedback: mySubmission.feedback,
              submittedAt: mySubmission.submittedAt.toISOString(),
            }
          : null,
        submissions,
      };
    }),
  );

  const assessments: AssessmentListItem[] = await Promise.all(
    rawAssessments.map(async (a) => {
      const myAttempt = await getAttempt(a.id, input.viewerUserId);
      let questions: AssessmentListItem["questions"];

      if (input.includeQuestionsForTake && a.published && !myAttempt) {
        const full = await prisma.assessmentQuestion.findMany({
          where: { assessmentId: a.id },
          orderBy: { sortOrder: "asc" },
        });
        questions = full.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          options: Array.isArray(q.options)
            ? (q.options as string[])
            : null,
          points: q.points,
        }));
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        published: a.published,
        questionCount: a._count.questions,
        attemptCount: a._count.attempts,
        myAttempt: myAttempt
          ? {
              score: myAttempt.score,
              maxScore: myAttempt.maxScore,
              submittedAt: myAttempt.submittedAt.toISOString(),
            }
          : null,
        questions,
      };
    }),
  );

  return { assignments, assessments };
}
