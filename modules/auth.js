/**
 * modules/auth.js
 * Autenticação via Supabase Auth + perfil da tabela usuarios.
 */

import { supabase } from './supabase.js';
import { setEstado } from './state.js';

/**
 * Faz login, carrega perfil e salva no estado global.
 * Retorna { perfil } ou { erro: string }
 */
export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: error.message };

  const perfil = await _carregarPerfil(data.user.id);
  if (!perfil) return { erro: 'Erro ao carregar perfil. Contate o administrador.' };
  if (!perfil.isAdmin) {
    if (perfil.status === 'pendente')  return { erro: 'Cadastro aguardando aprovação.' };
    if (perfil.status === 'reprovado') return { erro: 'Cadastro reprovado. Contate o administrador.' };
  }

  setEstado({ usuario: perfil });
  return { perfil };
}

/**
 * Encerra sessão e limpa estado.
 */
export async function logout() {
  await supabase.auth.signOut();
  setEstado({ usuario: null });
}

/**
 * Restaura sessão ao recarregar a página.
 * Retorna perfil ou null.
 */
export async function restaurarSessao() {
  const { data } = await supabase.auth.getSession();
  if (!data?.session?.user) return null;

  const perfil = await _carregarPerfil(data.session.user.id);
  if (perfil && (perfil.isAdmin || perfil.status === 'aprovado')) {
    setEstado({ usuario: perfil });
    return perfil;
  }
  return null;
}

const ADMIN_EMAIL = 'marciooillesc@gmail.com';

async function _carregarPerfil(userId) {
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // Se encontrou na tabela, aplica privilégios se for admin
  if (data) return _aplicarPrivilegiosAdmin(data);

  // Não encontrou na tabela — verifica se é o admin pelo Auth
  // (pode acontecer se a RLS bloquear ou o registro não existir ainda)
  const { data: sessao } = await supabase.auth.getSession();
  const email = sessao?.session?.user?.email;
  if (email === ADMIN_EMAIL) {
    return {
      id: userId,
      email: ADMIN_EMAIL,
      nome: 'Márcio (Admin)',
      tipo: 'admin',
      status: 'aprovado',
      isAdmin: true,
      isProfessor: true,
      isAluno: true,
    };
  }

  return null;
}

function _aplicarPrivilegiosAdmin(perfil) {
  if (perfil?.email !== ADMIN_EMAIL) return perfil;
  return { ...perfil, tipo: 'admin', status: 'aprovado', isAdmin: true, isProfessor: true, isAluno: true };
}
