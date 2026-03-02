/**
 * Script de Verificação Completa para Deploy na Vercel
 * Testa banco de dados, configurações e prontidão para produção
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) {
  results.push({ name, status, message, details });
}

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    addResult('Database Connection', 'pass', 'Conexão com PostgreSQL estabelecida');
    return true;
  } catch (error: any) {
    addResult('Database Connection', 'fail', 'Falha ao conectar ao banco', error.message);
    return false;
  }
}

async function testMigrationStatus() {
  try {
    const { stdout } = await execAsync('npx prisma migrate status');
    if (stdout.includes('Database schema is up to date')) {
      addResult('Database Migrations', 'pass', 'Todas migrações aplicadas');
      return true;
    } else {
      addResult('Database Migrations', 'warning', 'Migrações pendentes', stdout);
      return false;
    }
  } catch (error: any) {
    addResult('Database Migrations', 'fail', 'Erro ao verificar migrações', error.message);
    return false;
  }
}

async function testPrismaClient() {
  try {
    const userCount = await prisma.user.count();
    addResult('Prisma Client', 'pass', `Prisma Client funcionando (${userCount} usuários)`);
    return true;
  } catch (error: any) {
    addResult('Prisma Client', 'fail', 'Erro no Prisma Client', error.message);
    return false;
  }
}

async function testEnvVariables() {
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    addResult('Environment Variables', 'pass', 'Variáveis obrigatórias configuradas');
    return true;
  } else {
    addResult('Environment Variables', 'fail', `Faltando: ${missing.join(', ')}`);
    return false;
  }
}

async function testFileStructure() {
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'prisma/schema.prisma',
    '.env',
    '.gitignore',
    'README.md',
  ];
  
  const missing = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
  
  if (missing.length === 0) {
    addResult('File Structure', 'pass', 'Todos arquivos necessários presentes');
    return true;
  } else {
    addResult('File Structure', 'warning', `Arquivos faltando: ${missing.join(', ')}`);
    return false;
  }
}

async function testPackageJson() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    
    // Verificar scripts necessários
    if (pkg.scripts.build && pkg.scripts.start) {
      addResult('Package.json Scripts', 'pass', 'Scripts de build e start configurados');
    } else {
      addResult('Package.json Scripts', 'fail', 'Scripts de build ou start faltando');
      return false;
    }
    
    // Verificar dependências críticas
    const critical = ['next', 'react', '@prisma/client', 'next-auth'];
    const missing = critical.filter(dep => !pkg.dependencies[dep]);
    
    if (missing.length === 0) {
      addResult('Package.json Dependencies', 'pass', 'Dependências críticas instaladas');
    } else {
      addResult('Package.json Dependencies', 'fail', `Dependências faltando: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error: any) {
    addResult('Package.json', 'fail', 'Erro ao ler package.json', error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  try {
    const models = [
      { name: 'User', table: 'users' },
      { name: 'Prefecture', table: 'prefectures' },
      { name: 'Bid', table: 'bids' },
      { name: 'Company', table: 'companies' },
      { name: 'Signer', table: 'signers' },
      { name: 'Document', table: 'documents' },
      { name: 'Folder', table: 'folders' },
      { name: 'Template', table: 'templates' },
    ];
    
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.prefecture.count(),
      prisma.bid.count(),
      prisma.company.count(),
      prisma.signer.count(),
      prisma.document.count(),
      prisma.folder.count(),
      prisma.template.count(),
    ]);
    
    const summary = models.map((m, i) => `${m.name}: ${counts[i]}`).join(', ');
    addResult('Database Schema', 'pass', 'Todos modelos acessíveis', summary);
    return true;
  } catch (error: any) {
    addResult('Database Schema', 'fail', 'Erro ao acessar modelos', error.message);
    return false;
  }
}

async function testAdminUser() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (admin) {
      addResult('Admin User', 'pass', `Usuário admin encontrado: ${admin.email}`);
      return true;
    } else {
      addResult('Admin User', 'warning', 'Nenhum usuário admin encontrado - executar seed');
      return false;
    }
  } catch (error: any) {
    addResult('Admin User', 'fail', 'Erro ao verificar admin', error.message);
    return false;
  }
}

async function testDockerContainer() {
  try {
    const { stdout } = await execAsync('docker ps | grep postgres');
    if (stdout) {
      addResult('Docker PostgreSQL', 'pass', 'Container PostgreSQL rodando');
      return true;
    } else {
      addResult('Docker PostgreSQL', 'warning', 'Container não encontrado (pode estar usando banco remoto)');
      return true; // Não é erro crítico
    }
  } catch (error) {
    addResult('Docker PostgreSQL', 'warning', 'Docker não disponível ou container parado');
    return true; // Não é erro crítico
  }
}

function printReport() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        RELATÓRIO DE VERIFICAÇÃO - DEPLOY VERCEL                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const warn = results.filter(r => r.status === 'warning').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   📝 ${result.details}`);
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`📊 RESUMO: ${pass} Passou | ${warn} Avisos | ${fail} Falhou`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (fail === 0) {
    console.log('');
    console.log('🎉 PROJETO PRONTO PARA DEPLOY NA VERCEL! 🚀');
    console.log('');
    console.log('📋 Próximos Passos:');
    console.log('   1. Criar banco PostgreSQL de produção');
    console.log('   2. git add . && git commit && git push');
    console.log('   3. Importar projeto na Vercel');
    console.log('   4. Configurar DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL');
    console.log('   5. Deploy!');
    console.log('');
    console.log('📖 Veja DEPLOY.md para instruções detalhadas');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️  ATENÇÃO: Corrija os erros antes do deploy!');
    console.log('');
  }

  return fail === 0;
}

async function runAllTests() {
  console.log('🔍 Iniciando verificação completa do projeto...\n');

  await testEnvVariables();
  await testFileStructure();
  await testPackageJson();
  await testDockerContainer();
  
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    await testMigrationStatus();
    await testPrismaClient();
    await testDatabaseSchema();
    await testAdminUser();
  }

  const success = printReport();
  
  await prisma.$disconnect();
  process.exit(success ? 0 : 1);
}

runAllTests();
