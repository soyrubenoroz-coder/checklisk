"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember, reorderMember, getFamilyStats } from "@/app/actions/family";

const AVATAR_PRESETS = [
    { id: 'male', label: 'Hombre', icon: '👨', seed: 'ManAdult' },
    { id: 'female', label: 'Mujer', icon: '👩', seed: 'WomanAdult' },
    { id: 'boy', label: 'Niño', icon: '👦', seed: 'BoyChild' },
    { id: 'girl', label: 'Niña', icon: '👧', seed: 'GirlChild' },
];

function getAvatarUrl(name: string, gender: string) {
    const preset = AVATAR_PRESETS.find(p => p.id === gender);
    const seed = `${name?.trim() || 'User'}-${preset?.seed || 'ManAdult'}`;
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;
}

export default function FamilyHubPage() {
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [form, setForm] = useState({ name: '', email: '', role: 'MEMBER', gender: 'male', password: '' });
    const [members, setMembers] = useState<any[]>([]);
    const [familyStats, setFamilyStats] = useState({ progressPercent: 0, currentStreak: 0, totalWeeklyCompleted: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [membersData, statsData] = await Promise.all([getFamilyMembers(), getFamilyStats()]);
        setMembers(membersData);
        setFamilyStats(statsData);
        setIsLoading(false);
    };

    const openAddModal = () => {
        setEditingMember(null);
        setForm({ name: '', email: '', role: 'MEMBER', gender: 'male', password: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (member: any) => {
        setEditingMember(member);
        setForm({
            name: member.name || '',
            email: member.email || '',
            role: member.role,
            gender: member.gender || 'male',
            password: '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let result;
        if (editingMember) {
            result = await updateFamilyMember({ id: editingMember.id, ...form });
        } else {
            result = await addFamilyMember(form);
        }
        if (result.success) {
            setIsModalOpen(false);
            loadData();
        } else {
            alert("Error: " + result.error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (session?.user?.id === id) { alert("No puedes eliminar tu propia cuenta."); return; }
        if (confirm(`¿Eliminar a ${name}? Se borrarán todas sus tareas.`)) {
            const result = await deleteFamilyMember(id);
            if (result.success) loadData();
            else alert("Error: " + result.error);
        }
    };

    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        await reorderMember(id, direction);
        loadData();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark max-w-md mx-auto w-full">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-primary/10">
                <h1 className="text-xl font-bold tracking-tight">Centro Familiar</h1>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="bg-primary/10 p-2 rounded-lg text-primary hover:bg-red-500 hover:text-white transition-colors"
                    title="Cerrar Sesión"
                >
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </header>

            <main className="flex-1 px-4 py-6 space-y-6 w-full pb-24 overflow-y-auto">
                {/* Progress */}
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

                {/* Members Header */}
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-bold">Miembros de la Familia</h3>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-primary text-slate-900 px-4 py-2 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Añadir
                    </button>
                </div>

                {/* Member Cards */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-10 bg-white/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-500 text-sm font-medium animate-pulse">Cargando familia...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-10 bg-white/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-500 text-sm font-medium">Añade miembros para comenzar.</p>
                        </div>
                    ) : (
                        members.map((member, idx) => {
                            const preset = AVATAR_PRESETS.find(p => p.id === member.gender);
                            return (
                                <div key={member.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <img
                                                src={getAvatarUrl(member.name, member.gender)}
                                                alt={member.name || "User"}
                                                className="w-12 h-12 rounded-full bg-slate-100"
                                            />
                                            <span className="absolute -bottom-1 -right-1 text-base">{preset?.icon || '👤'}</span>
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{member.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">
                                                {member.role === 'ADMIN' ? '👑 Admin' : '👤 Miembro'}
                                                {member.hasPassword && ' · Puede iniciar sesión'}
                                            </p>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {/* Reorder */}
                                            <div className="flex flex-col">
                                                {idx > 0 && (
                                                    <button onClick={() => handleReorder(member.id, 'up')} className="text-slate-400 hover:text-primary p-0.5">
                                                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                                                    </button>
                                                )}
                                                {idx < members.length - 1 && (
                                                    <button onClick={() => handleReorder(member.id, 'down')} className="text-slate-400 hover:text-primary p-0.5">
                                                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                                                    </button>
                                                )}
                                            </div>
                                            {/* Edit */}
                                            <button onClick={() => openEditModal(member)} className="text-slate-400 hover:text-blue-500 p-1.5">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            {/* Delete */}
                                            {session?.user?.id !== member.id && (
                                                <button onClick={() => handleDelete(member.id, member.name)} className="text-slate-400 hover:text-red-500 p-1.5">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Weekly Stats */}
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {editingMember ? 'Editar Miembro' : 'Añadir Miembro'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600" type="button">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Avatar Preview */}
                            <div className="flex justify-center">
                                <img
                                    src={getAvatarUrl(form.name || 'Nuevo', form.gender)}
                                    className="w-20 h-20 rounded-full bg-slate-100 border-4 border-primary/20 shadow-md"
                                    alt="Avatar preview"
                                />
                            </div>

                            {/* Gender/Type Picker */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo de Avatar</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {AVATAR_PRESETS.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setForm({ ...form, gender: preset.id })}
                                            className={`flex flex-col items-center py-3 rounded-xl border transition-all ${form.gender === preset.id
                                                ? 'bg-primary/20 border-primary/30 scale-105'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                }`}
                                        >
                                            <span className="text-2xl mb-1">{preset.icon}</span>
                                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre</label>
                                <input
                                    type="text" required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                    placeholder="Ej. Leo"
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rol</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setForm({ ...form, role: 'ADMIN' })}
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${form.role === 'ADMIN' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                        👑 Admin
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, role: 'MEMBER' })}
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${form.role === 'MEMBER' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                        👤 Miembro
                                    </button>
                                </div>
                            </div>

                            {/* Email & Password (for login) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Correo {form.role === 'ADMIN' ? '(para iniciar sesión)' : '(opcional)'}
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Contraseña {editingMember ? '(dejar vacío para no cambiar)' : '(para iniciar sesión)'}
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                    placeholder={editingMember ? '••••••' : 'Contraseña'}
                                />
                            </div>

                            <button type="submit" className="w-full h-12 mt-2 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm">
                                {editingMember ? 'Guardar Cambios' : 'Añadir Miembro'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
