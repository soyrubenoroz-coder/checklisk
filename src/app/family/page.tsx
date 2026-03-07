"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember, reorderMembers, getFamilyStats } from "@/app/actions/family";

const AVATAR_PRESETS = [
    { id: 'male', label: 'Papá', icon: '👨' },
    { id: 'female', label: 'Mamá', icon: '👩' },
    { id: 'boy', label: 'Niño', icon: '👦' },
    { id: 'girl', label: 'Niña', icon: '👧' },
];

function getEmojiForGender(gender: string) {
    return AVATAR_PRESETS.find(p => p.id === gender)?.icon || '👤';
}

export default function FamilyHubPage() {
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [form, setForm] = useState({ name: '', email: '', role: 'MEMBER', gender: 'male', password: '' });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [familyStats, setFamilyStats] = useState({ progressPercent: 0, currentStreak: 0, totalWeeklyCompleted: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag state
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);
    const dragItemRef = useRef<number | null>(null);
    const dragOverRef = useRef<number | null>(null);

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
        setPhotoPreview(null);
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
        setPhotoPreview(member.avatarUrl || null);
        setIsModalOpen(true);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Resize to max 200px for storage efficiency
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 200;
                let w = img.width, h = img.height;
                if (w > h) { h = (h / w) * maxSize; w = maxSize; }
                else { w = (w / h) * maxSize; h = maxSize; }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setPhotoPreview(dataUrl);
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let result;
        const formData = { ...form, avatarUrl: photoPreview || undefined };
        if (editingMember) {
            result = await updateFamilyMember({ id: editingMember.id, ...formData });
        } else {
            result = await addFamilyMember(formData);
        }
        if (result.success) {
            setIsModalOpen(false);
            setPhotoPreview(null);
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

    // --- Drag & Drop ---
    const handleDragStart = (idx: number) => {
        if (isModalOpen) return;
        dragItemRef.current = idx;
        setDragIdx(idx);
    };
    const handleDragEnter = (idx: number) => {
        dragOverRef.current = idx;
        setOverIdx(idx);
    };
    const handleDragEnd = async () => {
        const from = dragItemRef.current;
        const to = dragOverRef.current;
        setDragIdx(null);
        setOverIdx(null);
        dragItemRef.current = null;
        dragOverRef.current = null;
        if (from === null || to === null || from === to) return;
        const reordered = [...members];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        setMembers(reordered);
        await reorderMembers(reordered.map(m => m.id));
    };

    // --- Touch Drag ---
    const touchIdx = useRef<number | null>(null);
    const memberRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleTouchStart = (idx: number, e: React.TouchEvent) => {
        if (isModalOpen) return;
        touchIdx.current = idx;
        setDragIdx(idx);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isModalOpen || touchIdx.current === null) return;
        const currentY = e.touches[0].clientY;
        for (let i = 0; i < memberRefs.current.length; i++) {
            const el = memberRefs.current[i];
            if (el) {
                const rect = el.getBoundingClientRect();
                if (currentY >= rect.top && currentY <= rect.bottom) {
                    setOverIdx(i);
                    dragOverRef.current = i;
                    break;
                }
            }
        }
    };
    const handleTouchEnd = async () => {
        const from = touchIdx.current;
        const to = dragOverRef.current;
        setDragIdx(null);
        setOverIdx(null);
        touchIdx.current = null;
        dragOverRef.current = null;
        if (from === null || to === null || from === to) return;
        const reordered = [...members];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        setMembers(reordered);
        await reorderMembers(reordered.map(m => m.id));
    };

    // --- Avatar display helper ---
    const renderAvatar = (member: any, size: string = 'w-12 h-12') => {
        if (member.avatarUrl) {
            return <img src={member.avatarUrl} alt={member.name || ''} className={`${size} rounded-full object-cover bg-slate-100`} />;
        }
        return (
            <div className={`${size} rounded-full bg-primary/10 flex items-center justify-center`}>
                <span className="text-2xl">{getEmojiForGender(member.gender)}</span>
            </div>
        );
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

                {members.length > 1 && (
                    <p className="text-xs text-slate-400 text-center -mt-2">
                        <span className="material-symbols-outlined text-xs align-middle">drag_indicator</span> Arrastra para reordenar
                    </p>
                )}

                {/* Member Cards */}
                <div className="space-y-3" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
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
                            const isDragging = dragIdx === idx;
                            const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                            return (
                                <div
                                    key={member.id}
                                    ref={el => { memberRefs.current[idx] = el; }}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragEnter={() => handleDragEnter(idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    onTouchStart={(e) => handleTouchStart(idx, e)}
                                    className={`bg-white dark:bg-slate-800/50 p-4 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 select-none
                                        ${isDragging ? 'opacity-50 scale-95 border-primary/40' : 'border-primary/5'}
                                        ${isOver ? 'border-primary border-2 -translate-y-1 shadow-lg shadow-primary/10' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-slate-300 dark:text-slate-600 shrink-0 touch-none">
                                            <span className="material-symbols-outlined text-xl">drag_indicator</span>
                                        </div>
                                        <div className="shrink-0">
                                            {renderAvatar(member)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{member.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">
                                                {member.role === 'ADMIN' ? '👑 Admin' : '👤 Miembro'}
                                                {member.hasPassword && ' · Puede iniciar sesión'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button onClick={() => openEditModal(member)} className="text-slate-400 hover:text-blue-500 p-1.5">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
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
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {editingMember ? 'Editar Miembro' : 'Añadir Miembro'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1" type="button">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Body - scrollable */}
                        <form onSubmit={handleSubmit} className="p-5 pb-8 space-y-4 overflow-y-auto flex-1">
                            {/* Avatar + Photo Upload */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    {photoPreview ? (
                                        <img src={photoPreview} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md bg-slate-100" alt="Avatar" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 shadow-md flex items-center justify-center">
                                            <span className="text-5xl">{getEmojiForGender(form.gender)}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 bg-primary text-slate-900 p-1.5 rounded-full shadow-md hover:bg-primary/80 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">photo_camera</span>
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoSelect}
                                />
                                {photoPreview && (
                                    <button
                                        type="button"
                                        onClick={() => setPhotoPreview(null)}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Quitar foto
                                    </button>
                                )}
                            </div>

                            {/* Gender Picker (for default emoji if no photo) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</label>
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

                            {/* Email */}
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

                            {/* Password */}
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
