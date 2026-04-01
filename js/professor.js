async function enviar(){
const nome=document.getElementById('nome').value;
const email=document.getElementById('email').value;
const {error}=await supabase.from('professores').insert([{nome,email}]);
if(error){alert("Erro");return;}
alert("Enviado");
}