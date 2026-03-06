"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 pb-6 pt-3 px-6 z-50">
            <div className="flex items-center justify-between max-w-md mx-auto">
                <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className={`material-symbols-outlined ${pathname === '/dashboard' ? 'fill-1' : ''}`}>home</span>
                    <span className="text-[10px] font-bold tracking-wider">Inicio</span>
                </Link>
                <Link href="/tasks/today" className={`flex flex-col items-center gap-1 ${pathname === '/tasks/today' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className={`material-symbols-outlined ${pathname === '/tasks/today' ? 'fill-1' : ''}`}>format_list_bulleted</span>
                    <span className="text-[10px] font-medium tracking-wider">Tareas</span>
                </Link>
                <Link href="/tasks/create" className="-mt-10 bg-primary p-4 rounded-full shadow-lg shadow-primary/40 border-4 border-white dark:border-slate-900 text-slate-900 hover:scale-105 transition-transform flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl font-bold">add</span>
                </Link>
                <Link href="/family" className={`flex flex-col items-center gap-1 ${pathname === '/family' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className={`material-symbols-outlined ${pathname === '/family' ? 'fill-1' : ''}`}>group</span>
                    <span className="text-[10px] font-medium tracking-wider">Familia</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-[10px] font-medium tracking-wider">Salir</span>
                </button>
            </div>
        </nav>
    );
}
