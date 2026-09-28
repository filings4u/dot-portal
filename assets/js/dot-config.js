/* screenings4u DOT Management Portal — standalone configuration */
(()=>{
  "use strict";
  const config=Object.freeze({
    portalName:"screenings4u DOT Management Portal",
    portalHost:"dot-portal.screenings4u.com",
    managedWebsite:"https://dot.screenings4u.com",
    supabaseUrl:"https://elpbnytpciqnbexiaebp.supabase.co",
    supabaseAnonKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYm55dHBjaXFuYmV4aWFlYnAiLCJyZWYiOiJlbHBibnl0cGNpcW5iZXhpYWVicCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzkwMjk2MDM0LCJleHAiOjIxMDU4NzIwMzR9.kWzPDxpdeorkJJpP6pvt4LCP-W9uGGVAgcQVVheVuE8",
    staffContextFunction:"screenings4u-staff-context",
    roleContextFunction:"portal-access-context",
    /* Existing DOT-only backend adapter. Front-end files are completely separate from Enterprise. */
    managementFunction:"dot-enterprise-management",
    selectionFunction:"dot-selection-management",
    testingHandoffFunction:"dot-testing-handoff",
    inviteFunction:"dot-account-invite",
    storageKey:"s4u-dot-management-session"
  });
  window.DOT_PORTAL_CONFIG=config;
  if(window.supabase?.createClient){
    window.dotSupabase=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.sessionStorage,storageKey:config.storageKey}});
  } else console.error('[DOT Portal] Supabase JS is unavailable.');
})();
