/**
 * modules/api.js
 * Comunicação com o backend (Google Apps Script).
 * Trocar API_URL pela URL real do Web App.
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbySFUJ-ApoxwwG5EaoAcORbL2iaPj_r29-Xssi22ppxjKQidkU6aNikBmDh5eXvkswUGg/exec';

// Cache simples em memória para evitar requisições repetidas
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ── LEITURA ───────────────────────────────────────────────────────────────────

/**
 * Busca todos os conteúdos da planilha via Apps Script.
 * Compatível com { items: [] } e { itens: [] }.
 * Filtra automaticamente por data_de_publicacao e data_de_encerramento.
 *
 * @param {boolean} forcarRecarregar - ignora cache se true
 * @returns {Promise<Array>}
 */
export async function buscarConteudos(forcarRecarregar = false) {
  const cacheKey = 'conteudos';
  const cached = _cache.get(cacheKey);

  if (!forcarRecarregar && cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.dados;
  }

  if (!API_URL) {
    console.warn('[api] API_URL não configurada. Retornando dados de demonstração.');
    return _dadosDemostracao();
  }

  const resposta = await fetch(API_URL, { method: 'GET' });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
  }

  const json = await resposta.json();

  // Aceita tanto "items" quanto "itens" (compatibilidade com o script)
  const lista = json.items || json.itens;
  if (!lista || !Array.isArray(lista)) {
    throw new Error('Formato de resposta inesperado da API.');
  }

  // Normaliza cada item (parse de questoes, datas, etc.)
  const dados = lista.map(_normalizarItem).filter(_estaAtivo);

  _cache.set(cacheKey, { dados, ts: Date.now() });
  return dados;
}

/**
 * Normaliza um item recebido da API:
 * - Faz parse do campo questoes (vem como string JSON do Apps Script)
 * - Mapeia o formato de questões do script para o formato do simulado
 */
function _normalizarItem(item) {
  let questoes = null;

  if (item.questoes && typeof item.questoes === 'string' && item.questoes.trim() !== '') {
    try {
      const parsed = JSON.parse(item.questoes);
      // O script retorna { questoes: [ { numero, texto, opcoes, resposta } ] }
      // O simulado espera  [ { enunciado, alternativas, correta } ]
      if (parsed.questoes && Array.isArray(parsed.questoes)) {
        questoes = parsed.questoes.map(q => {
          // opcoes vem como ["A) texto", "B) texto", ...]
          const alternativas = (q.opcoes || []).map(op =>
            op.replace(/^[A-E]\)\s*/, '').trim()
          );
          // resposta vem como "B" — converte para índice numérico
          const letras = ['A', 'B', 'C', 'D', 'E'];
          const correta = letras.indexOf((q.resposta || 'A').trim().toUpperCase());
          return {
            enunciado: q.texto || q.enunciado || '',
            alternativas,
            correta: correta >= 0 ? correta : 0,
          };
        });
      }
    } catch (e) {
      console.warn('[api] Erro ao fazer parse das questões:', e);
    }
  }

  return { ...item, questoes };
}

/**
 * Verifica se um conteúdo está ativo com base nas datas.
 * - Sem datas → sempre visível
 * - Com data_de_publicacao → só exibe a partir dela
 * - Com data_de_encerramento → oculta após ela
 */
function _estaAtivo(item) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (item.data_de_publicacao && item.data_de_publicacao.trim() !== '') {
    const inicio = new Date(item.data_de_publicacao);
    if (!isNaN(inicio) && inicio > hoje) return false;
  }

  if (item.data_de_encerramento && item.data_de_encerramento.trim() !== '') {
    const fim = new Date(item.data_de_encerramento);
    if (!isNaN(fim) && fim < hoje) return false;
  }

  return true;
}

// ── ESCRITA ───────────────────────────────────────────────────────────────────

/**
 * Publica um novo conteúdo via POST.
 * O campo questoes é gerado automaticamente pelo Apps Script se tipo === 'simulado'.
 *
 * @param {Object} dados - campos do formulário
 * @returns {Promise<Object>} - { status: 'ok' } ou { status: 'erro', mensagem }
 */
export async function publicarConteudo(dados) {
  if (!API_URL) {
    throw new Error('API_URL não configurada.');
  }

  // Apps Script exige Content-Type: text/plain para evitar preflight CORS.
  // O doPost lê e.postData.contents que continua sendo JSON válido.
  // redirect: 'follow' é obrigatório — o Apps Script redireciona antes de responder.
  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dados),
    redirect: 'follow',
  });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
  }

  const json = await resposta.json();
  if (json.status !== 'ok') {
    throw new Error(json.mensagem || 'Erro desconhecido ao publicar.');
  }

  limparCache();
  return json;
}

/**
 * Remove um conteúdo via POST com ação "remover".
 * Requer adicionar suporte no doPost do Apps Script (ver comentário abaixo).
 *
 * No Apps Script, adicionar antes do appendRow():
 *
 *   if (dados.acao === 'remover') {
 *     const linhas = aba.getDataRange().getValues();
 *     for (let i = 1; i < linhas.length; i++) {
 *       if (linhas[i][5] === dados.titulo && linhas[i][1] === dados.professor) {
 *         aba.deleteRow(i + 1);
 *         return resposta({ status: 'ok' });
 *       }
 *     }
 *     return resposta({ status: 'erro', mensagem: 'Não encontrado' });
 *   }
 *
 * @param {string} titulo
 * @param {string} professor
 * @returns {Promise<Object>}
 */
export async function removerConteudo(titulo, professor) {
  if (!API_URL) {
    throw new Error('API_URL não configurada.');
  }

  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ acao: 'remover', titulo, professor }),
    redirect: 'follow',
  });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
  }

  const json = await resposta.json();
  if (json.status !== 'ok') {
    throw new Error(json.mensagem || 'Erro ao remover.');
  }

  limparCache();
  return json;
}

// ── FILTROS ───────────────────────────────────────────────────────────────────

export function filtrarPorProfessor(conteudos, professor) {
  if (!professor) return conteudos;
  return conteudos.filter(
    c => c.professor?.toLowerCase() === professor.toLowerCase()
  );
}

export function filtrarPorTipo(conteudos, tipo) {
  if (!tipo) return conteudos;
  return conteudos.filter(c => c.tipo === tipo);
}

export function filtrarPorTurma(conteudos, turma) {
  if (!turma) return conteudos;
  return conteudos.filter(
    c => c.turma?.toLowerCase() === turma.toLowerCase()
  );
}

export function listarProfessores(conteudos) {
  const set = new Set(conteudos.map(c => c.professor).filter(Boolean));
  return [...set].sort();
}

export function listarTurmas(conteudos) {
  const set = new Set(conteudos.map(c => c.turma).filter(Boolean));
  return [...set].sort();
}

// ── CACHE ─────────────────────────────────────────────────────────────────────

export function limparCache() {
  _cache.clear();
}

// ── DADOS DE DEMONSTRAÇÃO ─────────────────────────────────────────────────────
function _dadosDemostracao() {
  return [
    {
      professor: 'Prof. Márcio',
      materia: 'Tecnologia',
      turma: '7º Ano',
      tipo: 'conteudo',
      titulo: 'Introdução às Redes de Computadores',
      descricao: 'Conceitos fundamentais de redes: topologias, protocolos TCP/IP, modelo OSI e infraestrutura básica de LAN/WAN.',
      data_de_publicacao: '',
      data_de_encerramento: '',
      questoes: null,
    },
    {
      professor: 'Prof. Márcio',
      materia: 'Tecnologia',
      turma: '8º Ano',
      tipo: 'simulado',
      titulo: 'Simulado: Hardware e Componentes',
      descricao: 'Avalie seus conhecimentos sobre os principais componentes de um computador.',
      data_de_publicacao: '',
      data_de_encerramento: '',
      questoes: [
        {
          enunciado: 'Qual componente é responsável pelo processamento principal de um computador?',
          alternativas: ['Memória RAM', 'CPU (Processador)', 'HD / SSD', 'Placa de vídeo'],
          correta: 1,
        },
        {
          enunciado: 'O que significa a sigla RAM?',
          alternativas: ['Read Access Memory', 'Random Access Memory', 'Read And Manage', 'Rapid Access Module'],
          correta: 1,
        },
        {
          enunciado: 'Qual dispositivo armazena dados permanentemente mesmo sem energia?',
          alternativas: ['RAM', 'Cache', 'HD/SSD', 'Registradores'],
          correta: 2,
        },
      ],
    },
    {
      professor: 'Prof. Márcio',
      materia: 'Tecnologia',
      turma: '9º Ano',
      tipo: 'atividade',
      titulo: 'Atividade: Montagem de PC Virtual',
      descricao: 'Pesquise e monte uma configuração de computador completa com orçamento de R$3.000.',
      data_de_publicacao: '',
      data_de_encerramento: '',
      questoes: null,
    },
    {
      professor: 'Prof. Márcio',
      materia: 'Tecnologia',
      turma: '6º Ano',
      tipo: 'material',
      titulo: 'Material: Segurança Digital',
      descricao: 'Guia completo sobre segurança na internet: senhas fortes, golpes online, privacidade em redes sociais.',
      data_de_publicacao: '',
      data_de_encerramento: '',
      questoes: null,
    },
  ];
}
