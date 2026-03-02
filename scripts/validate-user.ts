import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateUser() {
  try {
    const email = 'admin@signflow.com';
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ Usuário ${email} não encontrado no banco de dados.`);
      return;
    }

    console.log(`✓ Usuário encontrado: ${user.name}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Status atual: ${user.isActive ? 'ATIVO' : 'INATIVO'}`);

    // Atualizar o usuário para ativo e admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isActive: true,
        role: 'ADMIN',
      },
    });

    console.log('\n✅ Usuário validado com sucesso!');
    console.log(`  - Status: ${updatedUser.isActive ? 'ATIVO' : 'INATIVO'}`);
    console.log(`  - Role: ${updatedUser.role}`);
    console.log(`\n🎉 O usuário ${email} agora pode acessar a plataforma!`);
    
  } catch (error) {
    console.error('❌ Erro ao validar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateUser();
