import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email/User", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.email },
                            { name: credentials.email }
                        ]
                    }
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
                if (!isPasswordValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            console.log("JWT Callback Triggered. User?", !!user, "Token ID before:", token.id, "Token sub:", token.sub);
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            // Fallback for ID if token.id is missing but token.sub is present (NextAuth default)
            if (!token.id && token.sub) {
                token.id = token.sub;
            }
            console.log("JWT Token returned ID:", token.id);
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback Triggered. Token ID:", token.id, "Token sub:", token.sub);
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = (token.id as string) || (token.sub as string);
            }
            console.log("Session User constructed with ID:", session.user?.id);
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
