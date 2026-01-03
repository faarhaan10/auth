import { initializeDatabase } from "../config/database";
import { createUser, findUserByEmail, findAllUsers } from "../models/user.model";

async function seed() {
    initializeDatabase();

    const seedUsers = [
        { email: "aisha@example.com", password: "Password123!", name: "Aisha Khan", role: "admin" },
        { email: "daniel@example.com", password: "Password123!", name: "Daniel Park", role: "moderator" },
        { email: "sofia@example.com", password: "Password123!", name: "Sofia Reyes", role: "user" },
        { email: "liam@example.com", password: "Password123!", name: "Liam Smith", role: "user" },
        { email: "maya@example.com", password: "Password123!", name: "Maya Patel", role: "admin" },
    ];

    for (const u of seedUsers) {
        const existing = findUserByEmail(u.email);
        if (existing) {
            console.log(`Skipping existing user: ${u.email}`);
            continue;
        }

        try {
            const created = await createUser(u.email, u.password, u.name);
            // If model supports setting role directly via update, else run a quick SQL update
            if (created && u.role && created.role !== u.role) {
                // update role via raw statement to avoid adding another exported helper
                const db = (await import("../config/database")).default;
                const stmt = db.prepare(`UPDATE users SET role = ? WHERE id = ?`);
                stmt.run(u.role, created.id);
            }

            console.log(`Created user: ${u.email}`);
        } catch (err) {
            console.error(`Error creating user ${u.email}:`, err);
        }
    }

    const all = findAllUsers();
    console.log(`\nSeed complete. Total users: ${all.length}`);
    all.forEach((x) => console.log(` - ${x.email} (${x.role})`));
}

seed().catch((err) => {
    console.error("Seeder failed:", err);
    process.exit(1);
});
