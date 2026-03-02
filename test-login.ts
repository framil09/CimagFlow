import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@signflow.com' },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado no banco!');
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.isActive ? 'ATIVO ✓' : 'INATIVO'}`);

    // Testar senha
    const passwordMatch = await bcrypt.compare('admin123', user.password);
    console.log(`   Senha: ${passwordMatch ? 'VÁLIDA ✓' : 'INVÁLIDA'}`);

    if (passwordMatch && user.isActive) {
      console.log('\n🎉 Login bem-sucedido! Você pode acessar com:');
      console.log('   Email: admin@signflow.com');
      console.log('   Senha: admin123');
      console.log('   Acesse: http://localhost:3001/login');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
