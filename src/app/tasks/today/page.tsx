"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getFamilyMembers } from "@/app/actions/family";
import { getTasksForMember, toggleTaskComplete, deleteTask } from "@/app/actions/tasks";

export default function TodayTasksPage() {
    const router = useRouter();
    const { data: session } = useSession();

    // DB Data state
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const now = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, [now]);
    const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

    // Refs for scrolling
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLButtonElement>(null);
    const hasScrolledRef = useRef(false);

    const scrollToToday = () => {
        setSelectedDateStr(todayStr);
        if (todayRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = todayRef.current;
            const scrollLeft = element.offsetLeft - (container.offsetWidth / 2) + (element.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    };

    // Auto-scroll to today ONLY on mount (first time data is ready)
    useEffect(() => {
        if (!isLoading && members.length > 0 && !hasScrolledRef.current) {
            hasScrolledRef.current = true;
            setTimeout(() => {
                if (todayRef.current && scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const element = todayRef.current;
                    const scrollLeft = element.offsetLeft - (container.offsetWidth / 2) + (element.offsetWidth / 2);
                    container.scrollTo({ left: scrollLeft, behavior: 'auto' }); // auto on mount
                }
            }, 100);
        }
    }, [isLoading, members.length]);

    // Generate date window (15 days back, 15 days forward)
    const [dateList, setDateList] = useState<{ dateStr: string, label: string, dayNum: string }[]>([]);

    useEffect(() => {
        const dates = [];
        for (let i = -14; i <= 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = d.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase();
            const dayNum = String(d.getDate()).padStart(2, '0');
            dates.push({ dateStr: dStr, label, dayNum });
        }
        setDateList(dates);
        loadData();
    }, [session?.user?.id]);

    useEffect(() => {
        if (selectedMemberId && selectedDateStr) {
            loadTasksForMember(selectedMemberId, selectedDateStr);
        }
    }, [selectedMemberId, selectedDateStr]);

    const loadData = async () => {
        setIsLoading(true);
        const fetchedMembers = await getFamilyMembers();
        setMembers(fetchedMembers);

        if (fetchedMembers.length > 0) {
            // Default to the logged-in user if they are in the family, or the first member
            const selfMember = fetchedMembers.find((m: any) => m.id === session?.user?.id);
            const defaultId = selfMember ? selfMember.id : fetchedMembers[0].id;
            setSelectedMemberId(defaultId);
        } else {
            setIsLoading(false);
        }
    };

    const loadTasksForMember = async (memberId: string, dateStr: string) => {
        setIsLoading(true);
        const data = await getTasksForMember(memberId, dateStr);
        setTasks(data);
        setIsLoading(false);
    };

    const handleToggleTask = async (assignmentId: string, currentlyCompleted: boolean) => {
        // Optimistic UI update
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === assignmentId ? { ...t, completed: !t.completed } : t
        ));

        try {
            await toggleTaskComplete(assignmentId, selectedDateStr, session?.user?.id || '', currentlyCompleted);
        } catch (error: any) {
            alert("No se pudo completar la tarea: " + (error.message || error.toString()));
            // Rollback optimistic update
            setTasks(prevTasks => prevTasks.map(t =>
                t.id === assignmentId ? { ...t, completed: currentlyCompleted } : t
            ));
        }
    };

    const handleDeleteTask = async (taskId: string, assignmentId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid triggering toggle task
        if (confirm("¿Seguro que quieres borrar esta tarea para todos los asignados?")) {
            // Optimistic DB update
            setTasks(prevTasks => prevTasks.filter(t => t.id !== assignmentId));
            const result = await deleteTask(taskId);
            if (!result.success) {
                alert(result.error);
                if (selectedMemberId && selectedDateStr) {
                    loadTasksForMember(selectedMemberId, selectedDateStr);
                }
            }
        }
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-background-dark shadow-xl overflow-hidden pb-24">
            {/* Header */}
            <header className="flex flex-col bg-white dark:bg-background-dark pt-4 pb-2 sticky top-0 z-10 border-b border-primary/5">
                <div className="flex items-center justify-between px-6 mb-3">
                    <div className="flex flex-col">
                        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight capitalize">
                            {selectedDateStr === todayStr ? 'Tareas de Hoy' : new Date(Number(selectedDateStr.split('-')[0]), Number(selectedDateStr.split('-')[1]) - 1, Number(selectedDateStr.split('-')[2])).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </h2>
                        {selectedDateStr !== todayStr && (
                            <button
                                onClick={scrollToToday}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-slate-900 rounded-full text-[10px] font-bold mt-1 shadow-sm transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
                            >
                                <span className="material-symbols-outlined text-[14px]">today</span>
                                Volver a Hoy
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => router.push('/tasks/manage')}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-primary/20 hover:text-primary transition-all"
                        title="Administrar series"
                    >
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </button>
                </div>

                {/* Member Selector Slider */}
                <div className="px-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`flex flex-col items-center gap-1 shrink-0 snap-center p-2 rounded-2xl transition-all ${selectedMemberId === member.id
                                ? 'bg-primary/10 border-transparent relative'
                                : 'bg-transparent hover:bg-slate-50 border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name || ''} className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-white object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl">{member.gender === 'female' ? '👩' : member.gender === 'girl' ? '👧' : member.gender === 'boy' ? '👦' : '👨'}</span>
                                </div>
                            )}
                            <span className={`text-[10px] font-bold ${selectedMemberId === member.id ? 'text-primary' : 'text-slate-500'}`}>
                                {member.name}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Date Calendar Slider */}
                <div
                    ref={scrollContainerRef}
                    className="px-4 flex gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x"
                >
                    {dateList.map((d, index) => {
                        const isSelected = selectedDateStr === d.dateStr;
                        const isToday = todayStr === d.dateStr;

                        // Small hack to center the selected date on mount by using refs or just let user scroll manually
                        return (
                            <button
                                key={index}
                                ref={isToday ? todayRef : null}
                                onClick={() => setSelectedDateStr(d.dateStr)}
                                className={`flex flex-col items-center justify-center shrink-0 snap-center rounded-2xl transition-all h-16 w-12 border ${isSelected
                                    ? 'bg-primary border-primary shadow-md shadow-primary/20 scale-110 mx-1 z-10'
                                    : isToday
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-900' : isToday ? 'text-primary' : 'text-slate-500'}`}>
                                    {d.label}
                                </span>
                                <span className={`text-base font-bold ${isSelected ? 'text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {d.dayNum}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </header>

            {selectedMemberId && (
                <div className="px-4 py-4">
                    {/* Progress Mini Card & Graph */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Resumen del Día</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{completedCount} de {tasks.length} tareas listas</p>
                            </div>
                            <div className="relative size-14 flex items-center justify-center">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <circle className="stroke-slate-100 dark:stroke-slate-700" cx="18" cy="18" r="16" fill="none" strokeWidth="4"></circle>
                                    <circle
                                        className="stroke-primary transition-all duration-700 ease-in-out"
                                        cx="18" cy="18" r="16" fill="none" strokeWidth="4"
                                        strokeDasharray="100"
                                        strokeDashoffset={100 - progressPercent}
                                        strokeLinecap="round"
                                    ></circle>
                                </svg>
                                <span className="absolute text-[11px] font-bold text-slate-800 dark:text-slate-200">{progressPercent}%</span>
                            </div>
                        </div>

                        {/* Linear graph / bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <span className="text-primary">Hechas ({completedCount})</span>
                                <span className="text-orange-400">Restantes ({tasks.length > 0 ? tasks.length - completedCount : 0})</span>
                            </div>
                            <div className="w-full h-2.5 flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                <div
                                    className="bg-primary h-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                                <div
                                    className="bg-orange-400 h-full transition-all duration-1000 ease-out"
                                    style={{ width: `${tasks.length > 0 ? 100 - progressPercent : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task List Content */}
            <main className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center py-10">
                        <span className="material-symbols-outlined text-4xl text-primary/50 mb-2 animate-spin">refresh</span>
                        <p className="text-slate-500 font-medium animate-pulse">Cargando tareas...</p>
                    </div>
                ) : (
                    <>
                        {tasks.length > 0 && <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight px-1 pb-1">Lista de tareas</h3>}

                        {tasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => handleToggleTask(task.id, task.completed)}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${task.completed
                                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-70'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/30 shadow-sm'
                                    }`}
                            >
                                <div className="flex size-6 items-center justify-center shrink-0">
                                    {task.completed ? (
                                        <div className="h-6 w-6 rounded-lg border-2 border-primary bg-primary text-white flex items-center justify-center shadow-sm shadow-primary/30">
                                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-transparent flex items-center justify-center"></div>
                                    )}
                                </div>

                                <div className="flex flex-col flex-1">
                                    <p className={`text-base font-semibold leading-normal ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {task.completed ? (
                                            <>
                                                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                                                <span className="text-primary text-xs font-bold uppercase tracking-wider">¡Hecho!</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{task.duration} min</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {!task.completed && (
                                    <button
                                        onClick={(e) => handleDeleteTask(task.taskId, task.id, e)}
                                        className="shrink-0 p-2 -mr-2 text-slate-300 hover:text-red-500 transition-colors"
                                        title="Eliminar tarea"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>
                        ))}

                        {tasks.length === 0 && selectedMemberId && (
                            <div className="text-center py-10">
                                <span className="material-symbols-outlined text-4xl text-emerald-200 mb-2">celebration</span>
                                <p className="text-slate-500 font-medium">¡No hay tareas asignadas para hoy!</p>
                            </div>
                        )}
                        {!selectedMemberId && (
                            <div className="text-center py-10">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">face</span>
                                <p className="text-slate-500 font-medium">Selecciona un miembro para ver sus tareas.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
