/**
 * features/academico/alunos.js
 * Área do Aluno — ver conteúdos, fazer simulados e atividades.
 */

import { getEstado } from '../../modules/state.js';
import { buscarConteudos, filtrarPorTurma } from '../../modules/api.js';
import {
  htmlLoading, htmlVazio, htmlErro, htmlBadgeTipo, formatarData,
  htmlDetalheConteudo, inicializarSimulado
} from '../../modules/ui.js';

export async function renderAlunos(container) {
  const { usuario } = getEstado();
  if (!usuario) { container.innerHTML = htmlErro('Você precisa estar logado.'); return; }
  if (usuario.tipo !== 'aluno' && usuario.tipo !== 'admin') {
    container.innerHTML = htmlErro('Acesso restrito a alunos.');
    return;
  }
  container.innerHTML = htmlLoading('Carregando atividades…');
  try {
    const todosConteudos = await buscarConteudos();
    // Filtra automaticamente pela turma do aluno
    const conteudos = usuario.turma
      ? todosConteudos.filter(c => c.turma === usuario.turma)
      : todosConteudos;
    _renderDashboard(container, conteudos, usuario);
  } catch (e) {
    container.innerHTML = htmlErro(e.message);
  }
}

/* ── DASHBOARD ──────────────────────────────────────────────────────────────── */
function _renderDashboard(container, conteudos, usuario) {
  const simulados = conteudos.filter(c => c.tipo === 'simulado').length;

  container.innerHTML = `
    <div class="page-header">
      <span class="page-header__eyebrow">Aluno</span>
      <h1 class="page-header__titulo">Olá, ${_esc(usuario.nome.split(' ')[0])} 📚</h1>
      <p class="page-header__desc">${usuario.turma ? `Turma: <strong>${_esc(usuario.turma)}</strong>` : 'Aqui estão seus conteúdos e atividades disponíveis.'}</p>
    </div>

    <div class="prof-stats">
      <div class="prof-stat">
        <span class="prof-stat__num">${conteudos.length}</span>
        <span class="prof-stat__label">Disponíveis</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat__num">${simulados}</span>
        <span class="prof-stat__label">Simulados</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat__num">${conteudos.filter(c=>c.tipo==='atividade').length}</span>
        <span class="prof-stat__label">Atividades</span>
      </div>
    </div>

    <!-- Tabs por tipo -->
    <div class="prof-tabs" style="margin-top:.5rem">
      <button class="prof-tab ativo" data-tab="todos">Todos</button>
      <button class="prof-tab" data-tab="conteudo">Conteúdos</button>
      <button class="prof-tab" data-tab="atividade">Atividades</button>
      <button class="prof-tab" data-tab="material">Materiais</button>
      <button class="prof-tab" data-tab="simulado">Simulados</button>
    </div>

    <div id="aluno-painel" class="prof-painel ativo">
      ${_htmlGrid(conteudos)}
    </div>
  `;

  _bindFiltros(container, conteudos, usuario);
}

/* ── GRID DE CONTEÚDOS ───────────────────────────────────────────────────────── */
function _htmlGrid(conteudos) {
  if (!conteudos.length) return htmlVazio({ icone:'📭', titulo:'Nenhum conteúdo disponível', desc:'Novos conteúdos aparecerão aqui quando forem publicados.' });

  return `
    <div id="aluno-lista">
      ${conteudos.map((c, i) => `
        <div class="conteudo-item card--clicavel aluno-item" data-idx="${i}" data-tipo="${c.tipo}">
          ${htmlBadgeTipo(c.tipo)}
          <div class="conteudo-item__info">
            <div class="conteudo-item__titulo">${_esc(c.titulo)}</div>
            <div class="conteudo-item__meta">
              ${c.professor ? `<span>👤 ${_esc(c.professor)}</span>` : ''}
              ${c.materia   ? `<span class="conteudo-item__meta-sep"></span><span>${_esc(c.materia)}</span>` : ''}
              ${c.turma     ? `<span class="conteudo-item__meta-sep"></span><span>🏫 ${_esc(c.turma)}</span>` : ''}
              ${c.data_de_publicacao ? `<span class="conteudo-item__meta-sep"></span><span>${formatarData(c.data_de_publicacao)}</span>` : ''}
            </div>
          </div>
          <div class="conteudo-item__acoes">
            <button class="btn btn--ghost btn--sm" data-open="${i}">
              ${c.tipo === 'simulado' ? '🧠 Fazer' : 'Abrir'}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── FILTROS ─────────────────────────────────────────────────────────────────── */
function _bindFiltros(container, conteudos, usuario) {
  let tipoAtivo  = 'todos';

  function atualizar() {
    let lista = conteudos;
    if (tipoAtivo !== 'todos') lista = lista.filter(c => c.tipo === tipoAtivo);

    const painel = document.getElementById('aluno-painel');
    painel.innerHTML = _htmlGrid(lista);
    _bindItens(container, lista, conteudos, usuario);
  }

  // Turma já filtrada automaticamente pelo perfil do aluno

  // Filtro tipo
  container.querySelectorAll('.prof-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.prof-tab').forEach(t => t.classList.remove('ativo'));
      tab.classList.add('ativo');
      tipoAtivo = tab.dataset.tab;
      atualizar();
    });
  });

  _bindItens(container, conteudos, conteudos, usuario);
}

function _bindItens(container, listaFiltrada, todosConteudos, usuario) {
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const item = listaFiltrada[+btn.dataset.open];
      _abrirDetalhe(container, item, todosConteudos, usuario);
    });
  });
}

/* ── DETALHE ─────────────────────────────────────────────────────────────────── */
function _abrirDetalhe(container, item, todosConteudos, usuario) {
  const painel = document.getElementById('aluno-painel');
  painel.innerHTML = htmlDetalheConteudo(item);

  if (item.questoes?.length) inicializarSimulado(item.questoes);

  document.getElementById('btn-detalhe-voltar')?.addEventListener('click', () => {
    _renderDashboard(container, todosConteudos, usuario);
  });
}

/* ── UTIL ────────────────────────────────────────────────────────────────────── */

function _esc(str) {
  if (typeof str !== 'string') return str ?? '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
