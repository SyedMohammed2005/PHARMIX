import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = await bcrypt.hash("admin@123", 10);

  await prisma.user.update({
    where: {
     email: "admin@pharmix.com"
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log("admin password reset successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());