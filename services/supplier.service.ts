import { prisma } from "@/lib/prisma";

export async function getSuppliers() {
  return prisma.supplier.findMany({
    include: {
      products: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createSupplier(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  if (data.email) {
    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingSupplier) {
      throw new Error("SUPPLIER_EMAIL_EXISTS");
    }
  }

  return prisma.supplier.create({
    data,
  });
}