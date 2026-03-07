"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getTasksForMember(memberId: string, dateStr: string) {
    if (!memberId) return [];

    // Correctly parse local date without UTC shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0-6 (Sun-Sat)

    // Find all assignments for this user
    const assignments = await prisma.taskAssignment.findMany({
        where: {
            assignedToId: memberId,
        },
        include: {
            task: true,
            logs: {
                where: {
                    date: dateStr
                }
            }
        }
    });

    // Filter by daysOfWeek and isPerpetual / endDate
    const validAssignments = assignments.filter((assignment: any) => {
        const days = JSON.parse(assignment.daysOfWeek) as number[];
        if (!days.includes(dayOfWeek)) return false;

        const task = assignment.task;
        if (!task.isPerpetual && task.endDate) {
            // Compare date strings YYYY-MM-DD to avoid timezone shifts
            const taskEndStr = task.endDate.toISOString().split('T')[0];
            if (dateStr > taskEndStr) return false;
        }

        return true;
    });

    return validAssignments.map((assignment: any) => ({
        id: assignment.id,
        taskId: assignment.task.id,
        title: assignment.task.title,
        duration: assignment.task.durationMinutes || 15,
        completed: assignment.logs.length > 0 && assignment.logs[0].status === "COMPLETED",
    }));
}

export async function toggleTaskComplete(assignmentId: string, date: string, _completedById: string, currentlyCompleted: boolean) {
    // Resolve completedById: try server session first, then client param, then the assignment's own user
    let completedById = _completedById;

    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            completedById = session.user.id;
        }
    } catch (e) {
        // Session fetch failed, continue with fallback
    }

    // Ultimate fallback: use the assignment's own assignedToId
    if (!completedById) {
        const assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId },
            select: { assignedToId: true }
        });
        completedById = assignment?.assignedToId || '';
    }

    if (currentlyCompleted) {
        // Delete log if it was already completed (toggle off)
        await prisma.taskLog.deleteMany({
            where: {
                assignmentId,
                date
            }
        });
    } else {
        // Create log if it wasn't completed (toggle on)
        await prisma.taskLog.create({
            data: {
                assignmentId,
                completedById,
                date,
                status: "COMPLETED"
            }
        });
    }

    revalidatePath('/tasks/today');
    revalidatePath('/dashboard');
}

export async function createTask(data: {
    title: string;
    category: string;
    durationMinutes: number;
    isPerpetual: boolean;
    endDate?: string;
    daysOfWeek: number[];
    assignedToIds: string[];
}) {
    try {
        const { title, category, durationMinutes, isPerpetual, endDate, daysOfWeek, assignedToIds } = data;

        // 1. Create the base Task
        let parsedEndDate = null;
        if (!isPerpetual && endDate && endDate.trim() !== "") {
            // Save as noon UTC to ensure consistent ISO date string retrieval
            const d = new Date(`${endDate}T12:00:00Z`);
            if (!isNaN(d.getTime())) {
                parsedEndDate = d;
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                category,
                durationMinutes,
                isPerpetual,
                endDate: parsedEndDate,
            }
        });

        // 2. Assign the task to the selected family members
        if (assignedToIds && assignedToIds.length > 0) {
            const assignmentsData = assignedToIds.map(userId => ({
                taskId: task.id,
                assignedToId: userId,
                daysOfWeek: JSON.stringify(daysOfWeek),
            }));

            await prisma.taskAssignment.createMany({
                data: assignmentsData
            });
        }

        revalidatePath('/dashboard');
        revalidatePath('/family');
        revalidatePath('/tasks/today');

        return { success: true, task };
    } catch (error: any) {
        console.error("Error creating task:", error);
        return { success: false, error: error.message || "Failed to create task" };
    }
}

export async function deleteTask(taskId: string) {
    try {
        await prisma.task.delete({
            where: { id: taskId }
        });
        revalidatePath('/dashboard');
        revalidatePath('/family');
        revalidatePath('/tasks/today');
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { success: false, error: "No se pudo borrar la tarea" };
    }
}
export async function getAllTasks() {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                assignments: {
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                                gender: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return tasks.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            duration: t.durationMinutes,
            isPerpetual: t.isPerpetual,
            endDate: t.endDate ? t.endDate.toISOString().split('T')[0] : null,
            assignments: t.assignments.map(a => ({
                id: a.id,
                userId: a.assignedTo.id,
                userName: a.assignedTo.name,
                userAvatar: a.assignedTo.avatarUrl,
                userGender: a.assignedTo.gender,
                days: JSON.parse(a.daysOfWeek) as number[]
            }))
        }));
    } catch (error) {
        console.error("Error fetching all tasks:", error);
        return [];
    }
}
