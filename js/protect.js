async function check(){
const {data}=await supabase.auth.getUser();
if(!data.user){location.href="login.html";}
}
check();