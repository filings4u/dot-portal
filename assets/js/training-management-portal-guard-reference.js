(()=>{'use strict';
const KEY='s4u-management-entry-training-v1',PORTAL='training',ENTERPRISE='https://enterprise.screenings4u.com/portal-selector.html';
function redirect(reason){try{sessionStorage.removeItem(KEY)}catch{}const u=ENTERPRISE+'?reason='+encodeURIComponent(reason||'selector_required')+'&portal='+PORTAL;location.replace(u)}
async function validate(){const token=sessionStorage.getItem(KEY);if(!token){redirect('selector_required');return false}const c=window.trainingSupabase;if(!c){redirect('portal_client_unavailable');return false}const host=location.host.toLowerCase();const {data,error}=await c.functions.invoke('management-portal-handoff',{body:{action:'validate',portal_session_token:token,portal_code:PORTAL,host}});if(error||!data?.valid){try{await c.auth.signOut({scope:'local'})}catch{}redirect(data?.error||error?.message||'portal_session_invalid');return false}window.TRAINING_MANAGEMENT_ENTRY=data;return true}
window.TrainingPortalGuard=Object.freeze({validate,clear:()=>{try{sessionStorage.removeItem(KEY)}catch{}},key:KEY,portal:PORTAL});
})();
