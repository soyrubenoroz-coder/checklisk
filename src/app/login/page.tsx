"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setIsLoading(false);

        if (result?.error) {
            setError("Usuario o contraseña incorrectos");
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-primary/5 dark:from-slate-950 dark:to-slate-900">
            <div className="w-full max-w-[420px] flex flex-col">

                {/* Logo / House Icon */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
                        <span
                            className="material-symbols-outlined text-primary"
                            style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1" }}
                        >
                            home
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        ¡Hola de nuevo!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">
                        Inicia sesión para cuidar de tu familia y hogar
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold text-center py-3 px-4 rounded-xl border border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Correo electrónico o usuario
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                                    placeholder="ejemplo@familia.com"
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full h-14 pl-12 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-primary text-slate-900 font-bold text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                            ) : (
                                <>
                                    <span>Ingresar</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-slate-400 text-xs text-center mt-6">
                    Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
                </p>
            </div>
        </div>
    );
}
