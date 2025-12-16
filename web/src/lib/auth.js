export function getAuth(){
  const raw = localStorage.getItem("uts_auth")
  if(!raw) return { loggedIn:false, role:null, user:null }
  try { return JSON.parse(raw) } catch { return { loggedIn:false, role:null, user:null } }
}
export function setAuth(a){ localStorage.setItem("uts_auth", JSON.stringify(a)) }
export function logout(){ localStorage.removeItem("uts_auth") }
