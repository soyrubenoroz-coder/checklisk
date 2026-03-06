import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    // Create Admin (Mom)
    const admin = await prisma.user.upsert({
        where: { email: "mama@familia.com" },
        update: {},
        create: {
            email: "mama@familia.com",
            name: "Mamá",
            password: adminPassword,
            role: "ADMIN",
            avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Mama"
        }
    });

    // Create Parent (Dad)
    const dad = await prisma.user.upsert({
        where: { email: "papa@familia.com" },
        update: {},
        create: {
            email: "papa@familia.com",
            name: "Papá",
            password: userPassword,
            role: "MEMBER",
            avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Papa"
        }
    });

    // Create Child (Leo)
    const leo = await prisma.user.upsert({
        where: { email: "leo@familia.com" },
        update: {},
        create: {
            email: "leo@familia.com",
            name: "Leo",
            password: userPassword,
            role: "MEMBER",
            avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Leo"
        }
    });

    // Create Child (Sophie)
    const sophie = await prisma.user.upsert({
        where: { email: "sophie@familia.com" },
        update: {},
        create: {
            email: "sophie@familia.com",
            name: "Sophie",
            password: userPassword,
            role: "MEMBER",
            avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Sophie"
        }
    });

    console.log("Seeded database with users:");
    console.table([
        { name: admin.name, email: admin.email, role: admin.role },
        { name: dad.name, email: dad.email, role: dad.role },
        { name: leo.name, email: leo.email, role: leo.role },
        { name: sophie.name, email: sophie.email, role: sophie.role },
    ]);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
