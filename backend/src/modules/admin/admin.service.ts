import { prisma } from "../../config/db.js";

export async function listDepartments() {
  return prisma.department.findMany({
    include: {
      head: true,
      children: true
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function createDepartment(input: {
  name: string;
  location?: string;
  costCenter?: string;
  parentId?: string;
  headId?: string;
}) {
  return prisma.department.create({ data: input });
}
