/**
 * features/jogos/index.js
 * Registro central de jogos.
 * Para adicionar um novo jogo: importar e registrar aqui.
 */

import * as ExemploJogo from './exemplo-jogo.js';
import * as DigitacaoJogo from './digitacao-jogo.js';
import * as CacaPalavras from './caca-palavras.js';

/**
 * Catálogo de jogos registrados.
 * Cada entrada segue o contrato: { id, nome, descricao, emoji, modulo }
 * O módulo deve exportar: render(container) e init(container)
 */
export const JOGOS = [
  {
    id: 'caca-palavras',
    nome: 'Caça-Palavras',
    descricao: '5 níveis do Infantil ao Expert',
    emoji: '🔤',
    modulo: CacaPalavras,
  },
  {
    id: 'digitacao',
    nome: 'Velocidade de Digitação',
    descricao: 'Teste sua velocidade no teclado',
    emoji: '⌨️',
    modulo: DigitacaoJogo,
  },
  {
    id: 'exemplo',
    nome: 'Jogo Exemplo',
    descricao: 'Template base para novos jogos',
    emoji: '🧩',
    modulo: ExemploJogo,
  },
];

/**
 * Busca um jogo pelo ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function buscarJogo(id) {
  return JOGOS.find(j => j.id === id) ?? null;
}