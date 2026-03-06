"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFamilyMembers } from "@/app/actions/family";
import { createTask } from "@/app/actions/tasks";
import { User } from "@prisma/client";

export default function CreateTaskPage() {
    const router = useRouter();
    const [taskName, setTaskName] = useState("");
    const [duration, setDuration] = useState("");
    const [assignedTo, setAssignedTo] = useState<string[]>([]); // Will store User IDs
    const [category, setCategory] = useState("Chores");
    const [isPerpetual, setIsPerpetual] = useState(false);
    const [endDate, setEndDate] = useState("");
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

    // DB Data state
    const [members, setMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function load() {
            const data = await getFamilyMembers();
            setMembers(data);
            setIsLoading(false);
        }
        load();
    }, []);

    // Array of days for selection 0: Sun, 1: Mon...
    const DAYS = [
        { label: "D", value: 0 },
        { label: "L", value: 1 },
        { label: "M", value: 2 },
        { label: "X", value: 3 },
        { label: "J", value: 4 },
        { label: "V", value: 5 },
        { label: "S", value: 6 },
    ];

    const toggleDay = (dayValue: number) => {
        if (daysOfWeek.includes(dayValue)) {
            setDaysOfWeek(daysOfWeek.filter(d => d !== dayValue));
        } else {
            setDaysOfWeek([...daysOfWeek, dayValue]);
        }
    };

    const handleCreate = async () => {
        if (!taskName) {
            alert("Por favor, ingresa un nombre para la tarea.");
            return;
        }

        if (assignedTo.length === 0) {
            alert("Por favor, asigna la tarea a al menos un miembro.");
            return;
        }

        if (daysOfWeek.length === 0) {
            alert("Por favor, selecciona los días para realizar la tarea.");
            return;
        }

        setIsSubmitting(true);
        const result = await createTask({
            title: taskName,
            category,
            durationMinutes: parseInt(duration) || 15, // default 15 mins if empty
            isPerpetual,
            endDate: isPerpetual ? undefined : endDate,
            daysOfWeek,
            assignedToIds: assignedTo,
        });

        if (result.success) {
            router.push("/dashboard");
        } else {
            alert("Error al crear la tarea.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto w-full max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen flex flex-col shadow-xl pb-24">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold tracking-tight pr-10">Crear Tarea</h1>
            </div>

            {/* Form Content */}
            <div className="flex-1 px-6 py-6 space-y-8">
                {/* Task Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Nombre de la tarea</label>
                    <div className="relative group">
                        <input
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            className="w-full h-14 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base placeholder:text-slate-400"
                            placeholder="Ej. Limpiar el cuarto"
                            type="text"
                        />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">edit_note</span>
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Duración (tiempo mínimo)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full h-14 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base placeholder:text-slate-400"
                                placeholder="30"
                                type="number"
                                min="1"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">min</span>
                        </div>
                        <div className="h-14 w-14 flex items-center justify-center bg-primary/10 dark:bg-primary/5 text-primary rounded-xl border border-primary/20">
                            <span className="material-symbols-outlined">schedule</span>
                        </div>
                    </div>
                </div>

                {/* Assign to Family Member */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Asignar a</label>
                        <button className="text-xs font-bold text-primary hover:underline">Añadir miembro +</button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {isLoading ? (
                            <p className="text-xs text-slate-400 col-span-4 ml-1">Cargando familia...</p>
                        ) : members.length === 0 ? (
                            <p className="text-xs text-slate-400 col-span-4 ml-1">No hay miembros. Añade uno desde el Centro Familiar primero.</p>
                        ) : (
                            members.map((member) => {
                                const selected = assignedTo.includes(member.id);
                                return (
                                    <button
                                        key={member.id}
                                        onClick={() => setAssignedTo(selected ? assignedTo.filter(id => id !== member.id) : [...assignedTo, member.id])}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`relative p-1 rounded-full border-2 transition-all ${selected ? 'border-primary bg-white dark:bg-slate-800' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}>
                                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                                                <img src={member.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} alt={member.name || "User"} className="w-full h-full object-cover" />
                                            </div>
                                            {selected && (
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] rounded-full p-0.5 border-2 border-white dark:border-slate-900">
                                                    <span className="material-symbols-outlined !text-xs font-bold">check</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-xs ${selected ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-500 dark:text-slate-400'}`}>{member.name}</span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Flexibility: Days of Week */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Días a realizar</label>
                    <div className="flex justify-between gap-1">
                        {DAYS.map((day) => {
                            const active = daysOfWeek.includes(day.value);
                            return (
                                <button
                                    key={day.value}
                                    onClick={() => toggleDay(day.value)}
                                    className={`flex-1 aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-all ${active
                                        ? 'bg-primary text-slate-900 shadow-md shadow-primary/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Flexibility: Expiration/Perpetual */}
                <div className="space-y-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">¿Es una tarea perpetua?</label>
                        <button
                            onClick={() => setIsPerpetual(!isPerpetual)}
                            className={`w-12 h-6 rounded-full p-1 flex transition-colors ${isPerpetual ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPerpetual ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {!isPerpetual && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 mb-2">Fecha límite</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Task Category */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Categoría</label>
                    <div className="flex flex-wrap gap-2">
                        {['Chores', 'Homework', 'Personal'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${category === cat
                                    ? 'bg-primary/20 text-primary border-primary/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                        <span className="material-symbols-outlined">task_alt</span>
                    )}
                    {isSubmitting ? "Guardando..." : "Guardar Tarea"}
                </button>
                <button
                    onClick={() => router.back()}
                    className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
