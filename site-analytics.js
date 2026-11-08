// Google Analytics is loaded only after a separate, unexpired analytics choice.
(()=>{
'use strict';
const ID='G-002QLTW2TV';
const DISABLE='ga-disable-'+ID;
const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
let script,loaded=false,configured=false,active=false,pageSent=false;
window[DISABLE]=true;

function clearCookies(){
 const names=['_ga','_ga_'+ID.slice(2)];
 const host=window.location.hostname;
 const domains=['',host,'.'+host];
 if(host.startsWith('www.'))domains.push(host.slice(4),'.'+host.slice(4));
 for(const name of names)for(const domain of domains){
  document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax; Secure'+(domain?'; Domain='+domain:'');
 }
}
function referrer(){try{return document.referrer?new URL(document.referrer).origin+'/':'';}catch{return '';}}
function sync(){
 const allowed=window.CookbookPrivacy?.allowed('analytics')===true;
 if(!allowed){
  window[DISABLE]=true;
  if(active){window.gtag('consent','update',denied);active=false;}
  if(script){script.remove();script=null;}
  clearCookies();
  return;
 }
 window[DISABLE]=false;
 if(!configured){
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag('consent','default',denied);
  window.gtag('set','ads_data_redaction',true);
  window.gtag('js',new Date());
 }
 if(!active){window.gtag('consent','update',{...denied,analytics_storage:'granted'});active=true;}
 if(!configured){
  const location=window.location.origin+window.location.pathname;
  window.gtag('set',{page_location:location,page_referrer:referrer()});
  window.gtag('config',ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
   cookie_expires:180*24*60*60,cookie_update:false,page_location:location,page_referrer:referrer()});
  configured=true;
 }
 if(!pageSent){
  window.gtag('event','page_view',{send_to:ID,page_title:document.title,
   page_location:window.location.origin+window.location.pathname,page_referrer:referrer()});
  pageSent=true;
 }
 if(!script&&!loaded){
  script=document.createElement('script');script.async=true;
  script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ID);
  script.onload=()=>{loaded=true;};
  script.onerror=()=>{window[DISABLE]=true;active=false;script?.remove();script=null;};
  document.head.append(script);
 }
}
window.addEventListener('adam-cooks-consentchange',sync);
sync();
})();
