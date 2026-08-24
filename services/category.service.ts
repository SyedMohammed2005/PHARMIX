import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createCategory(data: {
  name: string;
}) {
  const existingCategory = await prisma.category.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existingCategory) {
    throw new Error("CATEGORY_EXISTS");
  }

  return prisma.category.create({
    data,
  });
}