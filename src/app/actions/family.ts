"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getFamilyMembers() {
    try {
        const members = await prisma.user.findMany({
            orderBy: { displayOrder: 'asc' }
        });
        return members.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            gender: m.gender || 'male',
            avatarUrl: m.avatarUrl,
            displayOrder: m.displayOrder,
            hasPassword: !!m.password,
        }));
    } catch (error) {
        return [];
    }
}

export async function addFamilyMember(data: {
    name: string;
    email: string;
    role: string;
    gender: string;
    password?: string;
    avatarUrl?: string;
}) {
    try {
        const { name, email, role, gender, password, avatarUrl } = data;

        // Get max order
        const maxOrder = await prisma.user.aggregate({ _max: { displayOrder: true } });
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const newMember = await prisma.user.create({
            data: {
                name,
                email: email || `${name.toLowerCase().replace(/\s+/g, '')}@familia.com`,
                role,
                gender,
                password: hashedPassword,
                avatarUrl: avatarUrl || null,
                displayOrder: nextOrder,
            }
        });

        revalidatePath('/family');
        revalidatePath('/tasks/today');
        return { success: true, member: newMember };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al crear miembro" };
    }
}

export async function updateFamilyMember(data: {
    id: string;
    name: string;
    email: string;
    role: string;
    gender: string;
    password?: string;
    avatarUrl?: string | null;
}) {
    try {
        const { id, name, email, role, gender, password, avatarUrl } = data;

        const updateData: any = { name, email, role, gender };

        if (password && password.length > 0) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Only update avatarUrl if explicitly provided (including null to clear)
        if (avatarUrl !== undefined) {
            updateData.avatarUrl = avatarUrl;
        }

        await prisma.user.update({
            where: { id },
            data: updateData,
        });

        revalidatePath('/family');
        revalidatePath('/tasks/today');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar" };
    }
}

export async function reorderMembers(orderedIds: string[]) {
    try {
        const updates = orderedIds.map((id, index) =>
            prisma.user.update({ where: { id }, data: { displayOrder: index } })
        );
        await prisma.$transaction(updates);

        revalidatePath('/family');
        revalidatePath('/tasks/today');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al reordenar" };
    }
}

export async function deleteFamilyMember(memberId: string) {
    try {
        await prisma.user.delete({
            where: { id: memberId }
        });
        revalidatePath('/family');
        revalidatePath('/tasks/today');
        return { success: true };
    } catch (error) {
        return { success: false, error: "No se pudo borrar el miembro" };
    }
}

export async function updateAvatar(memberId: string, avatarUrl: string) {
    try {
        await prisma.user.update({
            where: { id: memberId },
            data: { avatarUrl }
        });
        revalidatePath('/family');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar avatar" };
    }
}

export async function getFamilyStats() {
    try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dayOfWeek = now.getDay();

        const allAssignments = await prisma.taskAssignment.findMany({
            include: {
                task: true,
                logs: { where: { date: todayStr } }
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

        const sevenDaysAgoDate = new Date();
        sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
        const sevenDaysAgoStr = `${sevenDaysAgoDate.getFullYear()}-${String(sevenDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgoDate.getDate()).padStart(2, '0')}`;

        const weeklyLogs = await prisma.taskLog.findMany({
            where: { date: { gte: sevenDaysAgoStr }, status: "COMPLETED" }
        });

        const totalWeeklyCompleted = weeklyLogs.length;
        const distinctDays = new Set(weeklyLogs.map((log: any) => log.date));
        const currentStreak = distinctDays.size;

        return { progressPercent, currentStreak, totalWeeklyCompleted };
    } catch (err) {
        return { progressPercent: 0, currentStreak: 0, totalWeeklyCompleted: 0 };
    }
}
