import { prisma } from "@/lib/prisma";

export async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  if (data.phone) {
    const existingPhone = await prisma.customer.findUnique({
      where: {
        phone: data.phone,
      },
    });

    if (existingPhone) {
      throw new Error(
        "Customer with this phone number already exists"
      );
    }
  }

  if (data.email) {
    const existingEmail = await prisma.customer.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingEmail) {
      throw new Error(
        "Customer with this email already exists"
      );
    }
  }

  return prisma.customer.create({
    data,
  });
}