/**
 * modules/state.js
 * Estado global da aplicação — fonte única de verdade.
 * Usa padrão pub/sub simples para reatividade.
 */

const _estado = {
  tela: 'inicial',       // 'inicial' | 'jogos' | 'academico'
  modo: null,            // 'jogos' | 'academico'
  sidebarAtiva: null,    // item ativo na sidebar
  professor: '',         // professor filtrado atual
  dadosApi: [],          // dados carregados da API
  carregando: false,
  erro: null,
};

const _assinantes = new Map();

/**
 * Retorna cópia do estado atual.
 * @returns {Object}
 */
export function getEstado() {
  return { ..._estado };
}

/**
 * Atualiza partes do estado e notifica assinantes.
 * @param {Object} novos - chaves/valores a atualizar
 */
export function setEstado(novos) {
  const chavesMudadas = [];

  for (const [chave, valor] of Object.entries(novos)) {
    if (_estado[chave] !== valor) {
      _estado[chave] = valor;
      chavesMudadas.push(chave);
    }
  }

  if (chavesMudadas.length === 0) return;

  // Notifica assinantes globais
  _notificar('*', { ..._estado }, chavesMudadas);

  // Notifica assinantes por chave
  for (const chave of chavesMudadas) {
    _notificar(chave, _estado[chave]);
  }
}

/**
 * Assina mudanças de estado.
 * @param {string} chave - chave do estado ou '*' para todas
 * @param {Function} callback
 * @returns {Function} - função de cancelamento
 */
export function assinar(chave, callback) {
  if (!_assinantes.has(chave)) {
    _assinantes.set(chave, new Set());
  }
  _assinantes.get(chave).add(callback);

  return () => {
    _assinantes.get(chave)?.delete(callback);
  };
}

function _notificar(chave, valor, extras) {
  _assinantes.get(chave)?.forEach(cb => {
    try {
      cb(valor, extras);
    } catch (e) {
      console.error(`[state] Erro no assinante de "${chave}":`, e);
    }
  });
}
