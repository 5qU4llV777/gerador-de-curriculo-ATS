#!/usr/bin/env node

/**
 * Gerador de Currículos ATS-friendly
 * ----------------------------------
 * Gera um PDF de currículo em layout de coluna única, com texto real
 * (não é imagem), fontes padrão e sem tabelas/caixas de texto/ícones —
 * tudo pensado para ser lido corretamente por sistemas de rastreamento
 * de candidatos (ATS).
 *
 * Uso:
 *   node gerar-curriculo.js caminho/para/dados.json [saida.pdf]
 *
 * Se nenhum argumento for passado, usa data/exemplo.json
 */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ---------- Configurações de layout (ajustáveis) ----------
const CONFIG = {
  pageSize: "A4",
  margin: 50,
  fontRegular: "Helvetica",
  fontBold: "Helvetica-Bold",
  fontItalic: "Helvetica-Oblique",
  cores: {
    texto: "#1a1a1a",
    subtitulo: "#444444",
    linha: "#999999",
  },
  tamanhos: {
    nome: 20,
    titulo: 12,
    secao: 12,
    cargo: 11,
    corpo: 10,
    pequeno: 9,
  },
};

// ---------- Funções utilitárias ----------

function validarDados(dados) {
  const erros = [];
  if (!dados.nome) erros.push("campo 'nome' é obrigatório");
  if (!dados.contato || !dados.contato.email) {
    erros.push("campo 'contato.email' é obrigatório");
  }
  if (!Array.isArray(dados.experiencias)) {
    erros.push("campo 'experiencias' deve ser uma lista (pode ser vazia)");
  }
  if (erros.length) {
    throw new Error("Dados inválidos:\n- " + erros.join("\n- "));
  }
}

function linhaSeparadora(doc, y) {
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(0.75)
    .strokeColor(CONFIG.cores.linha)
    .stroke();
}

function tituloSecao(doc, texto) {
  doc.moveDown(0.8);
  doc
    .font(CONFIG.fontBold)
    .fontSize(CONFIG.tamanhos.secao)
    .fillColor(CONFIG.cores.texto)
    .text(texto.toUpperCase());
  linhaSeparadora(doc, doc.y + 2);
  doc.moveDown(0.6);
}

// ---------- Construção do PDF ----------

function gerarPDF(dados, caminhoSaida) {
  validarDados(dados);

  const doc = new PDFDocument({
    size: CONFIG.pageSize,
    margins: {
      top: CONFIG.margin,
      bottom: CONFIG.margin,
      left: CONFIG.margin,
      right: CONFIG.margin,
    },
    // Metadados também ajudam alguns ATS a identificar o documento
    info: {
      Title: `Curriculo - ${dados.nome}`,
      Author: dados.nome,
      Subject: dados.titulo || "Curriculo",
    },
  });

  doc.pipe(fs.createWriteStream(caminhoSaida));

  const larguraUtil =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // --- Cabeçalho: nome, título e contato (tudo em texto simples) ---
  doc
    .font(CONFIG.fontBold)
    .fontSize(CONFIG.tamanhos.nome)
    .fillColor(CONFIG.cores.texto)
    .text(dados.nome);

  if (dados.titulo) {
    doc
      .font(CONFIG.fontRegular)
      .fontSize(CONFIG.tamanhos.titulo)
      .fillColor(CONFIG.cores.subtitulo)
      .text(dados.titulo);
  }

  doc.moveDown(0.4);

  const contato = dados.contato || {};
  const linhasContato = [
    contato.localizacao,
    contato.telefone,
    contato.email,
    contato.linkedin,
    contato.portfolio,
  ]
    .filter(Boolean)
    .join("  |  ");

  doc
    .font(CONFIG.fontRegular)
    .fontSize(CONFIG.tamanhos.pequeno)
    .fillColor(CONFIG.cores.subtitulo)
    .text(linhasContato);

  linhaSeparadora(doc, doc.y + 8);
  doc.moveDown(1);

  // --- Resumo profissional ---
  if (dados.resumo) {
    tituloSecao(doc, "Resumo Profissional");
    doc
      .font(CONFIG.fontRegular)
      .fontSize(CONFIG.tamanhos.corpo)
      .fillColor(CONFIG.cores.texto)
      .text(dados.resumo, { width: larguraUtil, align: "left" });
  }

  // --- Experiência profissional ---
  if (dados.experiencias && dados.experiencias.length) {
    tituloSecao(doc, "Experiência Profissional");

    dados.experiencias.forEach((exp, idx) => {
      // Cargo (esquerda) — datas mantidas no fluxo normal de texto,
      // sem usar tabelas ou colunas para não quebrar o parser do ATS
      doc
        .font(CONFIG.fontBold)
        .fontSize(CONFIG.tamanhos.cargo)
        .fillColor(CONFIG.cores.texto)
        .text(exp.cargo || "");

      const empresaLinha = [exp.empresa, exp.localizacao]
        .filter(Boolean)
        .join(" — ");
      const periodo = [exp.dataInicio, exp.dataFim]
        .filter(Boolean)
        .join(" - ");

      doc
        .font(CONFIG.fontItalic)
        .fontSize(CONFIG.tamanhos.corpo)
        .fillColor(CONFIG.cores.subtitulo)
        .text([empresaLinha, periodo].filter(Boolean).join("    "));

      doc.moveDown(0.3);

      (exp.descricoes || []).forEach((desc) => {
        doc
          .font(CONFIG.fontRegular)
          .fontSize(CONFIG.tamanhos.corpo)
          .fillColor(CONFIG.cores.texto)
          .text(`-  ${desc}`, {
            width: larguraUtil,
            indent: 0,
          });
      });

      if (idx < dados.experiencias.length - 1) doc.moveDown(0.6);
    });
  }

  // --- Educação ---
  if (dados.educacao && dados.educacao.length) {
    tituloSecao(doc, "Educação");

    dados.educacao.forEach((ed) => {
      doc
        .font(CONFIG.fontBold)
        .fontSize(CONFIG.tamanhos.cargo)
        .fillColor(CONFIG.cores.texto)
        .text(ed.curso || "");

      const instLinha = [ed.instituicao, ed.localizacao]
        .filter(Boolean)
        .join(" — ");

      doc
        .font(CONFIG.fontItalic)
        .fontSize(CONFIG.tamanhos.corpo)
        .fillColor(CONFIG.cores.subtitulo)
        .text([instLinha, ed.dataConclusao].filter(Boolean).join("    "));

      doc.moveDown(0.4);
    });
  }

  // --- Habilidades ---
  if (dados.habilidades && dados.habilidades.length) {
    tituloSecao(doc, "Habilidades");
    doc
      .font(CONFIG.fontRegular)
      .fontSize(CONFIG.tamanhos.corpo)
      .fillColor(CONFIG.cores.texto)
      .text(dados.habilidades.join("  •  "), { width: larguraUtil });
  }

  // --- Certificações ---
  if (dados.certificacoes && dados.certificacoes.length) {
    tituloSecao(doc, "Certificações");
    dados.certificacoes.forEach((c) => {
      doc
        .font(CONFIG.fontRegular)
        .fontSize(CONFIG.tamanhos.corpo)
        .fillColor(CONFIG.cores.texto)
        .text(`-  ${c}`, { width: larguraUtil });
    });
  }

  // --- Idiomas ---
  if (dados.idiomas && dados.idiomas.length) {
    tituloSecao(doc, "Idiomas");
    doc
      .font(CONFIG.fontRegular)
      .fontSize(CONFIG.tamanhos.corpo)
      .fillColor(CONFIG.cores.texto)
      .text(dados.idiomas.join("  |  "), { width: larguraUtil });
  }

  doc.end();
}

// ---------- Execução via linha de comando ----------

function main() {
  const argDados = process.argv[2] || path.join(__dirname, "data", "exemplo.json");
  const caminhoAbsoluto = path.resolve(argDados);

  if (!fs.existsSync(caminhoAbsoluto)) {
    console.error(`Arquivo de dados não encontrado: ${caminhoAbsoluto}`);
    process.exit(1);
  }

  let dados;
  try {
    dados = JSON.parse(fs.readFileSync(caminhoAbsoluto, "utf-8"));
  } catch (e) {
    console.error("Erro ao ler/parsear o JSON de entrada:", e.message);
    process.exit(1);
  }

  const nomeArquivo =
    process.argv[3] ||
    `${(dados.nome || "curriculo").replace(/\s+/g, "_")}_Curriculo.pdf`;
  const caminhoSaida = path.resolve(nomeArquivo);

  try {
    gerarPDF(dados, caminhoSaida);
    console.log(`✅ Currículo gerado com sucesso: ${caminhoSaida}`);
  } catch (e) {
    console.error("Erro ao gerar o currículo:", e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { gerarPDF, validarDados };
