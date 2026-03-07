"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/actions/dashboard";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState({ totalToday: 0, completedToday: 0, pendingTasks: [] as any[] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            loadStats(session.user.id);
        } else if (status === "unauthenticated") {
            // Already handled by layout redirect, but just in case
            setIsLoading(false);
        }
    }, [session?.user?.id, status]);

    const loadStats = async (userId: string) => {
        setIsLoading(true);
        const data = await getDashboardStats(userId);
        setStats(data);
        setIsLoading(false);
    };

    if (isLoading || status === "loading") {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4">refresh</span>
                <p className="text-slate-500 font-medium animate-pulse">Cargando tu panel...</p>
            </div>
        );
    }

    const progressPercent = stats.totalToday > 0 ? Math.round((stats.completedToday / stats.totalToday) * 100) : 0;

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark max-w-md mx-auto w-full">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-8 pb-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Hola, {session?.user?.name?.split(' ')[0] || 'Familia'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </header>

            {/* Active User Summary Card */}
            <main className="flex-1 px-6 pb-24 overflow-y-auto">
                <div className="bg-primary/10 dark:bg-primary/5 rounded-xl p-6 mb-6 border border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {(session?.user as any)?.avatarUrl ? (
                                <img
                                    className="size-20 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-800 shadow-md bg-slate-200 object-cover"
                                    src={(session?.user as any)?.avatarUrl}
                                    alt="Avatar"
                                />
                            ) : (
                                <div className="size-20 rounded-full border-4 border-white dark:border-slate-800 shadow-md bg-primary/10 flex items-center justify-center">
                                    <span className="text-4xl">👤</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 size-6 bg-primary rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                ¡Hola, {session?.user?.name || 'Usuario'}!
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 capitalize">
                                {session?.user?.role === 'ADMIN' ? 'Miembro Administrador' : 'Miembro'}
                            </p>
                            <div className="inline-flex items-center gap-1 bg-primary/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {stats.totalToday - stats.completedToday} tareas para hoy
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-5 mb-6">
                    <div className="relative size-24 shrink-0 flex items-center justify-center">
                        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
                            <circle className="stroke-slate-200 dark:stroke-slate-700" cx="18" cy="18" r="16" fill="none" strokeWidth="4"></circle>
                            <circle
                                className="stroke-primary transition-all duration-700 ease-in-out"
                                cx="18" cy="18" r="16" fill="none" strokeWidth="4"
                                strokeDasharray="100"
                                strokeDashoffset={100 - progressPercent}
                                strokeLinecap="round"
                            ></circle>
                        </svg>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{progressPercent}%</span>
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">Progreso de Hoy</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stats.completedToday} de {stats.totalToday} tareas completadas</p>
                    </div>
                </div>

                {/* Recent Tasks */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tareas Pendientes</h3>
                </div>
                <div className="space-y-3">
                    {stats.pendingTasks.length > 0 ? (
                        stats.pendingTasks.map((task, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="size-10 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{task.title}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                                        {task.duration} min
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500 text-sm">No hay tareas pendientes para hoy.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
