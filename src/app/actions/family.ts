"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFamilyMembers() {
    try {
        const members = await prisma.user.findMany({
            orderBy: { role: 'asc' } // ADMIN first, then MEMBER
        });
        return members;
    } catch (error) {
        console.error("Error fetching family members:", error);
        return [];
    }
}

export async function addFamilyMember(data: { name: string, email: string, role: string }) {
    try {
        const { name, email, role } = data;

        // Simulate user creation without password for simplified members
        // In production, you might generate a temporary password or invite link
        const newMember = await prisma.user.create({
            data: {
                name,
                email: email || `${name.toLowerCase().trim()}@familia.com`,
                role,
                avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${name.trim()}`,
                // Note: Password intentionally left null or a default temp hash if required by schema
            }
        });

        revalidatePath('/family');
        return { success: true, member: newMember };
    } catch (error) {
        console.error("Error creating family member:", error);
        return { success: false, error: "Failed to create member" };
    }
}

export async function deleteFamilyMember(memberId: string) {
    try {
        await prisma.user.delete({
            where: { id: memberId }
        });
        revalidatePath('/family');
        return { success: true };
    } catch (error) {
        console.error("Error deleting member:", error);
        return { success: false, error: "No se pudo borrar el miembro" };
    }
}

export async function getFamilyStats() {
    try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dayOfWeek = now.getDay();

        // 1. Get today's progress for ALL members
        const allAssignments = await prisma.taskAssignment.findMany({
            include: {
                task: true,
                logs: {
                    where: { date: todayStr }
                }
            }
        });

        const validToday = allAssignments.filter((a: any) => {
            const days = JSON.parse(a.daysOfWeek) as number[];
            if (!days.includes(dayOfWeek)) return false;
            if (!a.task.isPerpetual && a.task.endDate) {
                const endDate = new Date(a.task.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (new Date() > endDate) return false;
            }
            return true;
        });

        const totalToday = validToday.length;
        const completedToday = validToday.filter((a: any) => a.logs.length > 0 && a.logs[0].status === "COMPLETED").length;
        const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

        // 2. Weekly computations (Last 7 days)
        const sevenDaysAgoDate = new Date();
        sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
        const sevenDaysAgoStr = `${sevenDaysAgoDate.getFullYear()}-${String(sevenDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgoDate.getDate()).padStart(2, '0')}`;

        const weeklyLogs = await prisma.taskLog.findMany({
            where: {
                date: {
                    gte: sevenDaysAgoStr
                },
                status: "COMPLETED"
            }
        });

        const totalWeeklyCompleted = weeklyLogs.length;

        // Simple Streak Calculation (how many distinct days in the last 7 days were logged)
        const distinctDays = new Set(weeklyLogs.map((log: any) => log.date));
        const currentStreak = distinctDays.size;

        return {
            progressPercent,
            currentStreak,
            totalWeeklyCompleted
        };
    } catch (err) {
        return {
            progressPercent: 0,
            currentStreak: 0,
            totalWeeklyCompleted: 0
        };
    }
}
