"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { getFamilyMembers, addFamilyMember, deleteFamilyMember, getFamilyStats } from "@/app/actions/family";

export default function FamilyHubPage() {
    const { data: session } = useSession();
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("MEMBER");
    const [members, setMembers] = useState<any[]>([]);
    const [familyStats, setFamilyStats] = useState({ progressPercent: 0, currentStreak: 0, totalWeeklyCompleted: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [membersData, statsData] = await Promise.all([
            getFamilyMembers(),
            getFamilyStats()
        ]);
        setMembers(membersData);
        setFamilyStats(statsData);
        setIsLoading(false);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await addFamilyMember({
            name: newMemberName,
            email: newMemberEmail,
            role: newMemberRole
        });

        if (result.success) {
            setIsAddMemberOpen(false);
            setNewMemberName("");
            setNewMemberEmail("");
            setNewMemberRole("MEMBER");
            setNewMemberRole("MEMBER");
            loadData();
        } else {
            alert("Error adding member: " + result.error);
        }
    };

    const handleDeleteMember = async (id: string, name: string) => {
        // Prevent deleting oneself
        if (session?.user?.id === id) {
            alert("No puedes eliminar tu propia cuenta.");
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) {
            const result = await deleteFamilyMember(id);
            if (result.success) {
                loadData();
            } else {
                alert("Error eliminando miembro: " + result.error);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark max-w-md mx-auto w-full">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">Centro Familiar</h1>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="bg-primary/10 p-2 rounded-lg text-primary hover:bg-red-500 hover:text-white transition-colors"
                    title="Cerrar Sesión"
                >
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </header>

            <main className="flex-1 px-4 py-6 space-y-6 w-full pb-24 overflow-y-auto">
                {/* Hero Summary Section */}
                <section className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Progreso General</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tareas familiares completadas hoy</p>
                        </div>
                        <span className="text-2xl font-bold text-primary">{familyStats.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-primary/10 h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${familyStats.progressPercent}%` }}></div>
                    </div>
                </section>

                {/* Family List Header */}
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-bold">Miembros de la Familia</h3>
                    <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="flex items-center gap-2 bg-primary text-slate-900 px-4 py-2 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Añadir Miembro
                    </button>
                </div>

                {/* Family Member Cards */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 bg-white/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-500 text-sm font-medium animate-pulse">Cargando familia...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-10 bg-white/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">diversity_3</span>
                            <p className="text-slate-500 text-sm font-medium">Invita a tus miembros de familia para comenzar.</p>
                        </div>
                    ) : (
                        members.map(member => (
                            <div key={member.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={member.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} alt={member.name || "User"} className="w-12 h-12 rounded-full bg-slate-100" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{member.name}</h4>
                                        <p className="text-xs text-slate-500">{member.role === 'ADMIN' ? 'Padre/Admin' : 'Hijo/Miembro'}</p>
                                    </div>
                                </div>
                                {session?.user?.id !== member.id && (
                                    <button
                                        onClick={() => handleDeleteMember(member.id, member.name)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                        title="Eliminar miembro"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Weekly Stats Preview */}
                <section className="mt-8">
                    <h3 className="text-lg font-bold mb-4 px-1">Lo Mejor de la Semana</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/20 p-4 rounded-xl">
                            <span className="material-symbols-outlined text-primary mb-2">emoji_events</span>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Racha de Tareas</p>
                            <p className="text-xl font-bold">{familyStats.currentStreak} Días</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                            <span className="material-symbols-outlined text-slate-400 mb-2">task_alt</span>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Completadas (7d)</p>
                            <p className="text-xl font-bold">{familyStats.totalWeeklyCompleted}</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Add Member Modal */}
            {isAddMemberOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Añadir Miembro</h3>
                            <button
                                onClick={() => setIsAddMemberOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                type="button"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                    placeholder="Ej. Leo"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo (Opcional, de inicio de sesión)</label>
                                <input
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                    placeholder="leo@familia.com"
                                />
                            </div>
                            <div className="space-y-1.5 mb-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rol de Familia</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewMemberRole("ADMIN")}
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${newMemberRole === "ADMIN"
                                            ? "bg-primary/20 text-primary border-primary/20"
                                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                            }`}
                                    >
                                        Padre/Admin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewMemberRole("MEMBER")}
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${newMemberRole === "MEMBER"
                                            ? "bg-primary/20 text-primary border-primary/20"
                                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                            }`}
                                    >
                                        Hijo/Miembro
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full h-12 mt-2 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
                            >
                                Guardar Miembro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
