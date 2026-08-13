import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = await bcrypt.hash("test@123", 10);

  await prisma.user.update({
    where: {
      email: "test@pharmix.com",
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log("Pharmacist password reset successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());