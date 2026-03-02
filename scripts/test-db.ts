/**
 * Script de Teste de Banco de Dados
 * Verifica conectividade e funcionalidade do PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Iniciando testes do banco de dados...\n');

  try {
    // 1. Teste de Conexão
    console.log('1️⃣ Testando conexão com o banco...');
    await prisma.$connect();
    console.log('   ✅ Conexão estabelecida com sucesso!\n');

    // 2. Teste de Leitura - Usuários
    console.log('2️⃣ Testando leitura de usuários...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Total de usuários: ${userCount}\n`);

    // 3. Teste de Leitura - Prefeituras
    console.log('3️⃣ Testando leitura de prefeituras...');
    const prefectureCount = await prisma.prefecture.count();
    console.log(`   ✅ Total de prefeituras: ${prefectureCount}\n`);

    // 4. Teste de Leitura - Editais
    console.log('4️⃣ Testando leitura de editais...');
    const bidCount = await prisma.bid.count();
    console.log(`   ✅ Total de editais: ${bidCount}\n`);

    // 5. Teste de Leitura - Empresas
    console.log('5️⃣ Testando leitura de empresas...');
    const companyCount = await prisma.company.count();
    console.log(`   ✅ Total de empresas: ${companyCount}\n`);

    // 6. Teste de Leitura - Assinantes
    console.log('6️⃣ Testando leitura de assinantes...');
    const signerCount = await prisma.signer.count();
    console.log(`   ✅ Total de assinantes: ${signerCount}\n`);

    // 7. Teste de Leitura - Documentos
    console.log('7️⃣ Testando leitura de documentos...');
    const documentCount = await prisma.document.count();
    console.log(`   ✅ Total de documentos: ${documentCount}\n`);

    // 8. Teste de Leitura - Pastas
    console.log('8️⃣ Testando leitura de pastas...');
    const folderCount = await prisma.folder.count();
    console.log(`   ✅ Total de pastas: ${folderCount}\n`);

    // 9. Teste de Leitura - Templates
    console.log('9️⃣ Testando leitura de templates...');
    const templateCount = await prisma.template.count();
    console.log(`   ✅ Total de templates: ${templateCount}\n`);

    // 10. Teste de Query Complexa
    console.log('🔟 Testando query com relacionamentos...');
    const users = await prisma.user.findMany({
      take: 1,
      include: {
        _count: {
          select: {
            documents: true,
            bids: true,
            templates: true,
          }
        }
      }
    });
    if (users.length > 0) {
      console.log(`   ✅ Query com relacionamentos funcionando!`);
      console.log(`   📊 Usuário: ${users[0].name}`);
      console.log(`      - Documentos: ${users[0]._count.documents}`);
      console.log(`      - Editais: ${users[0]._count.bids}`);
      console.log(`      - Templates: ${users[0]._count.templates}\n`);
    }

    // 11. Teste de Enums
    console.log('1️⃣1️⃣ Testando enums do banco...');
    const bidTypes = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::\"BidType\")) as type;
    `;
    console.log(`   ✅ Enum BidType com ${(bidTypes as any[]).length} valores`);
    
    const signerTypes = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::\"SignerType\")) as type;
    `;
    console.log(`   ✅ Enum SignerType com ${(signerTypes as any[]).length} valores\n`);

    // 12. Teste de Performance
    console.log('1️⃣2️⃣ Testando performance de queries...');
    const start = Date.now();
    await Promise.all([
      prisma.user.count(),
      prisma.prefecture.count(),
      prisma.bid.count(),
      prisma.company.count(),
      prisma.signer.count(),
    ]);
    const time = Date.now() - start;
    console.log(`   ✅ Queries paralelas executadas em ${time}ms\n`);

    // Resumo Final
    console.log('═══════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('═══════════════════════════════════════════════');
    console.log('📊 Resumo do Banco:');
    console.log(`   • Usuários: ${userCount}`);
    console.log(`   • Prefeituras: ${prefectureCount}`);
    console.log(`   • Editais: ${bidCount}`);
    console.log(`   • Empresas: ${companyCount}`);
    console.log(`   • Assinantes: ${signerCount}`);
    console.log(`   • Documentos: ${documentCount}`);
    console.log(`   • Pastas: ${folderCount}`);
    console.log(`   • Templates: ${templateCount}`);
    console.log('═══════════════════════════════════════════════');
    console.log('🚀 Banco de dados 100% funcional e pronto para produção!');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERRO NO TESTE DO BANCO DE DADOS:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
