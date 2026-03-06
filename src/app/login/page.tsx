"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Using credentials provider
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Usuario o contraseña incorrectos");
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <div className="relative flex h-auto w-full max-w-[480px] flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-primary/10">

                {/* Top Navigation Area */}
                <div className="flex items-center bg-white dark:bg-slate-900 p-4 pb-2 justify-between">
                    <div className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center cursor-pointer">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                        Bienvenido a Casa
                    </h2>
                </div>

                {/* Illustration/Hero Area */}
                <div className="flex w-full grow bg-white dark:bg-slate-900 p-6">
                    <div className="w-full aspect-[4/3] rounded-xl flex items-center justify-center bg-primary/10 overflow-hidden">
                        <div className="flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-primary text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                            <div className="w-24 h-1 bg-primary/20 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Greeting Text */}
                <div className="px-6 text-center">
                    <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-3xl font-bold leading-tight pb-2">
                        ¡Hola de nuevo!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal">
                        Inicia sesión para cuidar de tu familia y hogar
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4 px-6 py-8">
                    {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}
                    <label className="flex flex-col w-full">
                        <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-normal pb-2">
                            Correo electrónico o usuario
                        </p>
                        <div className="relative">
                            <input
                                className="form-input flex w-full rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 p-[15px] pl-12 text-base font-normal leading-normal"
                                placeholder="ejemplo@familia.com"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                        </div>
                    </label>
                    <label className="flex flex-col w-full">
                        <div className="flex justify-between items-center pb-2">
                            <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-normal">Contraseña</p>
                            <a className="text-primary text-sm font-medium hover:underline" href="#">¿Olvidaste tu contraseña?</a>
                        </div>
                        <div className="relative">
                            <input
                                className="form-input flex w-full rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 p-[15px] pl-12 text-base font-normal leading-normal"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                        </div>
                    </label>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full h-14 bg-primary text-slate-900 font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-2"
                    >
                        <span>Ingresar</span>
                        <span className="material-symbols-outlined">login</span>
                    </button>

                    {/* Social Login / Secondary Option */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">O también puedes</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-base rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        <span>Crear una cuenta nueva</span>
                    </button>
                </form>

                {/* Footer */}
                <div className="pb-8 px-6 text-center">
                    <p className="text-slate-400 text-xs">Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
                </div>
            </div>
        </div>
    );
}
