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
            const endDate = new Date(task.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (date > endDate) return false;
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
        const task = await prisma.task.create({
            data: {
                title,
                category,
                durationMinutes,
                isPerpetual,
                endDate: endDate ? new Date(endDate) : null,
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
    } catch (error) {
        console.error("Error creating task:", error);
        return { success: false, error: "Failed to create task" };
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
