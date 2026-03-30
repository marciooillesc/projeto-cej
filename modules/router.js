/**
 * modules/router.js
 * Roteamento SPA — troca de views sem recarregar a página.
 */

import { setEstado, getEstado } from './state.js';

const _rotas = new Map();
let _containerEl = null;

/**
 * Inicializa o roteador.
 * @param {HTMLElement} container - elemento onde as views são renderizadas
 */
export function inicializarRouter(container) {
  _containerEl = container;
}

/**
 * Registra uma rota.
 * @param {string} nome - identificador da rota
 * @param {Function} handlerFn - async fn(container, params) que preenche o container
 */
export function registrarRota(nome, handlerFn) {
  _rotas.set(nome, handlerFn);
}

/**
 * Navega para uma rota, executando seu handler.
 * @param {string} nome - rota registrada
 * @param {Object} params - parâmetros opcionais passados ao handler
 */
export async function navegar(nome, params = {}) {
  if (!_containerEl) {
    console.error('[router] Container não inicializado. Chame inicializarRouter() primeiro.');
    return;
  }

  const handler = _rotas.get(nome);
  if (!handler) {
    console.warn(`[router] Rota "${nome}" não encontrada.`);
    return;
  }

  setEstado({ sidebarAtiva: nome });

  try {
    await handler(_containerEl, params);
  } catch (err) {
    console.error(`[router] Erro ao navegar para "${nome}":`, err);
    _containerEl.innerHTML = `
      <div class="aviso-erro">
        <span>⚠️</span>
        <div><strong>Erro ao carregar view</strong><br /><span>${err.message}</span></div>
      </div>
    `;
  }
}
