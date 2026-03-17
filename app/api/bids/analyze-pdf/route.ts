import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    // Ler o nome do arquivo para sugerir número e título
    const fileName = file.name;
    console.log("Analisando arquivo:", fileName);

    // Extrair informações do nome do arquivo
    const suggestions = analyzeFileName(fileName);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Erro ao analisar PDF:", error);
    return NextResponse.json(
      { error: "Erro ao analisar arquivo" },
      { status: 500 }
    );
  }
}

function analyzeFileName(fileName: string): {
  number: string;
  title: string;
  type: string;
} {
  // Remove extensão
  const nameWithoutExt = fileName.replace(/\.(pdf|PDF)$/, "");
  
  // Padrões comuns de editais brasileiros
  const patterns = {
    // Padrão: "001/2026" ou "001-2026" ou "001_2026"
    number: /(\d{1,4})[\/\-_](\d{4})/,
    
    // Tipos de edital
    pregao: /(pregão|pregao)/i,
    dispensa: /dispensa/i,
    inexigibilidade: /inexigibilidade/i,
    concorrencia: /concorrência|concorrencia/i,
    chamada: /chamada.?pública|chamada.?publica/i,
    credenciamento: /credenciamento/i,
    leilao: /leilão|leilao/i,
    tomada: /tomada.?de.?preços|tomada.?de.?precos/i,
  };

  // Tentar extrair número
  let number = "";
  const numberMatch = nameWithoutExt.match(patterns.number);
  if (numberMatch) {
    number = `${numberMatch[1]}/${numberMatch[2]}`;
  } else {
    // Tentar encontrar apenas números no início
    const simpleNumber = nameWithoutExt.match(/^(\d{1,4})/);
    if (simpleNumber) {
      const year = new Date().getFullYear();
      number = `${simpleNumber[1]}/${year}`;
    }
  }

  // Identificar tipo
  let type = "PREGAO_ELETRONICO";
  let typeText = "";
  
  if (patterns.pregao.test(nameWithoutExt)) {
    type = "PREGAO_ELETRONICO";
    typeText = "Pregão Eletrônico";
  } else if (patterns.dispensa.test(nameWithoutExt)) {
    type = "DISPENSA";
    typeText = "Dispensa";
  } else if (patterns.inexigibilidade.test(nameWithoutExt)) {
    type = "INEXIGIBILIDADE";
    typeText = "Inexigibilidade";
  } else if (patterns.concorrencia.test(nameWithoutExt)) {
    type = "CONCORRENCIA";
    typeText = "Concorrência";
  } else if (patterns.chamada.test(nameWithoutExt)) {
    type = "CHAMADA_PUBLICA";
    typeText = "Chamada Pública";
  } else if (patterns.credenciamento.test(nameWithoutExt)) {
    type = "CREDENCIAMENTO";
    typeText = "Credenciamento";
  } else if (patterns.leilao.test(nameWithoutExt)) {
    type = "LEILAO";
    typeText = "Leilão";
  } else if (patterns.tomada.test(nameWithoutExt)) {
    type = "TOMADA_PRECOS";
    typeText = "Tomada de Preços";
  }

  // Gerar título sugerido
  let title = "";
  
  // Remover número e tipo do nome para extrair o objeto
  let cleanName = nameWithoutExt
    .replace(patterns.number, "")
    .replace(/pregão|pregao|eletrônico|eletronico/gi, "")
    .replace(/dispensa|inexigibilidade|concorrência|concorrencia/gi, "")
    .replace(/chamada.?pública|chamada.?publica/gi, "")
    .replace(/credenciamento|leilão|leilao/gi, "")
    .replace(/tomada.?de.?preços|tomada.?de.?precos/gi, "")
    .replace(/[_\-\.]/g, " ")
    .trim();

  // Capitalizar e limpar
  cleanName = cleanName
    .split(" ")
    .filter(word => word.length > 2)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  if (cleanName && typeText) {
    title = `${typeText} ${number ? number + " - " : ""}${cleanName}`;
  } else if (typeText && number) {
    title = `${typeText} ${number}`;
  } else if (cleanName) {
    title = cleanName;
  } else {
    title = nameWithoutExt.replace(/[_\-]/g, " ").trim();
  }

  return {
    number: number || "",
    title: title || nameWithoutExt,
    type,
  };
}
