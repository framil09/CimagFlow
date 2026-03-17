import prisma from "../lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log("\n=== USUÁRIOS NO BANCO DE DADOS ===\n");
  console.table(users);
  console.log(`\nTotal: ${users.length} usuários\n`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
