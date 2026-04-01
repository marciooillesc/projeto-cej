import { supabase } from "./supabase.js";

export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert(error.message);
    return null;
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (erroPerfil || !perfil) {
    alert("Erro ao carregar perfil");
    return null;
  }

  if (perfil.status !== "aprovado") {
    alert("Aguardando aprovação");
    return null;
  }

  return perfil;
}
