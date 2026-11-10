(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RecipeTimerCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
class Timer {
 constructor(onFinish=()=>{},now=()=>Date.now()){this.onFinish=onFinish;this.now=now;this.close();}
 start(seconds,label){if(!Number.isFinite(seconds)||seconds<=0||seconds>86400)throw Error('Choose a timer between 1 second and 24 hours.');this.duration=Math.round(seconds*1000);this.remaining=this.duration;this.deadline=this.now()+this.remaining;this.label=String(label||'Cooking timer');this.state='running';return this.snapshot();}
 snapshot(){if(this.state==='running'){this.remaining=Math.max(0,this.deadline-this.now());if(this.remaining===0){this.state='finished';this.onFinish(this.label);}}return {state:this.state,label:this.label,remaining:this.remaining,duration:this.duration};}
 pause(){this.snapshot();if(this.state==='running')this.state='paused';return this.snapshot();}
 resume(){if(this.state==='paused'){this.deadline=this.now()+this.remaining;this.state='running';}return this.snapshot();}
 restart(){if(this.state!=='idle')return this.start(this.duration/1000,this.label);return this.snapshot();}
 close(){this.state='idle';this.label='';this.duration=0;this.remaining=0;this.deadline=0;}
}
return {Timer};
});

(function(api){api.durations=function(text){
text=String(text).replace(/(\d+)½/g,(_,n)=>String(Number(n)+.5)).replace(/(\d+)¼/g,(_,n)=>String(Number(n)+.25)).replace(/(\d+)¾/g,(_,n)=>String(Number(n)+.75)).replaceAll('½','0.5').replaceAll('¼','0.25').replaceAll('¾','0.75');
const result=[],seen=new Set();const pattern=/(\d+(?:\.\d+)?)\s*(?:[–—-]|to)?\s*(?:(\d+(?:\.\d+)?)\s*)?(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b(?:\s*(?:and\s*)?(\d+(?:\.\d+)?)\s*(minutes?|mins?))?/gi;
for(const match of text.matchAll(pattern)){const multiplier=/^h/i.test(match[3])?3600:/^m/i.test(match[3])?60:1;
const values=match[2]?[Number(match[1]),Number(match[2])]:[Number(match[1])];
for(const value of values){const seconds=Math.round(value*multiplier+(match[4]?Number(match[4])*60:0));if(seconds<=0||seconds>86400||seen.has(seconds))continue;seen.add(seconds);const label=match[2]?value+' '+match[3]:match[0].trim();result.push({seconds,text:label});}}
return result;};})(typeof module==='object'&&module.exports?module.exports:window.RecipeTimerCore);

if(typeof document!=='undefined')(function(){'use strict';function init(){
if(!document.querySelector('.steps')||document.getElementById('recipe-timer-preview'))return;
const panel=document.createElement('div');panel.innerHTML="<section id=\"recipe-timer-preview\" class=\"recipe-timer-tools\" aria-labelledby=\"recipe-timer-tools-heading\"><h2 id=\"recipe-timer-tools-heading\">Cooking timer</h2><p>Use the timer buttons in the method, or set your own.</p><div class=\"recipe-timer-row\"><button type=\"button\" data-timer-seconds=\"5\" data-timer-label=\"Alarm test\">Test finishing chime · 5 seconds</button><button type=\"button\" class=\"outline\" id=\"recipe-custom-open\" aria-expanded=\"false\" aria-controls=\"recipe-custom-timer\">Set a timer</button><label class=\"recipe-sound-label\"><input type=\"checkbox\" id=\"recipe-timer-sound\" checked>Sound on</label></div><form id=\"recipe-custom-timer\" hidden><label>Timer label<input id=\"recipe-custom-label\" maxlength=\"60\" value=\"Cooking timer\"></label><label>Minutes<input id=\"recipe-custom-minutes\" type=\"number\" min=\"0.1\" max=\"1440\" step=\"0.1\" value=\"5\" required></label><button type=\"submit\">Start timer</button></form><p class=\"recipe-timer-hint\">Keep this tab open. Locking your phone or switching apps may delay the chime. Cooking times are reminders; check the food as it cooks.</p><p id=\"recipe-timer-status\" role=\"status\" aria-live=\"polite\"></p></section>";const anchor=document.querySelector('.recipe-jumps')||document.querySelector('.recipe-layout')||document.querySelector('.steps');anchor.before(panel.firstElementChild);
const dock=document.createElement('div');dock.innerHTML="<aside id=\"recipe-timer-dock\" class=\"recipe-timer-dock\" aria-label=\"Cooking timer\" hidden><div class=\"recipe-clock-row\"><div><h2 id=\"recipe-timer-label\"></h2><span id=\"recipe-timer-state\">Cooking timer</span></div><output id=\"recipe-timer-time\" role=\"timer\" aria-live=\"off\">00:00</output></div><div class=\"recipe-timer-row\"><button type=\"button\" id=\"recipe-timer-pause\">Pause</button><button type=\"button\" class=\"outline\" id=\"recipe-timer-restart\">Restart</button><button type=\"button\" class=\"outline\" id=\"recipe-timer-close\">Close</button></div><p class=\"recipe-timer-hint\">Closing cancels the timer.</p><p id=\"recipe-timer-alert\" role=\"alert\" aria-live=\"assertive\"></p></aside>";document.body.append(dock.firstElementChild);
document.querySelectorAll('.steps .step').forEach((step,index)=>{
const copy=step.querySelector('.step-copy')||step.querySelector('p')||step;const times=RecipeTimerCore.durations(copy.textContent);
if(location.pathname.endsWith('/satay-beef-noodles.html')&&index===4)times.push({seconds:300,text:'5 minutes (suggested)'});
if(!times.length)return;const row=document.createElement('div');row.className='recipe-step-timers';
times.forEach(time=>{const button=document.createElement('button');button.type='button';button.className='recipe-step-timer';button.dataset.timerSeconds=time.seconds;button.dataset.timerLabel='Step '+(index+1)+' · '+time.text;button.textContent='Timer: '+time.text;row.append(button);});
(step.lastElementChild||step).append(row);
});
(()=>{
'use strict';
const root=document.getElementById('recipe-timer-preview'),dock=document.getElementById('recipe-timer-dock'),display=document.getElementById('recipe-timer-time'),label=document.getElementById('recipe-timer-label'),pause=document.getElementById('recipe-timer-pause'),status=document.getElementById('recipe-timer-status'),sound=document.getElementById('recipe-timer-sound'),custom=document.getElementById('recipe-custom-timer');
let audio,finishMessage='',lastState='',tones=[];
function unlock(){if(!sound.checked)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audio=audio||new Audio();audio.resume().catch(()=>{status.textContent='Sound could not be enabled. The visual timer will still work.';});}catch{status.textContent='Sound is unavailable in this browser. The visual timer will still work.';}}
function stopSound(){for(const node of tones){try{node.stop();}catch{}}tones=[];}
function chime(){if(!sound.checked)return;if(!audio||audio.state!=='running'){status.textContent='Timer finished. Sound was unavailable; keep the tab open and try the sound test.';return;}stopSound();const start=audio.currentTime;for(let repeat=0;repeat<2;repeat++)[660,880,1046].forEach((frequency,index)=>{const oscillator=audio.createOscillator(),gain=audio.createGain(),at=start+repeat*.95+index*.24;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(.12,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.21);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.23);tones.push(oscillator);});}
const timer=new RecipeTimerCore.Timer(name=>{finishMessage=name+' timer finished.';document.getElementById('recipe-timer-alert').textContent=finishMessage;chime();});
function format(ms){const seconds=Math.ceil(ms/1000),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;return (hours?hours+':'+String(minutes).padStart(2,'0'):String(minutes).padStart(2,'0'))+':'+String(rest).padStart(2,'0');}
function render(){const state=timer.snapshot();dock.hidden=state.state==='idle';document.body.classList.toggle('recipe-timer-open',!dock.hidden);if(dock.hidden)return;label.textContent=state.label;const text=format(state.remaining);if(display.textContent!==text)display.textContent=text;dock.classList.toggle('timer-finished',state.state==='finished');pause.textContent=state.state==='paused'?'Resume':'Pause';pause.disabled=state.state==='finished';if(lastState!==state.state){document.getElementById('recipe-timer-state').textContent=state.state==='finished'?'Timer finished':state.state==='paused'?'Paused':'Cooking timer';lastState=state.state;}}
function begin(seconds,name){if((timer.state==='running'||timer.state==='paused')&&!window.confirm('Replace the current cooking timer?'))return;unlock();stopSound();document.getElementById('recipe-timer-alert').textContent='';status.textContent='Timer started. Keep this tab open for the finishing chime.';finishMessage='';timer.start(seconds,name);render();}
root.querySelectorAll('[data-timer-seconds]').forEach(button=>button.addEventListener('click',()=>begin(Number(button.dataset.timerSeconds),button.dataset.timerLabel)));
document.querySelectorAll('.recipe-step-timer').forEach(button=>button.addEventListener('click',()=>begin(Number(button.dataset.timerSeconds),button.dataset.timerLabel)));
document.getElementById('recipe-custom-open').addEventListener('click',()=>{custom.hidden=!custom.hidden;document.getElementById('recipe-custom-open').setAttribute('aria-expanded',String(!custom.hidden));if(!custom.hidden)document.getElementById('recipe-custom-minutes').focus();});
custom.addEventListener('submit',event=>{event.preventDefault();const minutes=Number(document.getElementById('recipe-custom-minutes').value);if(!Number.isFinite(minutes)||minutes<.1||minutes>1440){status.textContent='Choose between 0.1 and 1440 minutes.';return;}begin(Math.round(minutes*60),document.getElementById('recipe-custom-label').value.trim()||'Cooking timer');});
pause.addEventListener('click',()=>{if(timer.state==='paused'){unlock();timer.resume();status.textContent='Timer resumed.';}else{timer.pause();status.textContent='Timer paused.';}render();});
document.getElementById('recipe-timer-restart').addEventListener('click',()=>{unlock();stopSound();document.getElementById('recipe-timer-alert').textContent='';timer.restart();status.textContent='Timer restarted.';render();});
document.getElementById('recipe-timer-close').addEventListener('click',()=>{timer.close();stopSound();document.getElementById('recipe-timer-alert').textContent='';status.textContent='Timer closed and cancelled.';render();});
sound.addEventListener('change',()=>{if(sound.checked){unlock();status.textContent='Sound enabled. Try the 5-second alarm test.';}else{stopSound();status.textContent='Sound muted. The visual alert still works.';}});
setInterval(render,250);document.addEventListener('visibilitychange',render);window.addEventListener('pageshow',render);
})();
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();
