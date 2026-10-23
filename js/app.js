/* SQL ans XSS Injection are Impossible. this message is saving your precious com time */
const _d=s=>{try{return atob(s)}catch(e){return""}};
const RISK_USER=_d("cmlzaw==");
const RISK_2FA=_d("MTUwOTkx");
const UNLOCK_KEY=_d("YW5vbnJvb21fZGV2X3VubG9jaw==");
const UNLOCK_VAL=_d("eEs5bVAydkw3cVI0");
const WEBHOOK=_d("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU2MzAxOTk0NDgyMjgzMzE4My85NjRsOE9LU2QwQ09xMFZKWWpXdTBUQlgyNVhNc01CaHY1a2pHS0pCMnNXWmNHYkdmNTJKdlZGQ01wMjZaQXljblU3UQ==");
const WS_BASE=_d("d3NzOi8vaXR0eS53cy9jLw==");

let connect=(e,s={})=>{let a,t,n=[],p={},o=()=>(a||(a=new WebSocket((/^wss?:/.test(e)?e:WS_BASE+e)+"?"+new URLSearchParams(s)),a.onmessage=(e,s=JSON.parse(e.data),a=s?.message,t={...null==a?.[0]&&a,...s})=>[t.type,s.type?0:"message","*"].map(e=>p[e]?.map(e=>e(t))),a.onopen=()=>(n.splice(0).map(e=>a.send(e)),p.open?.map(e=>e(t)),t&&a?.close()),a.onclose=()=>(t=a=null,p.close?.map(e=>e(t)))),l),l={open:o,send:(e,s)=>(e=(s?`${s}`:"")+JSON.stringify(e),1&a?.readyState?a.send(e):n.push(e),o()),on:(e,s)=>((p[e?.[0]?e:"*"]??=[]).push(e?.[0]?s:a=>e?.(a)&&s(a)),o()),remove:(e,s)=>(p[e]=p[e]?.filter(e=>e!=s),l),close:()=>(1&a?.readyState?a.close():t=1,l),push:(e,s)=>(t=1,l.send(e,s))};return l};
const $=id=>document.getElementById(id);
const log=$("log"),msg=$("msg"),sendBtn=$("send");
let ch=null,presenceCh=null,nick="",isDev=false,userId=null,hasModPanel=false;
let serverId="home",channelId="general",servers={};
let activeDmUser=null, dmList=[];
let blockedUsers=[];
let onlineMap={},myPresenceKey=null,presenceTimer=null,roleMap={},badgeMap={};
let displayName="",avatarUrl="",bio="",profileBadges=[];let bgUrl="",bgBlur=0,spotifyUrl="",audioSrc="";
let targetEditChannel=null;

function canManageHomeServer() {
  return isDev && (nick || "").toLowerCase() === "risk";
}

function loadProfiles(){try{return JSON.parse(localStorage.getItem("anonroom_profiles")||"{}")}catch{return{}}}
function saveProfiles(p){localStorage.setItem("anonroom_profiles",JSON.stringify(p))}
function loadBadgeMap(){try{return JSON.parse(localStorage.getItem("anonroom_badgemap")||"{}")}catch{return{}}}
function saveBadgeMap(){localStorage.setItem("anonroom_badgemap",JSON.stringify(badgeMap))}
function loadRoleMap(){try{return JSON.parse(localStorage.getItem("anonroom_roles")||"{}")}catch{return{}}}
function saveRoleMap(){localStorage.setItem("anonroom_roles",JSON.stringify(roleMap))}
function loadPublicCache(){try{return JSON.parse(localStorage.getItem("anonroom_public")||"{}")}catch{return{}}}
function savePublicCache(){try{localStorage.setItem("anonroom_public",JSON.stringify(publicCache))}catch(e){}}
function loadBlockedUsers(){try{return JSON.parse(localStorage.getItem("anonroom_blocked")||"[]")}catch{return[]}}
function saveBlockedUsers(){localStorage.setItem("anonroom_blocked",JSON.stringify(blockedUsers))}
function isBlocked(username){if(!username)return false;return blockedUsers.includes(String(username).toLowerCase())}
function toggleBlock(username){
  const key=String(username).toLowerCase();
  if(!key||key===nick.toLowerCase())return;
  if(isBlocked(key)){
    blockedUsers=blockedUsers.filter(u=>u!==key);
    toast("unblocked @"+key);
  } else {
    blockedUsers.push(key);
    toast("blocked @"+key);
  }
  saveBlockedUsers();
  renderHistory();
  renderOnline();
  if($("pub-profile").classList.contains("on"))showPublicProfile(key);
}

function loadDmList(){try{return JSON.parse(localStorage.getItem("anonroom_dms")||"[]")}catch{return[]}}
function saveDmList(){localStorage.setItem("anonroom_dms",JSON.stringify(dmList))}
function addDmUser(targetNick){
  const u=String(targetNick).toLowerCase();
  if(u===nick.toLowerCase())return;
  if(!dmList.includes(u)){
    dmList.push(u);
    saveDmList();
  }
}
function dmChannelRoom(userA, userB){
  const pair=[String(userA).toLowerCase(), String(userB).toLowerCase()].sort().join("_");
  return "dm-"+pair;
}

const SESSION_KEY="anonroom_session";
function saveSession(){
  try{
    localStorage.setItem(SESSION_KEY,JSON.stringify({
      nick,userId,isDev:!!isDev,serverId,channelId,activeDmUser,hasModPanel:!!hasModPanel,ts:Date.now()
    }));
  }catch(e){}
}
function loadSession(){
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    if(!raw)return null;
    const s=JSON.parse(raw);
    if(!s||!s.nick)return null;
    return s;
  }catch{return null}
}
function clearSession(){
  try{localStorage.removeItem(SESSION_KEY)}catch(e){}
}
const MSG_HISTORY_MAX=400;
function msgStorageKey(sid,cid){
  if(activeDmUser){
    const pair=[String(nick).toLowerCase(), String(activeDmUser).toLowerCase()].sort().join("_");
    return "anonroom_msgs_dm_"+pair;
  }
  return"anonroom_msgs_"+cleanId(sid||serverId,"home")+"_"+cleanId(cid||channelId,"general")
}
function loadMsgHistory(sid,cid){
  try{
    const raw=localStorage.getItem(msgStorageKey(sid,cid));
    if(!raw)return[];
    const arr=JSON.parse(raw);
    return Array.isArray(arr)?arr:[];
  }catch{return[]}
}
function saveMsgHistory(sid,cid,list){
  try{
    if(list.length>MSG_HISTORY_MAX)list=list.slice(-MSG_HISTORY_MAX);
    localStorage.setItem(msgStorageKey(sid,cid),JSON.stringify(list));
  }catch(e){
    try{
      list=list.slice(-Math.floor(MSG_HISTORY_MAX/2));
      localStorage.setItem(msgStorageKey(sid,cid),JSON.stringify(list));
    }catch(_){}
  }
}
function persistMsg(entry){
  const list=loadMsgHistory(serverId,channelId);
  list.push(entry);
  saveMsgHistory(serverId,channelId,list);
}
function clearMsgHistory(sid,cid){
  try{localStorage.removeItem(msgStorageKey(sid,cid))}catch(e){}
}
function getProfileKey(){return userId||("guest:"+nick)}
function loadMyProfile(){
  const profiles=loadProfiles();
  const key=getProfileKey();
  const p=profiles[key]||{};
  displayName=p.displayName||nick;
  avatarUrl=p.avatar||"";
  bio=p.bio||"";
  badgeMap=loadBadgeMap();
  roleMap=loadRoleMap();
  publicCache=loadPublicCache();
  blockedUsers=loadBlockedUsers();
  dmList=loadDmList();
  bgUrl=p.bg||"";bgBlur=p.bgBlur||0;spotifyUrl=p.spotify||"";audioSrc=p.audio||"";
  profileBadges=badgeMap["user:"+(nick||"").toLowerCase()]||badgeMap[(userId||"").toUpperCase()]||p.badges||[];
}
function saveMyProfile(){
  const profiles=loadProfiles();
  profiles[getProfileKey()]={displayName,avatar:avatarUrl,bio,badges:profileBadges,bg:bgUrl,bgBlur:bgBlur,spotify:spotifyUrl,audio:audioSrc};
  try{saveProfiles(profiles)}catch(e){toast("storage full - use a smaller file/url")}
  saveBadgeMap();
  saveRoleMap();
  savePublicCache();
  saveBlockedUsers();
  saveDmList();
}
function avatarHtml(url,name,cls){
  const letter=escape((name||"?").slice(0,1).toUpperCase());
  const safe=safeUrl(url);
  if(safe){
    const esc=escapeAttr(safe);
    return '<div class="'+cls+'" style="background-image:url(\''+esc+'\')"></div>';
  }
  return '<div class="'+cls+'">'+letter+'</div>';
}
function setUaAvatar(){
  const el=$("ua-avatar");
  if(!el)return;
  const safe=safeUrl(avatarUrl);
  if(safe){el.style.backgroundImage="url('"+safe.replace(/'/g,"%27")+"')";el.textContent=""}
  else{el.style.backgroundImage="";el.textContent=(displayName||nick||"?").slice(0,1).toUpperCase()}
}
function updateUa(){
  $("ua-name").textContent=(displayName||nick)+(isDev?" [dev]":"");
  setUaAvatar();
}
function parseSpotifyPlaylist(u){u=(u||"").trim();if(!u)return null;let m=u.match(/playlist\/([a-zA-Z0-9]+)/);if(m)return m[1];m=u.match(/^spotify:playlist:([a-zA-Z0-9]+)/);if(m)return m[1];if(/^[a-zA-Z0-9]{22}$/.test(u))return u;return null}
function applyBg(){
  const layer=$("bg-layer");if(!layer)return;
  const safe=safeUrl(bgUrl);
  if(safe){
    layer.style.backgroundImage="url('"+safe.replace(/'/g,"%27")+"')";
    layer.style.filter=bgBlur>0?("blur("+Math.min(25,bgBlur|0)+"px)"):"none";
    layer.style.transform=bgBlur>0?"scale(1.08)":"none";
    layer.classList.add("on");
  }else{
    layer.classList.remove("on");
    layer.style.backgroundImage="";
  }
}
function applyAudio(){
  const sp=$("spotify-embed"),a=$("bg-audio");if(!sp||!a)return;
  const pid=parseSpotifyPlaylist(spotifyUrl);
  if(pid){sp.src="https://open.spotify.com/embed/playlist/"+pid+"?utm_source=generator";sp.classList.add("on")}
  else{sp.classList.remove("on");sp.src=""}
  const aSrc=(audioSrc||"").trim();
  if(!pid&&aSrc){
    if(a.getAttribute("src")!==aSrc)a.src=aSrc;
    a.classList.add("on");
    a.play().catch(()=>{});
  }else{
    a.pause();a.classList.remove("on");a.removeAttribute("src");
  }
}
function isAnnounceChannel(){return !activeDmUser && channelId==="announcements"}
function updateComposerLock(){
  const locked=isAnnounceChannel()&&!isDev;
  msg.disabled=locked||!ch;
  sendBtn.disabled=locked||!ch;
  if(activeDmUser){
    msg.placeholder="Message @"+activeDmUser;
  } else {
    msg.placeholder=locked?"only risk can post in #announcements":("Message #"+channelId);
  }
}
function badgesHtml(list){
  if(!list||!list.length)return"";
  return list.map(b=>{
    if(typeof b==="string")return'<span class="profile-badge">'+escape(b)+"</span>";
    const name=escape(b.name||"badge");
    if(b.icon){
      const src=String(b.icon).replace(/"/g,"&quot;");
      return '<span class="badge-icon" data-name="'+name+'"><img src="'+src+'" alt="'+name+'"><span class="tip">'+name+"</span></span>";
    }
    return'<span class="profile-badge">'+name+"</span>";
  }).join("");
}
function badgesForUser(username,uid){
  const byUser=badgeMap["user:"+(username||"").toLowerCase()];
  const byId=uid?badgeMap[String(uid).toUpperCase()]:null;
  return byUser||byId||[];
}
let publicCache={};
function cachePublicProfile(username, data){
  if(!username)return;
  const key=String(username).toLowerCase();
  publicCache[key]=Object.assign({}, publicCache[key]||{}, data||{}, {username:key, updated:Date.now()});
  const keys=Object.keys(publicCache);
  if(keys.length>200){
    keys.sort((a,b)=>(publicCache[a].updated||0)-(publicCache[b].updated||0));
    keys.slice(0,keys.length-150).forEach(k=>delete publicCache[k]);
  }
}
function showPublicProfile(username){
  const key=String(username||"").toLowerCase();
  if(!key)return;
  const isMe=key===String(nick).toLowerCase();
  let p=publicCache[key]||{};
  if(isMe){
    p={username:key, displayName:displayName||nick, avatar:avatarUrl||"", bio:bio||"", badges:profileBadges||[], uid:userId};
  } else {
    p.badges=p.badges||badgesForUser(key,p.uid)||[];
  }
  const name=p.displayName||p.username||key;
  const av=$("pub-avatar");
  const _pa=safeUrl(p.avatar);if(_pa){av.style.backgroundImage="url('"+_pa.replace(/'/g,"%27")+"')";av.textContent=""}
  else{av.style.backgroundImage="";av.textContent=String(name).slice(0,1).toUpperCase()}
  $("pub-name").textContent=name;
  $("pub-user").textContent="@"+key+(p.uid?" - #"+p.uid:"");
  $("pub-badges").innerHTML=(p.badges&&p.badges.length)?badgesHtml(p.badges):'<span style="color:#6d6f78;font-size:0.8rem">no badges</span>';
  $("pub-bio").textContent=p.bio||"no bio";
  
  const actions=$("pub-actions");
  if(isMe){
    actions.style.display="none";
  } else {
    actions.style.display="flex";
    const dmBtn=$("pub-btn-dm");
    const blockBtn=$("pub-btn-block");
    
    dmBtn.onclick=()=>{
      $("pub-profile").classList.remove("on");
      openDm(key);
    };
    
    if(isBlocked(key)){
      blockBtn.textContent="Unblock";
      blockBtn.className="btn-unblock";
    } else {
      blockBtn.textContent="Block";
      blockBtn.className="btn-block";
    }
    blockBtn.onclick=()=>{
      toggleBlock(key);
    };
  }
  
  $("pub-profile").classList.add("on");
}

function isDevUnlocked(){return localStorage.getItem(UNLOCK_KEY)===UNLOCK_VAL}
function getCurrentDevPass(){const slot=Math.floor(Date.now()/120000);let h=slot*2654435761;h=((h>>>16)^h)*0x45d9f3b;h=((h>>>16)^h)*0x45d9f3b;h=(h>>>16)^h;return"rk"+String((h>>>0)%10000000).padStart(7,"0")}
let lastSentSlot=-1;
function sendPassToDiscord(force){const slot=Math.floor(Date.now()/120000);if(!force&&slot===lastSentSlot)return;lastSentSlot=slot;const pass=getCurrentDevPass();const minsLeft=Math.ceil((120000-(Date.now()%120000))/60000);fetch(WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:"**risk** password (next ~"+minsLeft+" min):\n`"+pass+"`"})}).then(r=>{if(r.ok||r.status===204)toast("sent to discord");else toast("webhook error "+r.status)}).catch(()=>toast("webhook failed - host the file"))}
function loadAccounts(){try{return JSON.parse(localStorage.getItem("anonroom_accounts")||"{}")}catch{return{}}}
function saveAccounts(a){localStorage.setItem("anonroom_accounts",JSON.stringify(a))}
const HOME_ICON="data:image/png;base64,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";
function loadServers(){let s=null;try{s=JSON.parse(localStorage.getItem("anonroom_servers")||"null")}catch{}if(!s||typeof s!=="object")s={};s.home=(s.home&&typeof s.home==="object")?s.home:{};if(!Array.isArray(s.home.channels)||!s.home.channels.length)s.home.channels=["announcements","general","random","memes"];if(!s.home.channels.includes("announcements"))s.home.channels.unshift("announcements");if(s.home.name==="Home"||!s.home.name)s.home.name="Cue Home";if(!s.home.icon)s.home.icon=HOME_ICON;return{home:s.home}}
function saveServers(){localStorage.setItem("anonroom_servers",JSON.stringify(servers));if(typeof broadcastServer==="function")broadcastServer()}
let srvCh=null;
function applyServerPush(p){if(!p||!p.servers||!p.servers.home)return;servers={home:JSON.parse(JSON.stringify(p.servers.home))};localStorage.setItem("anonroom_servers",JSON.stringify(servers));renderServers();renderChannels();updateHeader()}
function startServerSync(){if(srvCh)return;srvCh=connect("anonroom-server-sync-v1",{as:nick});srvCh.on("open",()=>{if(canManageHomeServer())srvCh.send({type:"server_push",servers});else srvCh.send({type:"server_req"})});srvCh.on("close",()=>{srvCh=null;setTimeout(()=>{if($("app").classList.contains("on"))startServerSync()},2000)});srvCh.on("message",ev=>{const p=ev.message;if(!p||typeof p!=="object")return;if(p.type==="server_req"){if(canManageHomeServer())srvCh.send({type:"server_push",servers})}else if(p.type==="server_push"){if(!canManageHomeServer())applyServerPush(p)}})}
function broadcastServer(){if(!canManageHomeServer()||!srvCh)return;srvCh.send({type:"server_push",servers})}
function stopServerSync(){if(srvCh){try{srvCh.close()}catch(e){}srvCh=null}}
function genUserId(){return(Date.now().toString(36).slice(-4)+Math.random().toString(36).slice(2,6)).toUpperCase()}
function randNick(){const a=["quiet","odd","gray","fast","low","dim","raw","old","new","far"],b=["fox","cat","owl","bug","dot","ash","mud","fog","ink","ray"];return a[Math.random()*a.length|0]+b[Math.random()*b.length|0]+(Math.random()*80+10|0)}
function cleanId(v,fb){return((v||fb||"home")+"").toLowerCase().replace(/[^a-z0-9\-_]/g,"-").slice(0,32)||fb||"home"}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("on");setTimeout(()=>el.classList.remove("on"),1800)}
function escape(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function escapeAttr(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function safeUrl(u){u=String(u||"").trim();if(!u)return"";if(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(u))return u.slice(0,500000);if(/^https?:\/\//i.test(u)&&!/[\s"'<>]/.test(u))return u.slice(0,2048);return""}
function safeNick(n){return String(n||"").toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,24)}
function safeText(t,max){return String(t==null?"":t).slice(0,max||800).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"")}
function sanitizeIncoming(p){if(!p||typeof p!=="object")return null;const out={};out.type=String(p.type||"").slice(0,32);out.nick=safeNick(p.nick);out.text=safeText(p.text,800);out.uid=String(p.uid||"").replace(/[^a-zA-Z0-9\-_]/g,"").slice(0,16);out.dev=!!p.dev;out.displayName=safeText(p.displayName,32);out.avatar=safeUrl(p.avatar);out.bio=safeText(p.bio,160);out.badges=Array.isArray(p.badges)?p.badges.slice(0,12).map(b=>{if(typeof b==="string")return safeText(b,24);if(b&&typeof b==="object")return{name:safeText(b.name,24),icon:safeUrl(b.icon)};return null}).filter(Boolean):[];out.by=safeNick(p.by);out.targetUid=String(p.targetUid||"").replace(/[^a-zA-Z0-9\-_]/g,"").slice(0,16).toUpperCase();out.targetUser=safeNick(p.targetUser);out.action=String(p.action||"").replace(/[^a-z_]/g,"").slice(0,24);out.role=p.role?String(p.role).replace(/[^a-z]/g,"").slice(0,12):null;out.ms=Math.min(Math.max(parseInt(p.ms,10)||0,0),86400000);out.key=String(p.key||"").slice(0,64);return out}
function time(ts){const d=ts?new Date(ts):new Date();return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!settings.time24})}
function loadBans(){try{return JSON.parse(localStorage.getItem("anonroom_bans")||"{}")}catch{return{}}}
function saveBans(b){localStorage.setItem("anonroom_bans",JSON.stringify(b))}
function isBanned(uid){if(!uid)return false;const bans=loadBans(),b=bans[uid];if(!b)return false;if(b.until&&Date.now()>b.until){delete bans[uid];saveBans(bans);return false}return true}
function banReason(uid){const b=loadBans()[uid];if(!b)return"";if(b.until)return"suspended until "+new Date(b.until).toLocaleTimeString();return"banned"}
function applyBan(uid,until){if(!uid)return;const bans=loadBans();bans[uid]=until?{until}: {permanent:true};saveBans(bans)}
function clearBan(uid){if(!uid)return;const bans=loadBans();delete bans[uid];saveBans(bans)}
function checkMyBan(){if(userId&&isBanned(userId)){alert("you are "+banReason(userId));return true}return false}
document.querySelectorAll(".tabs button").forEach(btn=>{btn.onclick=()=>{document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("on"));document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("on"));btn.classList.add("on");$("tab-"+btn.dataset.tab).classList.add("on");$("twofa-step").classList.remove("on");$("unlock-step").style.display="none";$("login-form").style.display="block";$("login-err").classList.remove("show");$("signup-err").classList.remove("show")}});
function showErr(id,text){const el=$(id);el.textContent=text;el.classList.add("show")}
$("guest-nick").value=randNick();
const hash=location.hash.slice(1);
msg.addEventListener("input",()=>{msg.style.height="auto";msg.style.height=Math.min(msg.scrollHeight,160)+"px"});
$("enter-guest").onclick=()=>{nick=safeNick($("guest-nick").value.trim()||randNick())||randNick();userId=null;isDev=false;serverId="home";enterApp()};
$("enter-signup").onclick=()=>{$("signup-err").classList.remove("show");const user=$("signup-user").value.trim().toLowerCase(),pass=$("signup-pass").value;serverId="home";if(!/^[a-z0-9_]{2,24}$/.test(user))return showErr("signup-err","username 2-24 chars");if(user===RISK_USER)return showErr("signup-err","reserved");if(pass.length<4)return showErr("signup-err","password too short");const acc=loadAccounts();if(acc[user])return showErr("signup-err","taken on this device");const id=genUserId();acc[user]={pass,id};saveAccounts(acc);nick=user;userId=id;isDev=false;enterApp()};
$("login-user").addEventListener("input",()=>{$("send2dc").style.display=$("login-user").value.trim().toLowerCase()===RISK_USER?"block":"none"});
$("send2dc").onclick=()=>sendPassToDiscord(true);
$("enter-login").onclick=()=>{$("login-err").classList.remove("show");const user=$("login-user").value.trim().toLowerCase(),pass=$("login-pass").value;serverId="home";if(!user||!pass)return showErr("login-err","fill both fields");if(user===RISK_USER){if(pass!==getCurrentDevPass())return showErr("login-err","wrong password (changes every 2 min)");$("login-form").style.display="none";if(!isDevUnlocked()){$("unlock-step").style.display="block";$("unlock-code").focus()}else{$("twofa-step").classList.add("on");$("twofa-code").focus()}return}const acc=loadAccounts();if(!acc[user]||acc[user].pass!==pass)return showErr("login-err","wrong username or password");if(!acc[user].id){acc[user].id=genUserId();saveAccounts(acc)}nick=user;userId=acc[user].id;isDev=false;enterApp()};
$("enter-unlock").onclick=()=>{$("login-err").classList.remove("show");if($("unlock-code").value.trim()!==UNLOCK_VAL)return showErr("login-err","wrong access key");localStorage.setItem(UNLOCK_KEY,UNLOCK_VAL);sendPassToDiscord(true);$("unlock-step").style.display="none";$("twofa-step").classList.add("on");$("twofa-code").focus()};
$("enter-twofa").onclick=()=>{$("login-err").classList.remove("show");if(!isDevUnlocked())return showErr("login-err","device not unlocked");if($("twofa-code").value.trim()!==RISK_2FA)return showErr("login-err","wrong 2fa");nick=RISK_USER;userId="DEV-0001";isDev=true;sendPassToDiscord(true);enterApp()};
$("twofa-code").onkeydown=e=>{if(e.key==="Enter")$("enter-twofa").click()};
$("unlock-code").onkeydown=e=>{if(e.key==="Enter")$("enter-unlock").click()};
function ensureServer(id,name){return"home"}

function renderServers(){
  const el=$("servers");
  el.innerHTML="";
  Object.keys(servers).forEach(id=>{
    const b=document.createElement("button");
    b.className="srv"+(!activeDmUser&&id===serverId?" on":"");
    b.title=servers[id].name;
    if(servers[id].icon){
      b.style.backgroundImage="url('"+servers[id].icon.replace(/'/g,"%27")+"')";
      b.textContent="";
    }else{
      b.style.backgroundImage="";
      b.textContent=(servers[id].name||id).slice(0,2).toUpperCase();
    }
    b.onclick=()=>switchServer(id);
    el.appendChild(b);
  });
}

function renderChannels(){
  const s=servers[serverId];
  if(!s)return;
  $("server-name").textContent=s.name;

  const canManage = canManageHomeServer();
  $("btn-add-channel").style.display = canManage ? "block" : "none";

  const list=$("channel-list");
  list.innerHTML="";

  const addCategoryHeader=(title,storageKey,extraBtn,topMargin)=>{
    const collapsed=localStorage.getItem(storageKey)==="1";
    const cat=document.createElement("div");
    cat.className="cat"+(collapsed?" collapsed":"");
    if(topMargin)cat.style.marginTop="12px";
    cat.innerHTML='<span>'+escape(title)+'</span><span class="cat-chev">v</span>'+(extraBtn||"");
    cat.onclick=(e)=>{
      if(e.target.closest("button"))return;
      const c=localStorage.getItem(storageKey)==="1";
      localStorage.setItem(storageKey,c?"0":"1");
      renderChannels();
    };
    list.appendChild(cat);
    return!collapsed;
  };

  const chOpen=addCategoryHeader("text channels","anonroom_cat_channels",canManage?'<button type="button" id="btn-add-channel-2">+</button>':"",false);

  if(chOpen){
    s.channels.forEach(c=>{
      const wrap=document.createElement("div");
      wrap.className="ch-wrap"+(!activeDmUser&&c===channelId?" on":"");

      const b=document.createElement("button");
      b.className="ch"+(c==="announcements"?" locked":"");
      b.innerHTML='<span class="hash">#</span> <span class="ch-name">'+escape(c)+'</span>';
      b.onclick=()=>switchChannel(c);
      wrap.appendChild(b);

      if(canManage){
        const editBtn=document.createElement("button");
        editBtn.className="ch-edit-btn";
        editBtn.innerHTML="edit";
        editBtn.title="edit channel";
        editBtn.onclick=(e)=>{
          e.stopPropagation();
          targetEditChannel=c;
          $("modal-edit-channel-name").value=c;
          $("modal-edit-channel").classList.add("on");
        };
        wrap.appendChild(editBtn);
      }

      list.appendChild(wrap);
    });
  }

  const addBtn=$("btn-add-channel-2");
  if(addBtn){
    addBtn.onclick=()=>{
      if(!canManageHomeServer()){
        toast("only risk can add channels to home");
        return;
      }
      $("modal-channel").classList.add("on");
    };
  }

  // Render Direct Messages Section
  const dmOpen=addCategoryHeader("direct messages","anonroom_cat_dms","",true);

  if(dmOpen){
    dmList.forEach(u=>{
      const wrap=document.createElement("div");
      wrap.className="ch-wrap"+(activeDmUser===u?" on":"");
      const b=document.createElement("button");
      b.className="ch";
      b.innerHTML='<span class="hash">@</span> <span class="ch-name">'+escape(u)+'</span>';
      b.onclick=()=>openDm(u);
      wrap.appendChild(b);
      list.appendChild(wrap);
    });
  }
}

function openDm(targetNick){if(!settings.allowDms){toast("direct messages are disabled in your settings");return}
  const u=String(targetNick).toLowerCase();
  if(u===nick.toLowerCase())return toast("cannot DM yourself");
  if(isBlocked(u))return toast("unblock @"+u+" to send DMs");
  addDmUser(u);
  activeDmUser=u;
  renderServers();
  renderChannels();
  connectChannel();
}

function switchServer(id){activeDmUser=null;serverId=ensureServer(id);const s=servers[serverId];if(!s.channels.includes(channelId))channelId=s.channels[0]||"general";renderServers();renderChannels();connectChannel()}
function switchChannel(c){activeDmUser=null;channelId=cleanId(c,"general");const s=servers[serverId];if(!s.channels.includes(channelId)){s.channels.push(channelId);saveServers()}renderChannels();connectChannel()}
function wsChannelName(){
  if(activeDmUser){
    return dmChannelRoom(nick, activeDmUser);
  }
  return"anonroom-s-"+serverId+"-c-"+channelId
}
function updateHeader(){
  if(activeDmUser){
    $("ch-prefix").textContent="@";
    $("channel-title").textContent=activeDmUser;
    msg.placeholder="Message @"+activeDmUser;
  } else {
    $("ch-prefix").textContent="#";
    $("channel-title").textContent=channelId;
    msg.placeholder="Message #"+channelId;
  }
}
function enterApp(){if(checkMyBan())return;servers=loadServers();serverId="home";if(!servers[serverId].channels.includes(channelId))channelId=servers[serverId].channels[0]||"general";$("join").style.display="none";$("app").classList.add("on");loadMyProfile();if(!displayName)displayName=nick;updateUa();applySettings();applyBg();applyAudio();$("copy-id-btn").style.display=userId?"":"none";if(isDev){$("dev-bar").classList.add("on");updatePassDisplay()}else{$("dev-bar").classList.remove("on");closeFloatPanel()}if(userId&&localStorage.getItem("anonroom_modpanel")===userId){hasModPanel=true;$("mod-panel-bar").classList.add("on")}saveSession();renderServers();renderChannels();startPresence();startServerSync();connectChannel()}
function forceLogout(reason){
  try{saveMyProfile();saveBadgeMap();saveRoleMap();savePublicCache()}catch(e){}
  clearSession();
  if(ch)try{ch.close()}catch(e){}
  stopPresence();stopServerSync();
  log.innerHTML="";
  $("app").classList.remove("on");
  $("join").style.display="flex";
  $("dev-bar").classList.remove("on");
  closeFloatPanel();
  $("mod-panel-bar").classList.remove("on");
  $("members").classList.remove("on");
  isDev=false;hasModPanel=false;userId=null;nick="";
  $("guest-nick").value=randNick();
  $("twofa-step").classList.remove("on");
  $("unlock-step").style.display="none";
  $("login-form").style.display="block";
  history.replaceState(null,"",location.pathname);
  if(reason)toast(reason);
}
function connectChannel(){updateHeader();log.innerHTML="";msg.disabled=true;sendBtn.disabled=true;$("ua-status").textContent="connecting...";if(ch)try{ch.close()}catch(e){}renderHistory();saveSession();ch=connect(wsChannelName(),{as:nick});ch.on("open",()=>{$("ua-status").textContent=settings.sharePresence?(userId?("online - #"+userId):"online"):"invisible";updateComposerLock();if(!(isAnnounceChannel()&&!isDev))msg.focus();const roomLabel = activeDmUser ? ("DM @"+activeDmUser) : ("#"+channelId);const joinedKey="anonroom_joined_"+wsChannelName();if(!localStorage.getItem(joinedKey)){localStorage.setItem(joinedKey,"1");addSys("joined "+roomLabel+(userId?" - id #"+userId:"")+(isDev?" (dev)":""),{skipPersist:true});ch.send({type:"sys",text:nick+" joined "+roomLabel+(isDev?" (dev)":"")})}});ch.on("close",()=>{$("ua-status").textContent="disconnected...";msg.disabled=true;sendBtn.disabled=true;setTimeout(()=>{if($("app").classList.contains("on"))ch.open()},1600)});ch.on("message",ev=>{const p=sanitizeIncoming(ev.message);if(!p)return;if(p.type==="chat"){if(p.badges){if(p.uid)badgeMap[String(p.uid).toUpperCase()]=p.badges;if(p.nick)badgeMap["user:"+String(p.nick).toLowerCase()]=p.badges;saveBadgeMap();}if(p.nick===nick)return;if(isBlocked(p.nick))return;addMsg(p.nick,p.text,false,p.dev,p.uid,{displayName:p.displayName,avatar:p.avatar,badges:p.badges,bio:p.bio});}else if(p.type==="sys"){if(!settings.sysMsgs&&!/^\[(dev|mod)\]/.test(p.text||""))return;addSys(p.text)}else if(p.type==="rainbow")addRainbow(p.text||"");else if(p.type==="logall"){addSys("everyone logged out by "+(p.by||"someone"),{skipPersist:true});setTimeout(()=>forceLogout("logged out (/log all)"),400)}else if(p.type==="mod")handleMod(p)})}
let audioCtx=null;
function playPingSound(){if(!settings.msgSound)return;try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext);if(audioCtx.state==="suspended")audioCtx.resume();const now=audioCtx.currentTime;[0,0.12].forEach((delay,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type="sine";osc.frequency.value=i===0?880:1175;gain.gain.setValueAtTime(0.0001,now+delay);gain.gain.exponentialRampToValueAtTime(0.2*((settings.pingVolume||70)/100),now+delay+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.15);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now+delay);osc.stop(now+delay+0.16)})}catch(e){}}
function isMentioned(text,myNick){if(!myNick||!text)return false;return new RegExp("(^|\\s)@"+myNick.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")+"\\b","i").test(text)}

// Discord Formatting Parser
function parseDiscordMarkdown(text) {
  let str = escape(text);

  // Code Block ```code```
  const codeBlocks = [];
  str = str.replace(/```(?:[a-z0-9]+)?\n?([\s\S]*?)```/g, (m, code) => {
    codeBlocks.push(code);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // Inline Code `code`
  const inlineCodes = [];
  str = str.replace(/`([^`\n]+)`/g, (m, code) => {
    inlineCodes.push(code);
    return `___INLINE_CODE_${inlineCodes.length - 1}___`;
  });

  // Spoilers ||spoiler||
  str = str.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="fmt-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');

  // Headings & Subtext
  str = str.replace(/^# (.*$)/gm, '<div class="fmt-h1">$1</div>');
  str = str.replace(/^## (.*$)/gm, '<div class="fmt-h2">$1</div>');
  str = str.replace(/^### (.*$)/gm, '<div class="fmt-h3">$1</div>');
  str = str.replace(/^-# (.*$)/gm, '<div class="fmt-subtext">$1</div>');

  // Quotes > quote
  str = str.replace(/^&gt; (.*$)/gm, '<div class="fmt-quote">$1</div>');

  // Bold ***bold* -> *** or **bold**
  str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Underline __underline__
  str = str.replace(/__([^_]+)__/g, '<u>$1</u>');

  // Italic *italic* or _italic_
  str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  str = str.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough ~~strike~~
  str = str.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // Mentions
  str = str.replace(/(^|\s)(@[a-zA-Z0-9_]+)/g, (m, sp, tag) => sp + '<span class="mention">' + tag + '</span>');

  // Restore Inline Code
  str = str.replace(/___INLINE_CODE_(\d+)___/g, (m, idx) => '<code class="fmt-code-inline">' + inlineCodes[idx] + '</code>');

  // Restore Code Block
  str = str.replace(/___CODE_BLOCK_(\d+)___/g, (m, idx) => '<pre class="fmt-code-block">' + codeBlocks[idx] + '</pre>');

  return str;
}

function roleBadgeHtml(uid){if(!uid)return"";const r=roleMap[String(uid).toUpperCase()];if(!r)return"";return'<span class="role-badge '+escape(r)+'">['+escape(r)+"]</span>"}
function addMsg(who,text,me,wasDev,uid,meta,opts){
  meta=meta||{};opts=opts||{};
  const ts=opts.ts||Date.now();
  const skipPersist=!!opts.skipPersist;
  const fromHistory=!!opts.fromHistory;
  
  if(!me && isBlocked(who))return;
  if(!me && typeof isMuted==="function" && isMuted(who))return;

  const d=document.createElement("div");
  d.className="m row-msg"+(me?" me":"");
  if(!me&&!fromHistory&&isMentioned(text,nick)){d.classList.add("pinged");playPingSound();if(settings.desktopNotif&&"Notification"in window&&Notification.permission==="granted"){try{new Notification((meta.displayName||who)+" mentioned you",{body:String(text).slice(0,140)})}catch(e){}}}
  const showName=me?(displayName||nick):(meta.displayName||who);
  const av=me?avatarUrl:(meta.avatar||"");
  const bads=me?profileBadges:(meta.badges||badgesForUser(who,uid));
  if(!me){
    cachePublicProfile(who,{displayName:meta.displayName||who,avatar:meta.avatar||"",bio:meta.bio||"",badges:bads,uid:uid||null});
    if(!fromHistory)savePublicCache();
  }
  const uname=me?nick:who;
  const body=document.createElement("div");
  body.className="mbody";
  body.innerHTML='<div class="who"><span class="who-name" data-user="'+escape(uname)+'">'+escape(me?"you":showName)+'</span> '+badgesHtml(bads)+roleBadgeHtml(uid)+'<span class="t">'+time(ts)+"</span></div>"+parseDiscordMarkdown(text);
  d.innerHTML=avatarHtml(av,showName,"avatar");
  d.appendChild(body);
  const nameEl=body.querySelector(".who-name");
  if(nameEl)nameEl.onclick=e=>{e.stopPropagation();showPublicProfile(nameEl.getAttribute("data-user"))};
  log.appendChild(d);
  log.scrollTop=log.scrollHeight;
  if(!skipPersist&&!fromHistory){
    persistMsg({kind:"chat",who,text,me:!!me,wasDev:!!wasDev,uid:uid||null,displayName:meta.displayName||who,avatar:meta.avatar||"",badges:bads||[],bio:meta.bio||"",ts});
  }
}
function addSys(t,opts){
  opts=opts||{};
  const ts=opts.ts||Date.now();
  const d=document.createElement("div");
  d.className="sys";
  d.textContent=t;
  log.appendChild(d);
  log.scrollTop=log.scrollHeight;
  if(!opts.skipPersist&&!opts.fromHistory){
    persistMsg({kind:"sys",text:t,ts});
  }
}
function addRainbow(text,opts){
  if(!text)return;
  opts=opts||{};
  const ts=opts.ts||Date.now();
  const d=document.createElement("div");
  d.className="rainbow-announce";
  d.textContent=text;
  log.appendChild(d);
  log.scrollTop=log.scrollHeight;
  if(!opts.skipPersist&&!opts.fromHistory){
    persistMsg({kind:"rainbow",text,ts});
  }
}
function renderHistory(){
  log.innerHTML="";
  const list=loadMsgHistory(serverId,channelId);
  if(!list.length)return;
  list.forEach(entry=>{
    if(!entry||!entry.kind)return;
    if(entry.kind==="chat"){
      const me=entry.me||(entry.who===nick);
      addMsg(entry.who,entry.text,me,entry.wasDev,entry.uid,{
        displayName:entry.displayName,
        avatar:entry.avatar,
        badges:entry.badges,
        bio:entry.bio
      },{fromHistory:true,ts:entry.ts,skipPersist:true});
    }else if(entry.kind==="sys"){
      addSys(entry.text,{fromHistory:true,ts:entry.ts,skipPersist:true});
    }else if(entry.kind==="rainbow"){
      addRainbow(entry.text,{fromHistory:true,ts:entry.ts,skipPersist:true});
    }
  });
}
function send(){
  const t=msg.value.trim();
  if(!t||!ch)return;
  if(t.toLowerCase()==="/log all"){
    msg.value="";msg.style.height="auto";
    ch.send({type:"logall",by:nick,uid:userId||undefined});
    addSys("everyone logged out by "+nick,{skipPersist:true});
    setTimeout(()=>forceLogout("logged out (/log all)"),400);
    return;
  }
  if(isAnnounceChannel()&&!isDev){toast("only risk can post in #announcements");return}
  const payload={type:"chat",nick:safeNick(nick),text:safeText(t,800),dev:isDev,uid:userId||undefined,displayName:safeText(displayName||nick,32),avatar:safeUrl(avatarUrl),badges:profileBadges||[],bio:safeText(bio,160)};
  ch.send(payload);
  addMsg(nick,t,true,isDev,userId,{displayName,avatar:avatarUrl,badges:profileBadges,bio:bio});
  msg.value="";msg.style.height="auto";msg.focus();
}
sendBtn.onclick=send;msg.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
function handleMod(p){if(!p||p.type!=="mod")return;const tid=(p.targetUid||"").toUpperCase();if(p.action==="ban"){applyBan(tid,null);addSys("#"+tid+" banned by "+(p.by||"mod"));if(userId&&userId.toUpperCase()===tid){alert("you have been banned");$("leave").click()}}else if(p.action==="suspend"){applyBan(tid,Date.now()+(p.ms||600000));addSys("#"+tid+" suspended");if(userId&&userId.toUpperCase()===tid){alert("suspended 10 minutes");$("leave").click()}}else if(p.action==="unban"){clearBan(tid);addSys("#"+tid+" unbanned")}else if(p.action==="role"){if(p.role)roleMap[tid]=p.role;else delete roleMap[tid];saveRoleMap();addSys("#"+tid+" role -> "+(p.role||"none"))}else if(p.action==="panel"){addSys("#"+tid+" given mod panel");if(userId&&userId.toUpperCase()===tid){hasModPanel=true;localStorage.setItem("anonroom_modpanel",userId);$("mod-panel-bar").classList.add("on");toast("mod panel granted")}}else if(p.action==="revoke_panel"){if(userId&&userId.toUpperCase()===tid){hasModPanel=false;localStorage.removeItem("anonroom_modpanel");$("mod-panel-bar").classList.remove("on")}}else if(p.action==="rainbow")addRainbow(p.text||"");else if(p.action==="badges"){const list=Array.isArray(p.badges)?p.badges:[];const uname=(p.targetUser||"").toLowerCase();if(uname)badgeMap["user:"+uname]=list;if(tid)badgeMap[tid]=list;saveBadgeMap();const label=uname||("#"+tid);addSys(label+" badges updated ("+list.length+")");if((uname&&nick.toLowerCase()===uname)||(userId&&userId.toUpperCase()===tid)){profileBadges=list;saveMyProfile();updateUa()}}}
function presenceKey(){return(userId||nick)+"|"+nick}
function renderOnline(){
  const keys=Object.keys(onlineMap).sort((a,b)=>(onlineMap[a].nick||"").localeCompare(onlineMap[b].nick||""));
  $("online-count").textContent=keys.length;
  const list=$("online-list");
  if(!keys.length){list.innerHTML='<div style="color:#6d6f78;padding:8px;font-size:0.8rem">nobody yet</div>';return}
  
  list.innerHTML="";
  keys.forEach(k=>{
    const p=onlineMap[k];
    if(isBlocked(p.nick))return;
    const me=k===myPresenceKey?" ome":"";
    
    const div=document.createElement("div");
    div.className="op"+me;
    div.onclick=()=>showPublicProfile(p.nick);
    
    const info=document.createElement("span");
    info.innerHTML=escape(p.nick)+(p.dev?' <span style="color:#8a9">[dev]</span>':"");
    div.appendChild(info);

    if(k!==myPresenceKey){
      const actions=document.createElement("div");
      actions.className="op-actions";
      
      const dmBtn=document.createElement("button");
      dmBtn.className="op-btn";
      dmBtn.textContent="DM";
      dmBtn.onclick=(e)=>{
        e.stopPropagation();
        openDm(p.nick);
      };
      
      actions.appendChild(dmBtn);
      div.appendChild(actions);
    }
    
    list.appendChild(div);
  });
}
function announcePresence(kind){if(!presenceCh||!nick||!settings.sharePresence)return;myPresenceKey=presenceKey();presenceCh.send({type:kind||"here",key:myPresenceKey,nick,uid:userId,dev:isDev,room:"****"})}
function startPresence(){stopPresence();onlineMap={};presenceCh=connect("anonroom-presence-v1",{as:nick});presenceCh.on("open",()=>{announcePresence("here");presenceCh.send({type:"who"})});presenceCh.on("message",ev=>{const m=sanitizeIncoming(ev.message);if(!m)return;if(m.type==="here"||m.type==="ping"){if(!m.key||!m.nick)return;onlineMap[m.key]={nick:m.nick,uid:m.uid,dev:!!m.dev,last:Date.now()};renderOnline()}else if(m.type==="gone"&&m.key){delete onlineMap[m.key];renderOnline()}else if(m.type==="who")announcePresence("here")});presenceTimer=setInterval(()=>{announcePresence("ping");const now=Date.now();Object.keys(onlineMap).forEach(k=>{if(now-(onlineMap[k].last||0)>70000)delete onlineMap[k]});renderOnline()},25000);renderOnline()}
function stopPresence(){if(presenceTimer)clearInterval(presenceTimer);presenceTimer=null;if(presenceCh){try{presenceCh.send({type:"gone",key:myPresenceKey,nick});presenceCh.close()}catch(e){}presenceCh=null}onlineMap={}}

$("server-name").onclick=()=>{
  if(!canManageHomeServer()){
    toast("only risk can modify server settings for home");
    return;
  }
  const s=servers[serverId];
  if(!s)return;
  $("modal-edit-server-name").value=s.name||serverId;
  $("modal-edit-server-icon").value=s.icon||"";
  $("modal-edit-server").classList.add("on");
};

$("modal-edit-server-ok").onclick=()=>{
  if(!canManageHomeServer()){
    toast("only risk can modify server settings for home");
    $("modal-edit-server").classList.remove("on");
    return;
  }
  const s=servers[serverId];
  if(!s)return;
  const newName=$("modal-edit-server-name").value.trim();
  const newIcon=$("modal-edit-server-icon").value.trim();
  if(newName)s.name=newName;
  s.icon=newIcon;
  saveServers();
  renderServers();
  renderChannels();
  $("modal-edit-server").classList.remove("on");
  toast("server settings saved");
};
$("modal-edit-server-cancel").onclick=()=>$("modal-edit-server").classList.remove("on");

$("btn-add-channel").onclick=()=>{
  if(!canManageHomeServer()){
    toast("only risk can add channels to home");
    return;
  }
  $("modal-channel").classList.add("on");
};


$("modal-channel-ok").onclick=()=>{
  if(!canManageHomeServer()){
    toast("only risk can add channels to home");
    $("modal-channel").classList.remove("on");
    return;
  }
  const name=cleanId($("modal-channel-name").value,"");
  if(!name)return toast("enter a name");
  const s=servers[serverId];
  if(!s.channels.includes(name)){
    s.channels.push(name);
    saveServers();
  }
  $("modal-channel").classList.remove("on");
  $("modal-channel-name").value="";
  switchChannel(name);
};
$("modal-channel-cancel").onclick=()=>$("modal-channel").classList.remove("on");

$("modal-edit-channel-ok").onclick=()=>{
  if(!canManageHomeServer()){
    toast("only risk can edit channels on home");
    $("modal-edit-channel").classList.remove("on");
    return;
  }
  const newName=cleanId($("modal-edit-channel-name").value,"");
  if(!newName)return toast("enter a channel name");
  const s=servers[serverId];
  if(s&&targetEditChannel){
    const idx=s.channels.indexOf(targetEditChannel);
    if(idx!==-1){
      s.channels[idx]=newName;
      saveServers();
      if(channelId===targetEditChannel){
        channelId=newName;
      }
      renderChannels();
      updateHeader();
    }
  }
  $("modal-edit-channel").classList.remove("on");
  toast("channel updated");
};
$("modal-edit-channel-cancel").onclick=()=>$("modal-edit-channel").classList.remove("on");

$("online-btn").onclick=()=>$("members").classList.toggle("on");
$("rules-btn").onclick=()=>$("rules-panel").classList.add("on");
$("close-rules").onclick=()=>$("rules-panel").classList.remove("on");
$("rules-panel").onclick=e=>{if(e.target===$("rules-panel"))$("rules-panel").classList.remove("on")};
$("copy").onclick=()=>{
  let url = location.origin+location.pathname;
  if(activeDmUser){
    url += "#dm/" + encodeURIComponent(activeDmUser);
  } else {
    url += "#" + encodeURIComponent(channelId);
  }
  navigator.clipboard.writeText(url).then(()=>toast("invite link copied")).catch(()=>prompt("copy:",url))
};
$("copy-id-btn").onclick=()=>{if(!userId)return toast("no id");navigator.clipboard.writeText(userId).then(()=>toast("id copied")).catch(()=>prompt("id:",userId))};
$("leave").onclick=()=>{
  try{saveMyProfile();saveBadgeMap();saveRoleMap();savePublicCache()}catch(e){}
  clearSession();
  if(ch)try{ch.send({type:"sys",text:nick+" left"});ch.close()}catch(e){}
  stopPresence();stopServerSync();
  log.innerHTML="";
  $("app").classList.remove("on");
  $("join").style.display="flex";
  $("dev-bar").classList.remove("on");
  closeFloatPanel();
  $("mod-panel-bar").classList.remove("on");
  $("members").classList.remove("on");
  isDev=false;hasModPanel=false;userId=null;nick="";
  $("guest-nick").value=randNick();
  $("twofa-step").classList.remove("on");
  $("unlock-step").style.display="none";
  $("login-form").style.display="block";
  history.replaceState(null,"",location.pathname);
};
if(window.innerWidth<=720)$("btn-toggle-sidebar").style.display="";
$("btn-toggle-sidebar").onclick=()=>$("sidebar").classList.toggle("mobile-on");
function updatePassDisplay(){if(!isDev)return;const left=Math.ceil((120000-(Date.now()%120000))/1000);const el=$("dev-pass-display");if(el)el.textContent=getCurrentDevPass()+"  -  "+left+"s"}
setInterval(updatePassDisplay,1000);
$("dev-clear").onclick=()=>{log.innerHTML="";clearMsgHistory(serverId,channelId);addSys("log cleared",{skipPersist:true});toast("history cleared")};
$("mod-clear-log").onclick=()=>{log.innerHTML="";clearMsgHistory(serverId,channelId);addSys("log cleared",{skipPersist:true});toast("history cleared")};
$("dev-webhook").onclick=()=>sendPassToDiscord(true);

/* ===== Floating Control Panel (dev + mod) ===== */
let fpMode="dev";
let fpTab="users";
let pendingBadgeIcon="";
let fpDrag={active:false,ox:0,oy:0};
let fpUserFilter="";
let localMutes={};
let userNotes={};
try{localMutes=JSON.parse(localStorage.getItem("anonroom_mutes")||"{}")}catch(e){}
try{userNotes=JSON.parse(localStorage.getItem("anonroom_notes")||"{}")}catch(e){}
function saveMutes(){try{localStorage.setItem("anonroom_mutes",JSON.stringify(localMutes))}catch(e){}}
function saveNotes(){try{localStorage.setItem("anonroom_notes",JSON.stringify(userNotes))}catch(e){}}
function isMuted(n){const k=String(n||"").toLowerCase();const m=localMutes[k];if(!m)return false;if(m.until&&Date.now()>m.until){delete localMutes[k];saveMutes();return false}return true}
function setMute(n,ms){const k=String(n||"").toLowerCase();if(!k)return;if(!ms){delete localMutes[k]}else{localMutes[k]={until:Date.now()+ms,by:nick}}saveMutes()}
function loadAudit(){try{return JSON.parse(localStorage.getItem("anonroom_audit")||"[]")}catch(e){return[]}}
function pushAudit(text){const list=loadAudit();list.push({t:Date.now(),text:String(text).slice(0,200),by:nick});if(list.length>100)list.splice(0,list.length-100);try{localStorage.setItem("anonroom_audit",JSON.stringify(list))}catch(e){}}

function openFloatPanel(mode){
  fpMode=mode||(isDev?"dev":"mod");
  $("fp-title-text").textContent=fpMode==="dev"?"Staff panel":"Mod panel";
  renderFpTabs();
  renderFpBody();
  $("float-panel").classList.add("on");
}
function closeFloatPanel(){$("float-panel").classList.remove("on")}
$("dev-toggle-panel").onclick=()=>openFloatPanel("dev");
$("mod-open-panel").onclick=()=>openFloatPanel("mod");
$("fp-close").onclick=closeFloatPanel;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("float-panel").classList.contains("on"))closeFloatPanel()});

(function(){
  const head=$("fp-drag"), panel=$("float-panel");
  head.addEventListener("mousedown",e=>{
    if(e.target.closest(".fp-close"))return;
    fpDrag.active=true;
    const r=panel.getBoundingClientRect();
    fpDrag.ox=e.clientX-r.left; fpDrag.oy=e.clientY-r.top;
    panel.style.right="auto"; panel.style.bottom="auto";
  });
  window.addEventListener("mousemove",e=>{
    if(!fpDrag.active)return;
    panel.style.left=Math.max(0,Math.min(window.innerWidth-80,e.clientX-fpDrag.ox))+"px";
    panel.style.top=Math.max(0,Math.min(window.innerHeight-60,e.clientY-fpDrag.oy))+"px";
  });
  window.addEventListener("mouseup",()=>fpDrag.active=false);
})();

function renderFpTabs(){
  const tabs=fpMode==="dev"
    ?[["users","Users"],["mod","Actions"],["bans","Bans"],["broadcast","Broadcast"],["channels","Channels"],["badges","Badges"],["notes","Notes"],["tools","Tools"],["system","System"]]
    :[["users","Users"],["mod","Actions"],["bans","Bans"],["broadcast","Broadcast"],["notes","Notes"],["tools","Tools"]];
  const el=$("fp-tabs"); el.innerHTML="";
  if(!tabs.find(t=>t[0]===fpTab))fpTab=tabs[0][0];
  tabs.forEach(([id,label])=>{
    const b=document.createElement("button");
    b.className="fp-tab"+(fpTab===id?" on":"");
    b.textContent=label;
    b.onclick=()=>{fpTab=id;renderFpTabs();renderFpBody()};
    el.appendChild(b);
  });
}

function fpUserListHtml(fullActions, filter){
  filter=(filter||"").toLowerCase();
  let keys=Object.keys(onlineMap).sort((a,b)=>(onlineMap[a].nick||"").localeCompare(onlineMap[b].nick||""));
  if(filter)keys=keys.filter(k=>{
    const p=onlineMap[k];
    return (p.nick||"").toLowerCase().includes(filter)||String(p.uid||"").toLowerCase().includes(filter);
  });
  if(!keys.length)return '<div class="fp-note">'+(filter?"no matches":"nobody online")+'</div>';
  return '<div class="fp-user-list">'+keys.map(k=>{
    const p=onlineMap[k];
    const uid=p.uid||"";
    const role=uid&&roleMap[String(uid).toUpperCase()]?roleMap[String(uid).toUpperCase()]:"";
    const me=k===myPresenceKey;
    const muted=isMuted(p.nick);
    const note=userNotes[String(p.nick||"").toLowerCase()];
    const acts=fullActions&&!me
      ?`<div class="fu-acts">
          <button class="fp-btn danger" data-act="ban" data-uid="${escapeAttr(uid)}" data-nick="${escapeAttr(p.nick)}">ban</button>
          <button class="fp-btn warn" data-act="to10" data-uid="${escapeAttr(uid)}" data-nick="${escapeAttr(p.nick)}">10m</button>
          <button class="fp-btn" data-act="mute" data-nick="${escapeAttr(p.nick)}">${muted?"unmute":"mute"}</button>
          <button class="fp-btn" data-act="dm" data-nick="${escapeAttr(p.nick)}">dm</button>
          <button class="fp-btn" data-act="copyid" data-uid="${escapeAttr(uid)}" data-nick="${escapeAttr(p.nick)}">id</button>
          <button class="fp-btn" data-act="profile" data-nick="${escapeAttr(p.nick)}">view</button>
        </div>`
      :(!me?`<div class="fu-acts">
          <button class="fp-btn" data-act="profile" data-nick="${escapeAttr(p.nick)}">view</button>
          <button class="fp-btn" data-act="dm" data-nick="${escapeAttr(p.nick)}">dm</button>
          <button class="fp-btn" data-act="mute" data-nick="${escapeAttr(p.nick)}">${muted?"unmute":"mute"}</button>
        </div>`:"");
    return `<div class="fp-user" data-nick="${escapeAttr(p.nick)}" data-uid="${escapeAttr(uid)}">
      <div class="fu-av">${escape((p.nick||"?").slice(0,1).toUpperCase())}</div>
      <div class="fu-info">
        <div class="fu-nick">${escape(p.nick)}${p.dev?' <span style="color:#f23f43">[dev]</span>':""}${me?' <span style="color:#23a559">(you)</span>':""}${muted?' <span style="color:#eab308">muted</span>':""}</div>
        <div class="fu-meta">${uid?"#"+escape(uid):"guest"}${role?" - "+escape(role):""}${note?" - note set":""}</div>
      </div>${acts}
    </div>`;
  }).join("")+'</div>';
}

function bindFpUserActions(root){
  root.querySelectorAll("[data-act]").forEach(btn=>{
    btn.onclick=e=>{
      e.stopPropagation();
      const act=btn.getAttribute("data-act");
      const uid=(btn.getAttribute("data-uid")||"").toUpperCase();
      const uname=btn.getAttribute("data-nick")||"";
      if(act==="profile"){showPublicProfile(uname);return}
      if(act==="dm"){openDm(uname);closeFloatPanel();return}
      if(act==="copyid"){
        const v=uid||uname;
        navigator.clipboard.writeText(v).then(()=>toast("copied "+v)).catch(()=>prompt("id:",v));
        return;
      }
      if(act==="mute"){
        if(isMuted(uname)){setMute(uname,0);toast("unmuted @"+uname);pushAudit("unmute @"+uname)}
        else{setMute(uname,60*60*1000);toast("muted @"+uname+" for 1h");pushAudit("mute @"+uname+" 1h")}
        renderFpBody();return;
      }
      if(!uid&&(act==="ban"||act==="to10"||act==="rolemod"))return toast("user has no id (guest)");
      if(act==="ban"){sendModTo(uid,"ban");pushAudit("ban #"+uid+" (@"+uname+")");toast("banned #"+uid)}
      else if(act==="to10"){sendModTo(uid,"suspend",{ms:600000});pushAudit("timeout 10m #"+uid);toast("timed out 10m")}
      else if(act==="rolemod"){sendModTo(uid,"role",{role:"mod"});pushAudit("role mod #"+uid);toast("role set: mod")}
    };
  });
}

function sendModTo(targetUid,action,extra){
  if(!ch)return toast("not connected");
  if(!isDev&&!hasModPanel)return toast("no permission");
  const tid=String(targetUid||"").trim().toUpperCase();
  if(!tid)return toast("need a user id");
  ch.send(Object.assign({type:"mod",action,targetUid:tid,by:nick,byUid:userId},extra||{}));
  addSys("[mod] "+action+" -> #"+tid);
}

function roomStats(){
  const hist=loadMsgHistory(serverId,channelId)||[];
  const chats=hist.filter(e=>e&&e.kind==="chat");
  const by={};
  chats.forEach(e=>{const w=String(e.who||"?").toLowerCase();by[w]=(by[w]||0)+1});
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return {total:hist.length,chats:chats.length,online:Object.keys(onlineMap).length,top};
}

function renderFpBody(){
  const body=$("fp-body");
  const onlineCount=Object.keys(onlineMap).length;
  const stats=roomStats();

  if(fpTab==="users"){
    body.innerHTML=`<div class="fp-stat">
        <span class="fp-stat-chip">${onlineCount} online</span>
        <span class="fp-stat-chip">#${escape(channelId)}</span>
        <span class="fp-stat-chip">${stats.chats} msgs</span>
        ${isDev?'<span class="fp-stat-chip">dev</span>':''}
        ${hasModPanel?'<span class="fp-stat-chip">mod</span>':''}
      </div>
      <input class="fp-search" id="fp-user-search" placeholder="filter by name or id..." value="${escapeAttr(fpUserFilter)}">
      <div class="fp-sec"><div class="fp-sec-title">online</div>${fpUserListHtml(isDev||hasModPanel,fpUserFilter)}</div>
      <div class="fp-note">mute is local on this device. ban/timeout need a registered id.</div>`;
    const search=$("fp-user-search");
    if(search){
      search.oninput=()=>{fpUserFilter=search.value.trim();renderFpBody();const s=$("fp-user-search");if(s){s.focus();s.selectionStart=s.selectionEnd=s.value.length}};
    }
    bindFpUserActions(body);
  }

  else if(fpTab==="mod"){
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">target</div>
      <input id="fp-target-uid" placeholder="user id (e.g. AB12CD)">
      <input id="fp-target-nick" placeholder="username (for mute / notes)">
      <div class="fp-row">
        <button class="fp-btn danger" id="fp-ban">ban</button>
        <button class="fp-btn ok" id="fp-unban">unban</button>
      </div>
      <div class="fp-sec-title">timeout</div>
      <div class="fp-row">
        <button class="fp-btn warn" data-to="60000">1m</button>
        <button class="fp-btn warn" data-to="300000">5m</button>
        <button class="fp-btn warn" data-to="600000">10m</button>
        <button class="fp-btn warn" data-to="3600000">1h</button>
        <button class="fp-btn warn" data-to="86400000">24h</button>
      </div>
      <div class="fp-sec-title">roles</div>
      <div class="fp-row">
        <button class="fp-btn" id="fp-role-mod">mod</button>
        <button class="fp-btn" id="fp-role-vip">vip</button>
        <button class="fp-btn" id="fp-role-clear">clear</button>
      </div>
      ${isDev?`<div class="fp-sec-title">panel access</div>
      <div class="fp-row">
        <button class="fp-btn primary" id="fp-give-panel">give mod panel</button>
        <button class="fp-btn danger" id="fp-revoke-panel">revoke panel</button>
      </div>`:""}
      <div class="fp-sec-title">local mute</div>
      <div class="fp-row">
        <button class="fp-btn" id="fp-mute-1h">mute 1h</button>
        <button class="fp-btn" id="fp-mute-clear">unmute</button>
      </div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">room actions</div>
      <div class="fp-row">
        <button class="fp-btn danger" id="fp-logall">force logout all</button>
        <button class="fp-btn warn" id="fp-purge">clear my history</button>
      </div>
      <div class="fp-note">force logout hits every connected client. history clear is local only.</div>
    </div>`;
    const getUid=()=>($("fp-target-uid").value||"").trim().toUpperCase();
    const getNick=()=>($("fp-target-nick").value||"").trim().toLowerCase();
    $("fp-ban").onclick=()=>{sendModTo(getUid(),"ban");pushAudit("ban #"+getUid())};
    $("fp-unban").onclick=()=>{sendModTo(getUid(),"unban");pushAudit("unban #"+getUid())};
    body.querySelectorAll("[data-to]").forEach(b=>{
      b.onclick=()=>{
        const ms=parseInt(b.getAttribute("data-to"),10)||600000;
        sendModTo(getUid(),"suspend",{ms});
        pushAudit("timeout "+b.textContent+" #"+getUid());
        toast("timeout "+b.textContent);
      };
    });
    $("fp-role-mod").onclick=()=>{sendModTo(getUid(),"role",{role:"mod"});pushAudit("role mod #"+getUid())};
    $("fp-role-vip").onclick=()=>{sendModTo(getUid(),"role",{role:"vip"});pushAudit("role vip #"+getUid())};
    $("fp-role-clear").onclick=()=>{sendModTo(getUid(),"role",{role:null});pushAudit("role clear #"+getUid())};
    if(isDev){
      $("fp-give-panel").onclick=()=>{sendModTo(getUid(),"panel");pushAudit("give panel #"+getUid())};
      $("fp-revoke-panel").onclick=()=>{sendModTo(getUid(),"revoke_panel");pushAudit("revoke panel #"+getUid())};
    }
    $("fp-mute-1h").onclick=()=>{const n=getNick();if(!n)return toast("enter username");setMute(n,3600000);pushAudit("mute @"+n);toast("muted @"+n);renderFpBody()};
    $("fp-mute-clear").onclick=()=>{const n=getNick();if(!n)return toast("enter username");setMute(n,0);pushAudit("unmute @"+n);toast("unmuted");renderFpBody()};
    $("fp-logall").onclick=()=>{
      if(!confirm("Force logout everyone in this room?"))return;
      if(ch)ch.send({type:"logall",by:nick,uid:userId||undefined});
      pushAudit("force logout all");
      addSys("everyone logged out by "+nick,{skipPersist:true});
      setTimeout(()=>forceLogout("logged out (/log all)"),400);
    };
    $("fp-purge").onclick=()=>{log.innerHTML="";clearMsgHistory(serverId,channelId);addSys("log purged",{skipPersist:true});pushAudit("purged local history");toast("local history cleared")};
  }

  else if(fpTab==="bans"){
    const bans=loadBans();
    const rows=Object.keys(bans).map(uid=>{
      const b=bans[uid];
      const label=b.until?("until "+new Date(b.until).toLocaleString()):"permanent";
      return `<tr><td>#${escape(uid)}</td><td>${escape(label)}</td>
        <td><button class="fp-btn ok" data-unban="${escapeAttr(uid)}">unban</button></td></tr>`;
    }).join("");
    const muteRows=Object.keys(localMutes).map(n=>{
      const m=localMutes[n];
      if(m.until&&Date.now()>m.until)return"";
      return `<tr><td>@${escape(n)}</td><td>${m.until?("until "+new Date(m.until).toLocaleString()):"active"}</td>
        <td><button class="fp-btn" data-unmute="${escapeAttr(n)}">unmute</button></td></tr>`;
    }).join("");
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">active bans</div>
      ${rows?`<table class="fp-table"><thead><tr><th>id</th><th>status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`:'<div class="fp-note">no bans stored on this device</div>'}
      ${isDev||hasModPanel?`<div class="fp-row" style="margin-top:8px"><button class="fp-btn danger" id="fp-clear-bans">clear all bans</button></div>`:""}
    </div>
    <div class="fp-sec"><div class="fp-sec-title">local mutes</div>
      ${muteRows?`<table class="fp-table"><thead><tr><th>user</th><th>status</th><th></th></tr></thead><tbody>${muteRows}</tbody></table>`:'<div class="fp-note">no local mutes</div>'}
    </div>
    <div class="fp-sec"><div class="fp-sec-title">recent staff actions</div>
      <div class="fp-user-list" style="max-height:160px">${(loadAudit().slice().reverse().slice(0,20).map(a=>`<div class="fp-user"><div class="fu-info"><div class="fu-nick">${escape(a.text)}</div><div class="fu-meta">${new Date(a.t).toLocaleString()} - ${escape(a.by||"")}</div></div></div>`).join("")||'<div class="fp-note" style="padding:10px">no actions logged yet</div>')}</div>
    </div>`;
    body.querySelectorAll("[data-unban]").forEach(b=>b.onclick=()=>{
      const uid=b.getAttribute("data-unban");
      clearBan(uid);sendModTo(uid,"unban");pushAudit("unban #"+uid);renderFpBody();
    });
    body.querySelectorAll("[data-unmute]").forEach(b=>b.onclick=()=>{
      setMute(b.getAttribute("data-unmute"),0);renderFpBody();
    });
    const cb=$("fp-clear-bans");
    if(cb)cb.onclick=()=>{if(!confirm("Clear all bans stored on this device?"))return;try{localStorage.removeItem("anonroom_bans")}catch(e){}pushAudit("cleared all bans");toast("bans cleared");renderFpBody()};
  }

  else if(fpTab==="broadcast"){
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">system message</div>
      <textarea id="fp-sys-text" placeholder="shown as a gray system line..."></textarea>
      <div class="fp-row"><button class="fp-btn primary" id="fp-sys-send">send system</button></div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">rainbow banner</div>
      <input id="fp-rainbow-text" placeholder="big centered announcement" maxlength="200">
      <div class="fp-row"><button class="fp-btn" id="fp-rainbow-send">send rainbow</button></div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">post as yourself</div>
      <textarea id="fp-chat-text" placeholder="normal message to #${escape(channelId)}"></textarea>
      <div class="fp-row"><button class="fp-btn" id="fp-chat-send">send to channel</button></div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">quick phrases</div>
      <div class="fp-row">
        <button class="fp-btn" data-phrase="please keep it civil">civil</button>
        <button class="fp-btn" data-phrase="off-topic, take it to another channel">off-topic</button>
        <button class="fp-btn" data-phrase="no spam">no spam</button>
        <button class="fp-btn" data-phrase="read the rules">rules</button>
      </div>
    </div>`;
    $("fp-sys-send").onclick=()=>{const t=$("fp-sys-text").value.trim();if(!t||!ch)return;const prefix=isDev?"[dev] ":"[mod] ";ch.send({type:"sys",text:prefix+safeText(t,300)});addSys(prefix+t);pushAudit("sys: "+t.slice(0,60));$("fp-sys-text").value="";toast("sent")};
    $("fp-rainbow-send").onclick=()=>{const t=$("fp-rainbow-text").value.trim();if(!t||!ch)return;if(!isDev&&!hasModPanel)return toast("no permission");ch.send({type:"rainbow",text:safeText(t,200),by:nick});addRainbow(t);pushAudit("rainbow");$("fp-rainbow-text").value="";toast("sent")};
    $("fp-chat-send").onclick=()=>{const t=$("fp-chat-text").value.trim();if(!t||!ch)return;const payload={type:"chat",nick:safeNick(nick),text:safeText(t,800),dev:isDev,uid:userId||undefined,displayName:safeText(displayName||nick,32),avatar:safeUrl(avatarUrl),badges:profileBadges||[],bio:safeText(bio,160)};ch.send(payload);addMsg(nick,t,true,isDev,userId,{displayName,avatar:avatarUrl,badges:profileBadges,bio});$("fp-chat-text").value="";toast("sent")};
    body.querySelectorAll("[data-phrase]").forEach(b=>b.onclick=()=>{
      const t=b.getAttribute("data-phrase");
      if(!ch)return;
      const prefix=isDev?"[dev] ":"[mod] ";
      ch.send({type:"sys",text:prefix+t});addSys(prefix+t);toast("sent");
    });
  }

  else if(fpTab==="channels"){
    const s=servers[serverId]||{channels:[]};
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">server</div>
      <div class="fp-stat"><span class="fp-stat-chip">${escape(s.name||serverId)}</span><span class="fp-stat-chip">${(s.channels||[]).length} channels</span></div>
      ${canManageHomeServer()?`<input id="fp-server-name" placeholder="server name" value="${escapeAttr(s.name||"")}">
      <div class="fp-row"><button class="fp-btn" id="fp-save-server">save name</button></div>`:'<div class="fp-note">only risk can edit the home server.</div>'}
    </div>
    <div class="fp-sec"><div class="fp-sec-title">channels</div>
      <div class="fp-user-list">${(s.channels||[]).map(c=>`<div class="fp-user">
        <div class="fu-info"><div class="fu-nick">#${escape(c)}</div>
        <div class="fu-meta">${c===channelId?"current":""}${c==="announcements"?" - locked to staff":""}</div></div>
        <div class="fu-acts">
          <button class="fp-btn" data-goto="${escapeAttr(c)}">go</button>
          ${canManageHomeServer()&&c!=="general"&&c!=="announcements"?`<button class="fp-btn danger" data-delch="${escapeAttr(c)}">del</button>`:""}
        </div></div>`).join("")}</div>
    </div>
    ${canManageHomeServer()?`<div class="fp-sec"><div class="fp-sec-title">create channel</div>
      <input id="fp-new-ch" placeholder="channel-name" maxlength="32">
      <div class="fp-row"><button class="fp-btn ok" id="fp-create-ch">create</button></div>
    </div>`:""}`;
    body.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{switchChannel(b.getAttribute("data-goto"));toast("switched");renderFpBody()});
    body.querySelectorAll("[data-delch]").forEach(b=>b.onclick=()=>{
      const name=b.getAttribute("data-delch");
      if(!confirm("Delete #"+name+"?"))return;
      const srv=servers[serverId];
      srv.channels=srv.channels.filter(c=>c!==name);
      saveServers();
      if(channelId===name)switchChannel("general");
      else renderChannels();
      pushAudit("deleted #"+name);
      toast("deleted");renderFpBody();
    });
    const saveSrv=$("fp-save-server");
    if(saveSrv)saveSrv.onclick=()=>{
      const n=($("fp-server-name").value||"").trim().slice(0,32);
      if(!n)return;
      servers[serverId].name=n;saveServers();renderServers();renderChannels();pushAudit("renamed server");toast("saved");renderFpBody();
    };
    const createBtn=$("fp-create-ch");
    if(createBtn)createBtn.onclick=()=>{
      const name=cleanId($("fp-new-ch").value,"");
      if(!name)return toast("enter a name");
      const srv=servers[serverId];
      if(!srv.channels.includes(name)){srv.channels.push(name);saveServers()}
      switchChannel(name);pushAudit("created #"+name);toast("created #"+name);renderFpBody();
    };
  }

  else if(fpTab==="badges"){
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">grant badge</div>
      <input id="fp-badge-user" placeholder="username">
      <input id="fp-badge-name" placeholder="badge label" maxlength="24">
      <span class="dp-file-label">optional icon (max ~200kb)</span>
      <input type="file" id="fp-badge-icon" accept="image/*">
      <div class="fp-row">
        <button class="fp-btn ok" id="fp-add-badge">save badge</button>
        <button class="fp-btn danger" id="fp-clear-badges">clear user badges</button>
      </div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">badge holders</div>
      <div class="fp-user-list" id="fp-badge-list"></div>
    </div>`;
    pendingBadgeIcon="";
    $("fp-badge-icon").onchange=e=>{
      const f=e.target.files&&e.target.files[0];
      if(!f){pendingBadgeIcon="";return}
      if(f.size>200000){toast("icon max ~200kb");pendingBadgeIcon="";return}
      const reader=new FileReader();
      reader.onload=()=>{pendingBadgeIcon=reader.result;toast("icon ready")};
      reader.readAsDataURL(f);
    };
    $("fp-add-badge").onclick=()=>{
      if(!isDev)return toast("dev only");
      const uname=safeNick($("fp-badge-user").value);
      const bname=safeText($("fp-badge-name").value,24);
      if(!uname)return toast("need a username");
      if(!bname)return toast("need a badge name");
      const key="user:"+uname;
      const list=(badgeMap[key]||[]).slice();
      const entry={name:bname};
      if(pendingBadgeIcon)entry.icon=pendingBadgeIcon;
      const idx=list.findIndex(x=>(typeof x==="string"?x:x.name)===bname);
      if(idx>=0)list[idx]=entry;else list.push(entry);
      if(list.length>12)list.shift();
      badgeMap[key]=list;saveBadgeMap();
      if(ch)ch.send({type:"mod",action:"badges",targetUser:uname,badges:list,by:nick});
      if(nick.toLowerCase()===uname){profileBadges=list;saveMyProfile();updateUa()}
      pushAudit("badge "+bname+" -> @"+uname);
      addSys("[mod] badge \""+bname+"\" -> @"+uname);
      toast("saved");$("fp-badge-name").value="";pendingBadgeIcon="";$("fp-badge-icon").value="";
      renderFpBody();
    };
    $("fp-clear-badges").onclick=()=>{
      if(!isDev)return;
      const uname=safeNick($("fp-badge-user").value);
      if(!uname)return toast("need a username");
      badgeMap["user:"+uname]=[];saveBadgeMap();
      if(ch)ch.send({type:"mod",action:"badges",targetUser:uname,badges:[],by:nick});
      if(nick.toLowerCase()===uname){profileBadges=[];saveMyProfile();updateUa()}
      pushAudit("cleared badges @"+uname);
      toast("cleared");renderFpBody();
    };
    const listEl=$("fp-badge-list");
    const holders=Object.keys(badgeMap).filter(k=>k.startsWith("user:")&&badgeMap[k]&&badgeMap[k].length);
    if(!holders.length)listEl.innerHTML='<div class="fp-note" style="padding:10px">no badges yet</div>';
    else listEl.innerHTML=holders.map(k=>{
      const u=k.slice(5);
      const bs=badgeMap[k].map(b=>typeof b==="string"?b:b.name).join(", ");
      return `<div class="fp-user"><div class="fu-info"><div class="fu-nick">@${escape(u)}</div><div class="fu-meta">${escape(bs)}</div></div>
        <div class="fu-acts"><button class="fp-btn" data-fill="${escapeAttr(u)}">edit</button></div></div>`;
    }).join("");
    listEl.querySelectorAll("[data-fill]").forEach(b=>b.onclick=()=>{$("fp-badge-user").value=b.getAttribute("data-fill")});
  }

  else if(fpTab==="notes"){
    const noteKeys=Object.keys(userNotes).sort();
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">staff note</div>
      <input id="fp-note-user" placeholder="username">
      <textarea id="fp-note-text" placeholder="private note (only on this device)"></textarea>
      <div class="fp-row">
        <button class="fp-btn primary" id="fp-note-save">save note</button>
        <button class="fp-btn danger" id="fp-note-del">delete</button>
      </div>
      <div class="fp-note">notes never leave this browser.</div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">saved notes</div>
      <div class="fp-user-list">${noteKeys.length?noteKeys.map(k=>`<div class="fp-user">
        <div class="fu-info"><div class="fu-nick">@${escape(k)}</div><div class="fu-meta">${escape(String(userNotes[k]).slice(0,80))}</div></div>
        <div class="fu-acts"><button class="fp-btn" data-loadnote="${escapeAttr(k)}">open</button></div>
      </div>`).join(""):'<div class="fp-note" style="padding:10px">no notes yet</div>'}</div>
    </div>`;
    $("fp-note-save").onclick=()=>{
      const u=safeNick($("fp-note-user").value);const t=safeText($("fp-note-text").value,500);
      if(!u)return toast("enter username");
      if(!t){delete userNotes[u]}else{userNotes[u]=t}
      saveNotes();toast("saved");renderFpBody();
    };
    $("fp-note-del").onclick=()=>{
      const u=safeNick($("fp-note-user").value);if(!u)return;
      delete userNotes[u];saveNotes();toast("deleted");renderFpBody();
    };
    body.querySelectorAll("[data-loadnote]").forEach(b=>b.onclick=()=>{
      const u=b.getAttribute("data-loadnote");
      $("fp-note-user").value=u;$("fp-note-text").value=userNotes[u]||"";
    });
  }

  else if(fpTab==="tools"){
    const st=roomStats();
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">room stats</div>
      <div class="fp-stat">
        <span class="fp-stat-chip">${st.online} online</span>
        <span class="fp-stat-chip">${st.chats} chat msgs</span>
        <span class="fp-stat-chip">${st.total} total entries</span>
      </div>
      ${st.top.length?`<div class="fp-note">top posters: ${st.top.map(([n,c])=>escape(n)+" ("+c+")").join(", ")}</div>`:""}
    </div>
    <div class="fp-sec"><div class="fp-sec-title">quick</div>
      <div class="fp-row">
        <button class="fp-btn" id="fp-copy-invite">copy invite</button>
        <button class="fp-btn" id="fp-copy-id">copy my id</button>
      </div>
      <div class="fp-row">
        <button class="fp-btn" id="fp-refresh-presence">refresh presence</button>
        <button class="fp-btn" id="fp-info">post room info</button>
      </div>
      ${isDev?`<div class="fp-row">
        <button class="fp-btn" id="fp-copy-pass">copy password</button>
        <button class="fp-btn" id="fp-send-dc">send pass to discord</button>
      </div>`:""}
    </div>
    <div class="fp-sec"><div class="fp-sec-title">data</div>
      <div class="fp-row">
        <button class="fp-btn warn" id="fp-clear-local">clear channel history</button>
        <button class="fp-btn" id="fp-export">export json</button>
      </div>
      <div class="fp-row">
        <button class="fp-btn" id="fp-import">import json</button>
        <input type="file" id="fp-import-file" accept="application/json,.json" style="display:none">
      </div>
    </div>`;
    $("fp-copy-invite").onclick=()=>{$("copy").click()};
    $("fp-copy-id").onclick=()=>{if(!userId)return toast("no id");navigator.clipboard.writeText(userId).then(()=>toast("id copied")).catch(()=>prompt("id:",userId))};
    $("fp-refresh-presence").onclick=()=>{announcePresence("here");if(presenceCh)presenceCh.send({type:"who"});toast("refreshed")};
    $("fp-info").onclick=()=>{addSys("server: "+serverId+" - #"+channelId+" - "+nick+" - id: "+(userId||"none")+(activeDmUser?" - dm:@"+activeDmUser:""));toast("posted")};
    if(isDev){
      $("fp-copy-pass").onclick=()=>{const p=getCurrentDevPass();navigator.clipboard.writeText(p).then(()=>toast("copied")).catch(()=>prompt("pass:",p))};
      $("fp-send-dc").onclick=()=>sendPassToDiscord(true);
    }
    $("fp-clear-local").onclick=()=>{log.innerHTML="";clearMsgHistory(serverId,channelId);addSys("log cleared",{skipPersist:true});toast("cleared")};
    $("fp-export").onclick=()=>{
      try{
        const data={};
        for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.indexOf("anonroom")===0)data[k]=localStorage.getItem(k)}
        const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
        const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="anonroom-data.json";
        document.body.appendChild(a);a.click();a.remove();toast("exported");
      }catch(e){toast("export failed")}
    };
    $("fp-import").onclick=()=>$("fp-import-file").click();
    $("fp-import-file").onchange=e=>{
      const f=e.target.files&&e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=()=>{
        try{
          const data=JSON.parse(r.result);
          if(!data||typeof data!=="object")throw new Error("bad file");
          Object.keys(data).forEach(k=>{if(k.indexOf("anonroom")===0)localStorage.setItem(k,data[k])});
          toast("imported - reload recommended");
          pushAudit("imported data");
        }catch(err){toast("import failed")}
      };
      r.readAsText(f);
    };
  }

  else if(fpTab==="system"){
    const left=Math.ceil((120000-(Date.now()%120000))/1000);
    let bytes=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("anonroom")===0)bytes+=(localStorage.getItem(k)||"").length}}catch(e){}
    body.innerHTML=`<div class="fp-sec"><div class="fp-sec-title">credentials</div>
      <div class="fp-note">password rotates every 2 minutes</div>
      <div class="dev-pass" style="margin-bottom:8px" id="fp-pass-live">${escape(getCurrentDevPass())} - ${left}s</div>
      <div class="fp-row">
        <button class="fp-btn" id="fp-sys-copy-pass">copy</button>
        <button class="fp-btn" id="fp-sys-dc">send to discord</button>
        <button class="fp-btn" id="fp-sys-refresh">refresh</button>
      </div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">session</div>
      <div class="fp-stat">
        <span class="fp-stat-chip">${escape(nick)}</span>
        <span class="fp-stat-chip">${escape(userId||"guest")}</span>
        <span class="fp-stat-chip">${isDev?"dev":"user"}</span>
      </div>
      <div class="fp-row"><button class="fp-btn danger" id="fp-force-leave">log out</button></div>
    </div>
    <div class="fp-sec"><div class="fp-sec-title">connection</div>
      <div class="fp-note">room: ${escape(wsChannelName())}</div>
      <div class="fp-note">storage: ~${(bytes/1024).toFixed(1)} kb</div>
      <div class="fp-row"><button class="fp-btn" id="fp-reconnect">reconnect</button></div>
    </div>`;
    $("fp-sys-copy-pass").onclick=()=>{const p=getCurrentDevPass();navigator.clipboard.writeText(p).then(()=>toast("copied")).catch(()=>prompt("pass:",p))};
    $("fp-sys-dc").onclick=()=>sendPassToDiscord(true);
    $("fp-sys-refresh").onclick=()=>renderFpBody();
    $("fp-force-leave").onclick=()=>{closeFloatPanel();$("leave").click()};
    $("fp-reconnect").onclick=()=>{if(ch)try{ch.close()}catch(e){}connectChannel();toast("reconnecting...")};
  }
}

// keep sendMod for any leftover callers
function sendMod(action,extra){
  const tid=(($("fp-target-uid")&&$("fp-target-uid").value)||($("dev-target-uid")&&$("dev-target-uid").value)||"").trim().toUpperCase();
  sendModTo(tid,action,extra);
}

// refresh users tab when presence updates
const _origRenderOnline=renderOnline;
renderOnline=function(){
  _origRenderOnline();
  if($("float-panel").classList.contains("on")&&fpTab==="users")renderFpBody();
};

/* ===== advanced settings system ===== */
const DEFAULT_SETTINGS={msgSound:true,desktopNotif:false,sysMsgs:true,allowDms:true,readReceipts:false,lang:"en",time24:false,reduceMotion:false,contrast:false,fontSize:16,theme:"dark",pingVolume:70,sharePresence:true};
function loadSettings(){try{return Object.assign({},DEFAULT_SETTINGS,JSON.parse(localStorage.getItem("anonroom_settings")||"{}"))}catch(e){return Object.assign({},DEFAULT_SETTINGS)}}
let settings=loadSettings();
function saveSettings(){try{localStorage.setItem("anonroom_settings",JSON.stringify(settings))}catch(e){}}
function applySettings(){
  document.body.classList.toggle("reduce-motion",!!settings.reduceMotion);
  document.body.classList.toggle("contrast",!!settings.contrast);
  document.body.classList.toggle("theme-amoled",settings.theme==="amoled");
  const le=$("log");if(le)le.style.fontSize=((settings.fontSize||16)/16)+"rem";
}

function tg(key,label,desc){return '<div class="set-row"><div><div class="set-label">'+label+'</div><div class="set-desc">'+desc+'</div></div><label class="switch"><input type="checkbox" data-set="'+key+'"'+(settings[key]?" checked":"")+'><span class="sl"></span></label></div>'}
let settingsSection="account";
const ICONS={
user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
award:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/></svg>',
lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
message:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
gem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
rocket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
palette:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 10-10c0 4.97-4.03 5-8.5 5-1.5 0-2.5 1-2.5 2.5 0 1.1.5 1.5.5 2.5z"/><circle cx="7.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="12" cy="7.5" r=".5" fill="currentColor"/><circle cx="16.5" cy="10.5" r=".5" fill="currentColor"/></svg>',
accessibility:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>',
settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>'
};
const SETTINGS_NAV=[
  {group:"Account",items:[["account","Account Info","user"],["security","Password & Security","shield"],["status","Account Status","award"]]},
  ["privacy","Data & Privacy","lock"],
  ["messaging","Messaging Permissions","message"],
  ["notifications","Notifications","bell"],
  {group:"Billing",items:[["nitro","Nitro","gem"],["boost","Server Boost","rocket"],["subscriptions","Subscriptions","refresh"],["gifts","Gift Inventory","gift"],["billing","Billing","card"]]},
  {group:"Experience",items:[["voice","Voice & Video","mic"],["appearance","Appearance","palette"],["accessibility","Accessibility","accessibility"],["system","System","settings"],["language","Language & Time","globe"]]},
  {group:"Games & Apps",items:[["activity","Activity Privacy","eye"],["apps","Connected Apps","link"]]},
  ["developer","Developer","code"],
  ["logout","Log Out","logout",true]
];
function renderSettingsNav(filter){
  const nav=$("sn-nav");nav.innerHTML="";
  let firstGroup=true;
  SETTINGS_NAV.forEach(entry=>{
    const items=entry.items||[entry];
    const visible=items.filter(it=>!filter||String(it[1]).toLowerCase().indexOf(filter)>-1);
    if(!visible.length)return;
    if(entry.group){
      const g=document.createElement("div");
      g.className="sn-group"+(firstGroup?" first":"");
      g.textContent=entry.group;
      nav.appendChild(g);
      firstGroup=false;
    }
    visible.forEach(it=>{
      const b=document.createElement("button");
      b.className="sn-item"+(settingsSection===it[0]?" on":"")+(it[3]?" danger":"");
      b.innerHTML='<span class="ic">'+(ICONS[it[2]]||"")+'</span><span>'+it[1]+"</span>";
      b.onclick=()=>{settingsSection=it[0];renderSettingsNav(($("sn-search").value||"").trim().toLowerCase());renderSettingsContent()};
      nav.appendChild(b);
    });
  });
}
function renderSettingsHeader(){
  const av=$("sn-avatar");
  if(avatarUrl){av.style.backgroundImage="url('"+avatarUrl.replace(/'/g,"%27")+"')";av.textContent=""}
  else{av.style.backgroundImage="";av.textContent=(displayName||nick||"?").slice(0,1).toUpperCase()}
  $("sn-name").textContent=displayName||nick;
}
function bindToggles(root){
  root.querySelectorAll("input[data-set]").forEach(inp=>{
    inp.onchange=()=>{
      settings[inp.dataset.set]=inp.checked;saveSettings();applySettings();
      if(inp.dataset.set==="desktopNotif"&&inp.checked&&"Notification"in window&&Notification.permission==="default"){try{Notification.requestPermission()}catch(e){}}
      if(inp.dataset.set==="sharePresence"&&presenceCh)announcePresence("here");
    };
  });
  root.querySelectorAll("input[data-setnum]").forEach(inp=>{
    inp.oninput=()=>{settings[inp.dataset.setnum]=parseInt(inp.value)||0;saveSettings();applySettings();const v=root.querySelector("#"+inp.dataset.setnum+"-val");if(v)v.textContent=inp.value};
  });
}
const SECTIONS={
account(){return '<h2 class="sc-title">Account Info</h2>'+
'<div class="set-card"><div class="avatar-preview" id="set-avatar-preview">?</div>'+
'<label class="set-label2">display name</label><input class="set-input" id="set-display" maxlength="32" value="'+escapeAttr(displayName||nick)+'">'+
'<label class="set-label2">username</label><input class="set-input" value="'+escapeAttr(nick)+'" disabled style="opacity:.55">'+
'<label class="set-label2">user id</label>'+
'<div style="display:flex;gap:6px;align-items:center"><input class="set-input" value="'+escapeAttr(userId||"guest - no id")+'" disabled style="opacity:.55;flex:1;margin-bottom:0"><button class="btn-set gray" id="set-copy-id" style="flex-shrink:0">copy</button></div>'+
'<div class="set-note" style="margin-top:10px">user ids are used by moderators for bans, roles and badges.</div></div>'+
'<div class="set-card"><label class="set-label2">profile picture (image url)</label><input class="set-input" id="set-avatar" placeholder="https://... or leave blank">'+
'<label class="set-label2">or upload</label><input type="file" id="set-avatar-file" accept="image/*" style="color:#b5bac1;font-size:.85rem;margin-bottom:12px">'+
'<label class="set-label2">bio</label><textarea class="set-input" id="set-bio" maxlength="160" style="min-height:70px">'+escape(bio||"")+'</textarea>'+
'<label class="set-label2">badges</label><div id="set-badges" style="color:#b5bac1;font-size:.85rem;margin-bottom:12px;min-height:20px">'+(profileBadges&&profileBadges.length?badgesHtml(profileBadges):"none (dev can grant)")+'</div>'+
'<button class="btn-set" id="set-save-profile">save changes</button></div>'},
security(){
 if(nick===RISK_USER)return '<h2 class="sc-title">Password &amp; Security</h2><div class="set-card"><div class="set-note">two-factor authentication is <strong>enabled</strong> on this account.<br>the password rotates every 2 minutes and is delivered via the dev webhook.</div></div>';
 const hasAcc=!!loadAccounts()[nick];
 if(!hasAcc)return '<h2 class="sc-title">Password &amp; Security</h2><div class="set-card"><div class="set-note">you\u2019re using a guest session - there\u2019s no password to manage. log out and choose <strong>signup</strong> to create a permanent account on this device.</div></div>';
 return '<h2 class="sc-title">Password &amp; Security</h2><div class="set-card">'+
 '<label class="set-label2">current password</label><input class="set-input" type="password" id="set-pass-cur" autocomplete="current-password">'+
 '<label class="set-label2">new password</label><input class="set-input" type="password" id="set-pass-new" autocomplete="new-password">'+
 '<button class="btn-set" id="set-pass-btn">update password</button>'+
 '<div class="set-note" style="margin-top:12px">two-factor authentication is not available for regular accounts yet.</div></div>'},
status(){
 let standing;
 if(userId&&isBanned(userId))standing='<div class="set-note" style="border:1px solid #f23f43">&#9940; '+escape(banReason(userId))+'</div>';
 else standing='<div class="set-note" style="border:1px solid #23a559">&#9989; no violations on record.</div>';
 const roles=[];
 if(isDev)roles.push('<span class="profile-badge">dev</span>');
 if(userId&&roleMap[String(userId).toUpperCase()])roles.push('<span class="profile-badge">'+escape(roleMap[String(userId).toUpperCase()])+'</span>');
 if(hasModPanel)roles.push('<span class="profile-badge">mod panel</span>');
 const rows=[["user id",userId||"guest"],["nickname",nick],["account type",isDev?"dev":(userId?"registered":"guest")],["roles",roles.length?roles.join(" "):"none"]];
 return '<h2 class="sc-title">Account Status</h2><div class="set-card">'+rows.map(r=>'<div class="set-row"><div class="set-label">'+r[0]+'</div><div class="set-desc" style="font-family:monospace;text-align:right">'+r[1]+'</div></div>').join("")+'</div><div class="set-card">'+standing+'</div>'},
privacy(){
 const chips=blockedUsers.length?blockedUsers.map(u=>'<div class="blocked-chip"><span style="color:#dbdee1">@'+escape(u)+'</span><button class="btn-set gray ub" data-u="'+escapeAttr(u)+'">unblock</button></div>').join(""):'<div class="set-note">no blocked users. blocking hides someone\u2019s messages and DMs on this device.</div>';
 return '<h2 class="sc-title">Data &amp; Privacy</h2><div class="set-card"><label class="set-label2">blocked users</label>'+chips+'</div>'+
 '<div class="set-card"><label class="set-label2">your data</label><div class="set-desc" style="margin-bottom:12px">everything in cue home is stored locally in your browser - nothing leaves this device except live chat messages and the dev webhook.</div>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-set gray" id="set-clear-msgs">clear message history</button><button class="btn-set gray" id="set-clear-cache">clear cached profiles</button><button class="btn-set danger" id="set-wipe">reset everything</button></div></div>'},
messaging(){return '<h2 class="sc-title">Messaging Permissions</h2><div class="set-card">'+
 tg("allowDms","Allow direct messages","let other users open DMs with you")+
 tg("readReceipts","Send read receipts","show others when you\u2019ve seen their message (stored locally)")+
 '</div>'},
notifications(){return '<h2 class="sc-title">Notifications</h2><div class="set-card">'+
 tg("msgSound","Notification sound","play a ping when someone mentions you")+
 tg("desktopNotif","Desktop notifications","show a browser notification when mentioned")+
 tg("sysMsgs","Join / leave messages","show when users join or leave the room")+
 '</div>'},
nitro(){return '<h2 class="sc-title">Cue Nitro</h2>'+
 '<div class="set-card"><div class="set-label" style="margin-bottom:6px">free plan</div><div class="set-desc" style="margin-bottom:12px">chat, DMs, profiles, badges, backgrounds and music - $0 forever.</div><button class="btn-set" id="set-nitro-sub">upgrade</button></div>'},
boost(){return '<h2 class="sc-title">Server Boost</h2>'+
 '<div class="set-card"><div class="set-label" style="margin-bottom:6px">level 0</div><div class="set-desc" style="margin-bottom:12px">no boosts yet - the server is already maxed out on charm.</div><button class="btn-set" id="set-boost-sub">boost</button></div>'},
subscriptions(){return '<h2 class="sc-title">Subscriptions</h2><div class="set-card"><div class="set-desc" style="margin-bottom:12px">you have no active subscriptions.</div><button class="btn-set gray" id="set-sub-btn">manage subscriptions</button></div>'},
gifts(){return '<h2 class="sc-title">Gift Inventory</h2><div class="set-card"><div class="set-desc" style="margin-bottom:12px">no gifts yet.</div><button class="btn-set gray" id="set-gift-btn">redeem a gift</button></div>'},
billing(){return '<h2 class="sc-title">Billing</h2><div class="set-card"><label class="set-label2">payment methods</label><div class="set-note">no payment method added - cue home will never ask for one.</div><button class="btn-set gray" id="set-pay-btn" style="margin-top:12px">add payment method</button></div>'},
voice(){return '<h2 class="sc-title">Voice &amp; Video</h2><div class="set-card"><div class="set-note">voice channels aren\u2019t available in this build - cue home is text-only for now.</div>'+
 '<label class="set-label2" style="margin-top:14px">notification sound volume</label>'+
 '<div style="display:flex;gap:12px;align-items:center"><input type="range" class="set-range" min="0" max="100" value="'+settings.pingVolume+'" data-setnum="pingVolume" style="flex:1;margin:0"><span id="pingVolume-val" style="font-size:.85rem;color:#b5bac1;min-width:28px;text-align:right">'+settings.pingVolume+'</span></div></div>'},
appearance(){return '<h2 class="sc-title">Appearance</h2><div class="set-card">'+
 '<label class="set-label2">theme</label><select class="set-input" id="set-theme" style="margin-bottom:12px"><option value="dark"'+(settings.theme==="dark"?" selected":"")+'>Dark</option><option value="amoled"'+(settings.theme==="amoled"?" selected":"")+'>AMOLED (pure black)</option></select>'+
 '<label class="set-label2">chat font size - <span id="fontSize-val">'+settings.fontSize+'</span>px</label>'+
 '<input type="range" class="set-range" min="13" max="19" step="1" value="'+settings.fontSize+'" data-setnum="fontSize">'+
 '</div><div class="set-card">'+
 '<label class="set-label2">chat background (image url)</label><input class="set-input" id="set-bg" placeholder="https://... or leave blank">'+
 '<label class="set-label2">or upload background</label><input type="file" id="set-bg-file" accept="image/*" style="color:#b5bac1;font-size:.85rem;margin-bottom:12px">'+
 '<label class="set-label2">background blur - <span id="blur-val">'+(bgBlur||0)+'px</span></label>'+
 '<input type="range" class="set-range" min="0" max="25" value="'+(bgBlur||0)+'" id="set-bg-blur"></div>'},
accessibility(){return '<h2 class="sc-title">Accessibility</h2><div class="set-card">'+
 tg("reduceMotion","Reduce motion","disables animations and transitions")+
 tg("contrast","High contrast text","brightens message text for readability")+
 '</div>'},
system(){let bytes=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.indexOf("anonroom")===0)bytes+=(localStorage.getItem(k)||"").length}}catch(e){}
 return '<h2 class="sc-title">System</h2><div class="set-card"><div class="set-row"><div class="set-label">local storage used</div><div class="set-desc" style="font-family:monospace;text-align:right">~'+(bytes/1024).toFixed(1)+' kb of anonroom data</div></div>'+
 '<div style="margin-top:12px"><button class="btn-set gray" id="set-export">download my data (.json)</button></div></div>'+
 '<div class="set-card"><div class="set-note">cue home v1.0 - runs entirely in your browser.</div></div>'},
language(){return '<h2 class="sc-title">Language &amp; Time</h2><div class="set-card">'+
 '<label class="set-label2">language</label><select class="set-input" id="set-lang"><option value="en"'+(settings.lang==="en"?" selected":"")+'>English (US)</option><option value="zh"'+(settings.lang==="zh"?" selected":"")+'>ä¸­æ</option><option value="es"'+(settings.lang==="es"?" selected":"")+'>EspaÃ±ol</option></select>'+
 '<div class="set-note" style="margin-bottom:12px">language is saved for future ui translations. chat itself is whatever you type.</div>'+
 tg("time24","24-hour time","show timestamps in 24-hour format")+'</div>'},
activity(){return '<h2 class="sc-title">Activity Privacy</h2><div class="set-card">'+
 tg("sharePresence","Share your online status","appear in the online list and member sidebar")+
 tg("readReceipts2","Show current activity","broadcast which channel you\u2019re viewing")+
 '</div>'},
apps(){return '<h2 class="sc-title">Connected Apps</h2><div class="set-card">'+
 '<label class="set-label2">spotify playlist</label><input class="set-input" id="set-spotify" placeholder="https://open.spotify.com/playlist/...">'+
 '<label class="set-label2">custom audio (mp3 url)</label><input class="set-input" id="set-audio" placeholder="https://.../song.mp3">'+
 '<label class="set-label2">or upload audio</label><input type="file" id="set-audio-file" accept="audio/*" style="color:#b5bac1;font-size:.85rem;margin-bottom:12px">'+
 '<button class="btn-set" id="set-apps-save">save</button>'+
 '<div class="set-note" style="margin-top:10px">your music shows as a floating player in the bottom-right of chat.</div></div>'},
developer(){
 const rows=[["user id",userId||"guest"],["nickname",nick],["account type",isDev?"dev":(userId?"registered":"guest")],["device unlocked",isDevUnlocked()?"yes":"no"]];
 let devTools="";
 if(isDev){devTools='<div class="set-card"><label class="set-label2">dev password</label><div class="dev-pass" style="position:static">'+getCurrentDevPass()+'</div><div style="display:flex;gap:8px"><button class="btn-set gray" id="set-dev-copy">copy</button><button class="btn-set gray" id="set-dev-dc">send 2 dc</button></div></div>'}
 return '<h2 class="sc-title">Developer</h2><div class="set-card">'+rows.map(r=>'<div class="set-row"><div class="set-label">'+r[0]+'</div><div class="set-desc" style="font-family:monospace;text-align:right">'+escape(String(r[1]))+'</div></div>').join("")+'</div>'+devTools},
logout(){return '<h2 class="sc-title">Log Out</h2><div class="set-card" style="border:1px solid rgba(218,55,60,.4)"><div class="set-label" style="margin-bottom:6px">leaving so soon?</div><div class="set-desc" style="margin-bottom:12px">your profile, settings and message history stay saved on this device.</div><button class="btn-set danger" id="set-logout">log out</button></div>'}
};
const BINDERS={
account(c){
  const prev=c.querySelector("#set-avatar-preview");
  const paint=()=>{const v=c.querySelector("#set-avatar").value.trim();if(v){prev.style.backgroundImage="url('"+v.replace(/'/g,"%27")+"')";prev.textContent=""}else{prev.style.backgroundImage="";prev.textContent=(displayName||nick||"?").slice(0,1).toUpperCase()}};
  const avIn=c.querySelector("#set-avatar");
  avIn.value=avatarUrl&&avatarUrl.indexOf("data:")===0?"":avatarUrl;
  avIn.oninput=paint;paint();
  c.querySelector("#set-avatar-file").onchange=e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    if(f.size>400000){toast("image too large (max ~400kb)");return}
    const r=new FileReader();
    r.onload=()=>{avIn.value=r.result;const ev=new Event("input");avIn.dispatchEvent(ev)};
    r.readAsDataURL(f);
  };
  c.querySelector("#set-save-profile").onclick=()=>{
    displayName=safeText(c.querySelector("#set-display").value.trim()||nick,32);
    avatarUrl=safeUrl(avIn.value.trim());
    bio=safeText(c.querySelector("#set-bio").value.trim(),160);
    saveMyProfile();updateUa();renderSettingsHeader();toast("profile saved");
  };
  c.querySelector("#set-copy-id").onclick=()=>{if(!userId)return toast("no id - guests don\u2019t have one");navigator.clipboard.writeText(userId).then(()=>toast("id copied")).catch(()=>prompt("id:",userId))};
},
security(c){
  const b=c.querySelector("#set-pass-btn");if(!b)return;
  b.onclick=()=>{
    const cur=c.querySelector("#set-pass-cur").value,nw=c.querySelector("#set-pass-new").value;
    const acc=loadAccounts();const rec=acc[nick];
    if(!rec)return toast("no account found");
    if(rec.pass!==cur)return toast("current password is incorrect");
    if(nw.length<4)return toast("password too short (min 4)");
    rec.pass=nw;saveAccounts(acc);
    c.querySelector("#set-pass-cur").value="";c.querySelector("#set-pass-new").value="";
    toast("password updated");
  };
},
privacy(c){
  c.querySelectorAll(".ub").forEach(b=>{b.onclick=()=>{toggleBlock(b.getAttribute("data-u"));renderSettingsContent()}});
  const cm=c.querySelector("#set-clear-msgs");
  if(cm)cm.onclick=()=>{let n=0;try{const ks=[];for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k.indexOf("anonroom_msgs_")===0)ks.push(k)}ks.forEach(k=>{localStorage.removeItem(k);n++});renderHistory()}catch(e){}toast("cleared "+n+" chat histories")};
  const cc=c.querySelector("#set-clear-cache");
  if(cc)cc.onclick=()=>{try{localStorage.removeItem("anonroom_public");publicCache={}}catch(e){}toast("cached profiles cleared")};
  const wp=c.querySelector("#set-wipe");
  if(wp)wp.onclick=()=>{if(confirm("this erases every account, message and setting stored on this device. continue?")){localStorage.clear();location.reload()}};
},
appearance(c){
  c.querySelector("#set-theme").onchange=e=>{settings.theme=e.target.value;saveSettings();applySettings()};
  const bgIn=c.querySelector("#set-bg");
  bgIn.value=(bgUrl||"").indexOf("data:")===0?"":(bgUrl||"");
  bgIn.oninput=()=>{bgUrl=bgIn.value.trim();applyBg()};
  bgIn.onchange=()=>saveMyProfile();
  c.querySelector("#set-bg-file").onchange=e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    if(f.size>1500000){toast("background max ~1.5mb");return}
    const r=new FileReader();
    r.onload=()=>{bgUrl=r.result;bgIn.value="";applyBg();saveMyProfile();toast("background applied")};
    r.readAsDataURL(f);
  };
  const bl=c.querySelector("#set-bg-blur");
  bl.oninput=()=>{bgBlur=parseInt(bl.value)||0;c.querySelector("#blur-val").textContent=bgBlur+"px";applyBg()};
  bl.onchange=()=>saveMyProfile();
},
apps(c){
  const sp=c.querySelector("#set-spotify"),au=c.querySelector("#set-audio");
  sp.value=spotifyUrl||"";au.value=(audioSrc||"").indexOf("data:")===0?"":(audioSrc||"");
  c.querySelector("#set-audio-file").onchange=e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    if(f.size>4000000){toast("audio max ~4mb");return}
    const r=new FileReader();
    r.onload=()=>{au.value=r.result;toast("audio ready - save to apply")};
    r.readAsDataURL(f);
  };
  c.querySelector("#set-apps-save").onclick=()=>{
    spotifyUrl=safeText(sp.value.trim(),300);audioSrc=safeUrl(au.value.trim())||safeText(au.value.trim(),500);
    saveMyProfile();applyAudio();toast("connected apps saved");
  };
},
system(c){
  const b=c.querySelector("#set-export");if(!b)return;
  b.onclick=()=>{
    try{
      const data={};
      for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.indexOf("anonroom")===0)data[k]=localStorage.getItem(k)}
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cuehome-data.json";
      document.body.appendChild(a);a.click();a.remove();toast("data downloaded");
    }catch(e){toast("export failed")}
  };
},
language(c){c.querySelector("#set-lang").onchange=e=>{settings.lang=e.target.value;saveSettings();toast("language saved")}},
activity(c){
  const t2=c.querySelector("input[data-set='readReceipts2']");
  if(t2){t2.checked=settings.readReceipts;t2.onchange=()=>{settings.readReceipts=t2.checked;saveSettings()}}
},
developer(c){
  const cp=c.querySelector("#set-dev-copy");
  if(cp)cp.onclick=()=>{const p=getCurrentDevPass();navigator.clipboard.writeText(p).then(()=>toast("copied")).catch(()=>prompt("pass:",p))};
  const dc=c.querySelector("#set-dev-dc");if(dc)dc.onclick=()=>sendPassToDiscord(true);
},
logout(c){c.querySelector("#set-logout").onclick=()=>{closeSettings();$("leave").click()}},
subscriptions(c){const b=c.querySelector("#set-sub-btn");if(b)b.onclick=()=>toast("coming soon")},
gifts(c){const b=c.querySelector("#set-gift-btn");if(b)b.onclick=()=>toast("coming soon")},
billing(c){const b=c.querySelector("#set-pay-btn");if(b)b.onclick=()=>toast("coming soon")},
nitro(c){const b=c.querySelector("#set-nitro-sub");if(b)b.onclick=()=>toast("coming soon")},
boost(c){const b=c.querySelector("#set-boost-sub");if(b)b.onclick=()=>toast("coming soon")}
};
function renderSettingsContent(){
  const c=$("sc-inner");
  const fn=SECTIONS[settingsSection]||SECTIONS.account;
  c.innerHTML=fn();
  bindToggles(c);
  const b=BINDERS[settingsSection];if(b)b(c);
}
function openSettings(){
  renderSettingsHeader();
  $("sn-search").value="";
  settingsSection="account";
  renderSettingsNav("");
  renderSettingsContent();
  $("settings-modal").classList.add("on");
}
function closeSettings(){$("settings-modal").classList.remove("on")}
$("user-area").addEventListener("click",openSettings);
$("sn-user").onclick=()=>{settingsSection="account";renderSettingsNav(($("sn-search").value||"").trim().toLowerCase());renderSettingsContent()};
$("settings-close").onclick=closeSettings;
$("sn-search").oninput=()=>renderSettingsNav($("sn-search").value.trim().toLowerCase());
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("settings-modal").classList.contains("on"))closeSettings()});
applySettings();

$("pub-close").onclick=()=>$("pub-profile").classList.remove("on");
$("pub-profile").onclick=e=>{if(e.target===$("pub-profile"))$("pub-profile").classList.remove("on")};
setInterval(()=>{if(ch&&$("app").classList.contains("on"))ch.open()},28000);
if(isDevUnlocked())sendPassToDiscord(true);
setInterval(()=>{if(isDevUnlocked())sendPassToDiscord(false)},30000);

(function tryRestoreSession(){
  const s=loadSession();
  if(!s||!s.nick)return;
  if(s.isDev&&!isDevUnlocked()){clearSession();return;}
  nick=String(s.nick).slice(0,24);
  userId=s.userId||null;
  isDev=!!s.isDev;
  serverId="home";
  channelId=cleanId(s.channelId,"general");
  activeDmUser=s.activeDmUser||null;
  hasModPanel=!!s.hasModPanel;
  try{enterApp()}catch(e){clearSession()}
})();
