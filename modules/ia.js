export async function gerarSimuladoIA(dados){
  const res = await fetch("https://SEU-PROJETO.supabase.co/functions/v1/gerar-simulado",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(dados)
  });
  return await res.json();
}