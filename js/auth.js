async function login(){
const email=document.getElementById('email').value;
const senha=document.getElementById('senha').value;
const {error}=await supabase.auth.signInWithPassword({email,password:senha});
if(error){alert("Erro");return;}
location.href="academico.html";
}