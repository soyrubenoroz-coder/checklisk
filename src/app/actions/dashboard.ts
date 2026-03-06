"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats(userId: string) {
    if (!userId) {
        return {
            totalToday: 0,
            completedToday: 0,
            pendingTasks: []
        };
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay();

    // 1. Get all assignments for this user
    const assignments = await prisma.taskAssignment.findMany({
        where: {
            assignedToId: userId
        },
        include: {
            task: true,
            logs: {
                where: {
                    date: todayStr
                }
            }
        }
    });

    // 2. Filter active today
    const validAssignments = assignments.filter((assignment: any) => {
        const days = JSON.parse(assignment.daysOfWeek) as number[];
        if (!days.includes(dayOfWeek)) return false;

        const task = assignment.task;
        if (!task.isPerpetual && task.endDate) {
            const endDate = new Date(task.endDate);
            endDate.setHours(23, 59, 59, 999);
            const today = new Date();
            if (today > endDate) return false;
        }

        return true;
    });

    // 3. Calculate Stats
    const totalToday = validAssignments.length;
    const completedAssignments = validAssignments.filter((a: any) => a.logs.length > 0 && a.logs[0].status === "COMPLETED");
    const completedToday = completedAssignments.length;

    // 4. Pending Tasks (Max 3)
    const pendingTasks = validAssignments
        .filter((a: any) => a.logs.length === 0 || a.logs[0].status !== "COMPLETED")
        .slice(0, 3)
        .map((a: any) => ({
            id: a.id,
            title: a.task.title,
            duration: a.task.durationMinutes || 15
        }));

    return {
        totalToday,
        completedToday,
        pendingTasks
    };
}
