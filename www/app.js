const $=id=>document.getElementById(id);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};

/* ---------- Navigation ---------- */
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===name));document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===name));$('pageTitle').textContent=document.querySelector(`[data-page="${name}"]`)?.innerText.trim()||name;document.querySelector('.sidebar').classList.remove('open');window.scrollTo(0,0)}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));
$('menu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');

/* ---------- Saved music library (IndexedDB, survives closing the app) ---------- */
const DB={db:null,
  open(){return new Promise((res,rej)=>{const r=indexedDB.open('sunplay',1);r.onupgradeneeded=()=>r.result.createObjectStore('tracks',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>{DB.db=r.result;res()};r.onerror=()=>rej(r.error)})},
  store(mode){return DB.db.transaction('tracks',mode).objectStore('tracks')},
  all(){return new Promise((res,rej)=>{const q=DB.store('readonly').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  add(rec){return new Promise((res,rej)=>{const q=DB.store('readwrite').add(rec);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  del(id){return new Promise((res,rej)=>{const q=DB.store('readwrite').delete(id);q.onsuccess=()=>res();q.onerror=()=>rej(q.error)})}
};
let tracks=[],currentId=null,currentUrl=null;const audio=$('audio');
async function loadTracks(){try{await DB.open();tracks=await DB.all();if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){$('trackInfo').textContent='Saved library unavailable on this device.'}renderTracks()}
async function addFiles(files){let added=0;for(const f of files){if(tracks.some(t=>t.name===f.name&&t.blob.size===f.size))continue;try{const id=await DB.add({name:f.name,type:f.type||'audio/mpeg',blob:f,added:Date.now()});tracks.push({id,name:f.name,type:f.type,blob:f});added++}catch(e){alert('Could not save "'+f.name+'" (storage may be full).')}}renderTracks();return added}
function renderTracks(){
  $('trackList').innerHTML=tracks.length?tracks.map(t=>`<div class="track${t.id===currentId?' playing':''}"><span>${escapeHtml(t.name)}</span><span class="acts"><button data-play="${t.id}">▶ Play</button><button data-del="${t.id}" class="del" aria-label="Remove">✕</button></span></div>`).join(''):'<div class="empty">Your music library is waiting. Add audio files to begin.</div>';
  document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playTrack(+b.dataset.play));
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeTrack(+b.dataset.del));
}
function playTrack(id){const t=tracks.find(x=>x.id===id);if(!t)return;if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(t.blob);currentId=id;audio.src=currentUrl;audio.play().catch(()=>{});$('nowPlaying').textContent=t.name;$('trackInfo').textContent='Saved in your SUNPLAY library';renderTracks()}
async function removeTrack(id){if(!confirm('Remove this song from your SUNPLAY library? (The original file on your phone is not deleted.)'))return;try{await DB.del(id)}catch(e){}tracks=tracks.filter(t=>t.id!==id);if(currentId===id){audio.pause();audio.removeAttribute('src');currentId=null;$('nowPlaying').textContent='Nothing playing';$('trackInfo').textContent='Select a track from your library'}renderTracks()}
audio.onended=()=>{const i=tracks.findIndex(t=>t.id===currentId);if(i>=0&&i<tracks.length-1)playTrack(tracks[i+1].id)};
$('audioFiles').onchange=async e=>{const n=await addFiles(Array.from(e.target.files));$('trackInfo').textContent=n?`${n} song(s) saved to your library`:'Those songs are already in your library';e.target.value=''};
loadTracks();

/* ---------- Playlists (names saved on device) ---------- */
let lists=store.get('sunplayPlaylists')||[];
function renderLists(){$('playlistsList').innerHTML=lists.length?lists.map((x,i)=>`<div class="track"><span>${escapeHtml(x)}</span><span class="acts"><small>Playlist</small><button class="del" data-pl="${i}" aria-label="Delete">✕</button></span></div>`).join(''):'<div class="empty">No playlists yet.</div>';document.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{lists.splice(+b.dataset.pl,1);store.set('sunplayPlaylists',lists);renderLists()})}
$('addPlaylist').onclick=()=>{const n=$('playlistName').value.trim();if(!n)return;lists.push(n);store.set('sunplayPlaylists',lists);$('playlistName').value='';renderLists()};
renderLists();

/* ---------- Lyrics Studio (several songs, saved on device) ---------- */
let songs=store.get('sunplayLyricsList')||[];
(function migrate(){const old=store.get('sunplayLyrics');if(old&&(old.title||old.lyrics)){const t=old.title||'Untitled';if(!songs.some(s=>s.title===t)){songs.push({title:t,lyrics:old.lyrics||'',updated:Date.now()});store.set('sunplayLyricsList',songs)}}})();
function renderSongs(){$('lyricList').innerHTML=songs.length?songs.map((s,i)=>`<div class="track"><span>${escapeHtml(s.title)}</span><span class="acts"><button data-open="${i}">Open</button><button class="del" data-song="${i}" aria-label="Delete">✕</button></span></div>`).join(''):'<div class="empty">No saved songs yet.</div>';
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{const s=songs[+b.dataset.open];$('lyricTitle').value=s.title;$('lyricText').value=s.lyrics;$('lyricStatus').textContent='Opened "'+s.title+'".';window.scrollTo(0,0)});
  document.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>{const s=songs[+b.dataset.song];if(!confirm('Delete "'+s.title+'"?'))return;songs.splice(+b.dataset.song,1);store.set('sunplayLyricsList',songs);renderSongs()})}
$('saveLyrics').onclick=()=>{const title=$('lyricTitle').value.trim()||'Untitled';const rec={title,lyrics:$('lyricText').value,updated:Date.now()};const i=songs.findIndex(s=>s.title===title);if(i>=0)songs[i]=rec;else songs.push(rec);store.set('sunplayLyricsList',songs);$('lyricTitle').value=title;$('lyricStatus').textContent='Saved on this device.';renderSongs()};
$('newLyrics').onclick=()=>{$('lyricTitle').value='';$('lyricText').value='';$('lyricStatus').textContent='New song ready.'};
if(songs.length){$('lyricTitle').value=songs[songs.length-1].title;$('lyricText').value=songs[songs.length-1].lyrics}
renderSongs();

/* ---------- Briefs ---------- */
$('makeBrief').onclick=()=>{$('briefOut').textContent=`SUNPLAY MUSIC GENERATION BRIEF\nGenre: ${$('genre').value}\nMood: ${$('mood').value}\nDescription: ${$('musicPrompt').value||'Add a song description.'}\n\nConnect an AI music provider to generate the audio.`};
$('imageBrief').onclick=()=>{$('imageOut').textContent=`IMAGE GENERATION BRIEF — ${$('imageType').value}\n${$('imagePrompt').value}\n\nSuggested visual direction: premium cinematic composition, rich black and warm gold palette, refined lighting, high detail.`};
$('videoBrief').onclick=()=>{$('videoOut').textContent=`VIDEO BRIEF — ${$('videoType').value}\nConcept: ${$('videoPrompt').value}\nLyrics/captions: ${$('videoLyrics').value}\n\nPlan scenes, timing, subtitles, transitions, and export format. Connect a video generation provider for rendering.`};

/* ---------- Voice recording ---------- */
let recorder,chunks=[],lastRecording=null;
$('recordBtn').onclick=async()=>{try{if(!recorder||recorder.state==='inactive'){const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{const type=recorder.mimeType||'audio/webm';const blob=new Blob(chunks,{type});lastRecording={blob,type};$('recordedAudio').src=URL.createObjectURL(blob);$('recordedAudio').hidden=false;$('saveRecording').hidden=false;stream.getTracks().forEach(t=>t.stop())};recorder.start();$('recordBtn').textContent='■ Stop recording';$('recordStatus').textContent='Recording…'}else{recorder.stop();$('recordBtn').textContent='● Start recording';$('recordStatus').textContent='Recording ready below.'}}catch(e){$('recordStatus').textContent='Microphone unavailable or permission denied. Allow Microphone for SUNPLAY in phone Settings > Apps.'}};
$('saveRecording').onclick=async()=>{if(!lastRecording)return;const ext=lastRecording.type.includes('mp4')?'m4a':lastRecording.type.includes('ogg')?'ogg':'webm';const name='SUNPLAY recording '+new Date().toISOString().slice(0,16).replace('T',' ').replace(':','-')+'.'+ext;const f=new File([lastRecording.blob],name,{type:lastRecording.type});await addFiles([f]);$('recordStatus').textContent='Saved to your Music Player library.'};
$('vocalUpload').onchange=e=>{$('recordStatus').textContent=e.target.files[0]?`Selected: ${e.target.files[0].name}`:'Ready'};

/* ---------- Video to MP3 (runs on the phone) ---------- */
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
async function saveOrShare(blob,name){
  const P=window.Capacitor&&window.Capacitor.Plugins;
  if(P&&P.Filesystem&&P.Share){const data=await blobToBase64(blob);const w=await P.Filesystem.writeFile({path:name,data,directory:'CACHE'});await P.Share.share({title:name,url:w.uri,dialogTitle:'Save or share your audio'});return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove()}
const conv=(arr,s,n)=>{const sub=arr.subarray(s,Math.min(arr.length,s+n));const o=new Int16Array(sub.length);for(let i=0;i<sub.length;i++){const v=Math.max(-1,Math.min(1,sub[i]));o[i]=v<0?v*0x8000:v*0x7FFF}return o};
const tick=()=>new Promise(r=>setTimeout(r,0));
async function encodeAudio(ab,progress){
  const ch=Math.min(2,ab.numberOfChannels),sr=ab.sampleRate,len=ab.length,L=ab.getChannelData(0),R=ch>1?ab.getChannelData(1):null;
  if(window.lamejs){
    const enc=new lamejs.Mp3Encoder(ch,sr,128),parts=[],BLOCK=1152*10;let n=0;
    for(let i=0;i<len;i+=BLOCK){const l=conv(L,i,BLOCK);const out=ch>1?enc.encodeBuffer(l,conv(R,i,BLOCK)):enc.encodeBuffer(l);if(out.length)parts.push(new Uint8Array(out));if(++n%25===0){progress(Math.round(i/len*100));await tick()}}
    const end=enc.flush();if(end.length)parts.push(new Uint8Array(end));
    return{blob:new Blob(parts,{type:'audio/mpeg'}),ext:'mp3'}}
  const bytes=new ArrayBuffer(44+len*ch*2),v=new DataView(bytes),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+len*ch*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,len*ch*2,true);
  let o=44;for(let i=0;i<len;i++){for(let c=0;c<ch;c++){const s=Math.max(-1,Math.min(1,(c?R:L)[i]));v.setInt16(o,s<0?s*0x8000:s*0x7FFF,true);o+=2}if(i%200000===0){progress(Math.round(i/len*100));await tick()}}
  return{blob:new Blob([bytes],{type:'audio/wav'}),ext:'wav'}}
let converted=null;
$('convertBtn').onclick=async()=>{
  const st=$('convertStatus'),btn=$('convertBtn'),f=$('videoFile').files[0];$('downloadMp3').hidden=true;$('mp3ToLibrary').hidden=true;converted=null;
  if(!f){st.textContent='Choose a video file first.';return}
  if(f.size>250*1024*1024){st.textContent='This video is too large to convert on the phone (limit about 250 MB). Try a shorter clip.';return}
  btn.disabled=true;
  try{
    st.textContent='Reading video…';const buf=await f.arrayBuffer();
    st.textContent='Extracting audio…';const AC=window.AudioContext||window.webkitAudioContext;const ctx=new AC();
    const ab=await ctx.decodeAudioData(buf);ctx.close();
    const r=await encodeAudio(ab,p=>{st.textContent='Converting… '+p+'%'});
    const base=f.name.replace(/\.[^.]+$/,'')||'audio';converted={blob:r.blob,name:base+'.'+r.ext};
    st.textContent=r.ext==='mp3'?'Done! Your MP3 is ready.':'Done! MP3 encoder not available, so your audio was saved as WAV.';
    $('downloadMp3').textContent='Save / Share '+r.ext.toUpperCase();$('downloadMp3').hidden=false;$('mp3ToLibrary').hidden=false;
  }catch(e){st.textContent='Could not convert this file. The video may use an unsupported audio format, or it is too large for this phone.'}
  finally{btn.disabled=false}};
$('downloadMp3').onclick=async e=>{e.preventDefault();if(!converted)return;try{await saveOrShare(converted.blob,converted.name)}catch(err){$('convertStatus').textContent='Could not open the save/share menu.'}};
$('mp3ToLibrary').onclick=async()=>{if(!converted)return;await addFiles([new File([converted.blob],converted.name,{type:converted.blob.type})]);$('convertStatus').textContent='Added to your Music Player library.'};
                                                                
