import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const email = 'admin@signflow.com';
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: `Usuário ${email} não encontrado` },
        { status: 404 }
      );
    }

    // Atualizar o usuário para ativo e admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isActive: true,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário validado com sucesso!',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
    
  } catch (error) {
    console.error('Erro ao validar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao validar usuário' },
      { status: 500 }
    );
  }
}
