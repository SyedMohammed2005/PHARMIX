import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "../src/generated/prisma/client";

async function main() {
  const users = [
    {
      name: "Pharmix Admin",
      email: "admin@pharmix.com",
      password: "admin@123",
      role: UserRole.ADMIN,
    },
    {
      name: "Pharmix Pharmacist",
      email: "test@pharmix.com",
      password: "pharmacist@123",
      role: UserRole.PHARMACIST,
    },
    {
      name: "Inventory Manager",
      email: "manager@pharmix.com",
      password: "manager@123",
      role: UserRole.INVENTORY_MANAGER,
    },
    {
      name: "Business Analyst",
      email: "analyst@pharmix.com",
      password: "analyst@123",
      role: UserRole.BUSINESS_ANALYST,
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(
      user.password,
      10
    );

    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });

    console.log(
      `${user.role} user ready: ${user.email}`
    );
  }

  console.log("\nAll Pharmix test users are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });