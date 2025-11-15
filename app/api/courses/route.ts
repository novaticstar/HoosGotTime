import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureUserProfile } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabaseUser = await requireUser();
    const user = await ensureUserProfile(supabaseUser.id, supabaseUser.email);

    // Fetch user's courses
    const courses = await prisma.course.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        difficulty: true,
        meetings: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            building: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}
