import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureUserProfile } from "@/lib/user";
import { prisma } from "@/lib/prisma";

type TaskInput = {
  title: string;
  description?: string;
  type: "homework" | "exam" | "project" | "reading" | "quiz" | "other";
  dueDate: string | null;
  estimatedMinutes: number;
  courseId?: string;
};

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabaseUser = await requireUser();
    const user = await ensureUserProfile(supabaseUser.id, supabaseUser.email);

    // Parse request body
    const body = await req.json();
    const { tasks } = body as { tasks: TaskInput[] };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "Tasks array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate tasks
    for (const task of tasks) {
      if (!task.title || typeof task.title !== "string") {
        return NextResponse.json(
          { error: "Each task must have a title" },
          { status: 400 }
        );
      }

      if (!task.type || !["homework", "exam", "project", "reading", "quiz", "other"].includes(task.type)) {
        return NextResponse.json(
          { error: "Each task must have a valid type" },
          { status: 400 }
        );
      }

      if (typeof task.estimatedMinutes !== "number" || task.estimatedMinutes <= 0) {
        return NextResponse.json(
          { error: "Each task must have a valid estimatedMinutes (positive number)" },
          { status: 400 }
        );
      }
    }

    // Create tasks in database
    const createdTasks = await Promise.all(
      tasks.map(async (task) => {
        // Validate courseId if provided
        if (task.courseId) {
          const course = await prisma.course.findFirst({
            where: {
              id: task.courseId,
              userId: user.id,
            },
          });

          if (!course) {
            throw new Error(`Course not found: ${task.courseId}`);
          }
        }

        // Create the task
        return prisma.task.create({
          data: {
            userId: user.id,
            title: task.title,
            description: task.description || "",
            type: task.type,
            dueAt: task.dueDate ? new Date(task.dueDate) : null,
            estimatedMinutes: task.estimatedMinutes,
            courseId: task.courseId || null,
            createdFrom: "syllabus",
            status: "todo",
            atRisk: false,
          },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error) {
    console.error("Error creating tasks:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create tasks",
      },
      { status: 500 }
    );
  }
}
