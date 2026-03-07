"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllTasks, deleteTask } from "@/app/actions/tasks";

export default function ManageTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        const data = await getAllTasks();
        setTasks(data);
        setIsLoading(false);
    };

    const handleDeleteSeries = async (taskId: string, title: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar TODA la serie de "${title}"? Se borrará para todos los miembros asignados y todos sus registros.`)) {
            const result = await deleteTask(taskId);
            if (result.success) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
            } else {
                alert("Error: " + result.error);
            }
        }
    };

    const getDayLabels = (daysNums: number[]) => {
        const labels = ["D", "L", "M", "X", "J", "V", "S"];
        return daysNums.map(n => labels[n]).join(", ");
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto w-full">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-primary/10">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Administrar Series</h1>
            </header>

            <main className="flex-1 px-4 py-6 space-y-4 overflow-y-auto pb-24">
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 mb-6">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Aquí puedes ver todas las tareas recurrentes que has configurado y borrar series completas "mal puestas".
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                        <p className="mt-2 text-slate-500 font-medium animate-pulse">Cargando series...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
                        <p className="text-slate-500 font-medium">No hay series de tareas configuradas.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{task.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                            {task.category}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {task.duration} min
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteSeries(task.id, task.title)}
                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar toda la serie"
                                >
                                    <span className="material-symbols-outlined">delete_forever</span>
                                </button>
                            </div>

                            <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50 space-y-3">
                                {/* Frequency */}
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5">repeat</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Días:</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {task.assignments.length > 0 ? getDayLabels(task.assignments[0].days) : "Sin días asignados"}
                                        </p>
                                    </div>
                                </div>

                                {/* Expiration */}
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5">event_upcoming</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Vigencia:</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {task.isPerpetual ? "Tarea perpetua" : `Hasta el ${task.endDate}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Assigned to */}
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400 mt-0.5">group</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Asignada a:</p>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {task.assignments.map((a: any) => (
                                                <div key={a.id} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 pr-2 pl-0.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
                                                    {a.userAvatar ? (
                                                        <img src={a.userAvatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                                                            {a.userGender === 'female' ? '👩' : a.userGender === 'girl' ? '👧' : a.userGender === 'boy' ? '👦' : '👨'}
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{a.userName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
