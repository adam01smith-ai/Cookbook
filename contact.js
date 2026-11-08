(()=>{
'use strict';
const form=document.getElementById('contact-form');
const fields=document.getElementById('contact-fields');
const status=document.getElementById('contact-status');
if(!form||!fields||!status)return;
const id=window.CookbookContact?.formId;
let ready=typeof id==='string' && /^[a-zA-Z0-9_-]{16,128}$/.test(id);
if(ready){
 form.action='https://formsubmit.co/'+encodeURIComponent(id);
 fields.disabled=false;
 status.textContent='Send a private message. FormSubmit may ask you to complete a spam check before sending.';
}
form.addEventListener('submit',event=>{
 if(!ready){event.preventDefault();status.textContent='The contact form is not connected yet. Your message has not been sent.';return;}
 if(!form.reportValidity()){event.preventDefault();return;}
 // Native POST keeps the provider's spam check and delivery status visible.
 // Do not claim delivery locally or clear the message before provider confirmation.
});
})();
