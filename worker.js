/* RYNEX INDIA Telegram + Admin API Worker
 * Required bindings/secrets are documented in INTEGRATION_SETUP.md.
 * Keep this exact requested line unchanged.
 */
const ADMIN_ID = "plz join teligram";
const DEFAULT_PRICES = {
  android_doc: [
    { name: "1 Day", price: 10, days: 1 },
    { name: "10 Days", price: 21, days: 10 },
    { name: "1 Month", price: 49, days: 30 },
    { name: "Lifetime", price: 299, days: 36500 }
  ],
  ios_base: [
    { name: "1 Day", price: 20, days: 1 },
    { name: "10 Days", price: 99, days: 10 },
    { name: "1 Month", price: 299, days: 30 },
    { name: "Lifetime", price: 599, days: 36500 }
  ]
};
const DEFAULT_BOT = {
  displayName: "RYNEX INDIA",
  welcomeMessage: "👑 <b>RYNEX INDIA</b>\n━━━━━━━━━━━━━━━━━━\n🔥 PREMIUM PANELS. BEST PRICES.\n\nChoose your panel below.",
  paymentMessage: "Please pay using the QR below, then send your payment reference/name and payment screenshot here. Your order will remain pending until manually verified.",
  approvedMessage: "✅ Your payment has been verified. Your order is approved. Your files are below.",
  rejectedMessage: "❌ Your payment could not be verified. Please contact support.",
  supportMessage: "💬 Contact RYNEX INDIA support for help."
};
const corsHeaders = (origin, env) => {
  const allowed = (env.ADMIN_ORIGIN || "").split(",").map(x => x.trim().replace(/\/+$/, "")).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Credentials": "true", "Vary": "Origin" };
};
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
const text = (s, status = 200) => new Response(s, { status });
const enc = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const toFs = v => {
  if (v === null) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  const fields = {}; for (const [k,val] of Object.entries(v)) fields[k] = toFs(val);
  return { mapValue: { fields } };
};
const fromFs = f => {
  if (!f) return null;
  if ("stringValue" in f) return f.stringValue;
  if ("integerValue" in f) return Number(f.integerValue);
  if ("doubleValue" in f) return f.doubleValue;
  if ("booleanValue" in f) return f.booleanValue;
  if ("nullValue" in f) return null;
  if ("arrayValue" in f) return (f.arrayValue.values || []).map(fromFs);
  if ("mapValue" in f) return fromFields(f.mapValue.fields || {});
  return null;
};
const fromFields = fields => Object.fromEntries(Object.entries(fields || {}).map(([k,v]) => [k,fromFs(v)]));

let tokenCache = { token: "", exp: 0 };
async function serviceToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.exp) return tokenCache.token;
  const key = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT || "{}");
  if (!key.client_email || !key.private_key) throw new Error("FIREBASE_SERVICE_ACCOUNT secret is missing or invalid");
  const now = Math.floor(Date.now()/1000);
  const header = enc(JSON.stringify({ alg:"RS256", typ:"JWT" }));
  const claim = enc(JSON.stringify({ iss:key.client_email, sub:key.client_email, aud:"https://oauth2.googleapis.com/token", iat:now, exp:now+3600, scope:"https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/devstorage.read_write" }));
  const unsigned = `${header}.${claim}`;
  const pem = key.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", der, { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}`;
  const r = await fetch("https://oauth2.googleapis.com/token", { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({ grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error_description || "Google service authentication failed"); tokenCache = { token: j.access_token, exp: Date.now() + 50 * 60 * 1000 }; return j.access_token;
}
async function fs(env, path, options = {}) {
  const token = await serviceToken(env);
  const base = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const r = await fetch(`${base}/${path}`, { ...options, headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json", ...(options.headers||{}) } });
  if (r.status === 404) return null;
  const body = await r.json().catch(()=>({})); if (!r.ok) throw new Error(body.error?.message || `Firestore error ${r.status}`); return body;
}
async function getDoc(env, path) { const d = await fs(env,path); return d ? { id:d.name.split("/").pop(), ...fromFields(d.fields) } : null; }
async function putDoc(env, path, data) { return fs(env,path,{method:"PATCH",body:JSON.stringify({fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,toFs(v)]))})}); }
async function deleteDoc(env,path) { return fs(env,path,{method:"DELETE"}); }
async function listDocs(env, collection) {
  const d = await fs(env,`${collection}?pageSize=300`); return (d?.documents||[]).map(x=>({id:x.name.split("/").pop(),...fromFields(x.fields)}));
}
async function firebaseLogin(env,email,password) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_WEB_API_KEY}`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,returnSecureToken:true})});
  const j=await r.json(); if(!r.ok) throw new Error(j.error?.message || "Invalid login");
  const check=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_WEB_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:j.idToken})});
  const u=await check.json(); const uid=u.users?.[0]?.localId;
  if(!uid || uid!==env.ADMIN_UID) throw new Error("This Firebase account is not authorized as the RYNEX admin");
  return {token:j.idToken,user:{email:j.email,uid}};
}
async function requireAdmin(request,env) {
  const token=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,""); if(!token) return null;
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_WEB_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:token})});
  const j=await r.json().catch(()=>({})); const u=j.users?.[0]; return u?.localId===env.ADMIN_UID ? u : null;
}
async function tg(env,method,payload) {
  const r=await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const j=await r.json(); if(!j.ok) throw new Error(j.description||"Telegram API error"); return j.result;
}
const btn=(text,callback_data)=>({text,callback_data});
const MAX_UPLOAD = 45 * 1024 * 1024; // Telegram bots can upload at most 50 MB
const validPrices = p => p && typeof p === "object" && ["android_doc","ios_base"].every(g => Array.isArray(p[g]) && p[g].every(r => r && typeof r.name === "string" && r.name.trim() && Number(r.price) > 0 && Number.isInteger(Number(r.days)) && Number(r.days) >= 1));
async function config(env) {
  const d=await getDoc(env,"system/config"); return { prices:d?.prices || DEFAULT_PRICES, bot:{...DEFAULT_BOT,...(d?.bot||{})}, qr:d?.qr||null, upiId:d?.upiId||env.UPI_ID||"", supportUrl:d?.supportUrl||env.SUPPORT_URL||"" };
}
async function sendHome(env,chatId) {
  const c=await config(env);
  return tg(env,"sendMessage",{chat_id:chatId,text:c.bot.welcomeMessage,parse_mode:"HTML",reply_markup:{inline_keyboard:[[btn("🛒 EXPLORE PANELS","products")],[btn("🎮 GAMEPLAY DEMO","demo"),btn("📘 SETUP GUIDE","guide")],[btn("💬 SUPPORT","support")]]},disable_web_page_preview:true});
}
async function createOrder(env, chatId, user, platform, index) {
  const c=await config(env); const group=platform==="android"?"android_doc":"ios_base"; const plan=c.prices[group]?.[index]; if(!plan) return tg(env,"sendMessage",{chat_id:chatId,text:"This plan is not available. Please open /start again."});
  const id=crypto.randomUUID().slice(0,12).toUpperCase(); const now=new Date().toISOString();
  const order={id,telegramId:String(user.id),customerName:[user.first_name,user.last_name].filter(Boolean).join(" "),username:user.username||"",platform,plan:plan.name,amount:Number(plan.price),days:Number(plan.days),status:"awaiting_payment",createdAt:now};
  await putDoc(env,`orders/${id}`,order);
  await putDoc(env,`sessions/${chatId}`,{step:"payment",orderId:id,updatedAt:now});
  await tg(env,"sendMessage",{chat_id:chatId,text:`🧾 <b>ORDER SUMMARY</b>\n\nProduct: <b>${platform==="android"?"Android DOC Panel":"iOS BASE Panel"}</b>\nPlan: <b>${plan.name}</b>\nAmount: <b>₹${plan.price}</b>\nOrder ID: <code>${id}</code>\n\n${c.bot.paymentMessage}\n\nSend your payment reference/name, then upload the payment screenshot.`,parse_mode:"HTML"});
  if(c.qr?.key && env.MEDIA_BUCKET) {
    const obj=await env.MEDIA_BUCKET.get(c.qr.key); if(obj) await tg(env,"sendPhoto",{chat_id:chatId,photo:`${env.R2_PUBLIC_BASE_URL}/${c.qr.key}`,caption:"RYNEX INDIA Payment QR"});
  }
}
async function telegramUpdate(update,env) {
  if(update.callback_query) {
    const q=update.callback_query; await tg(env,"answerCallbackQuery",{callback_query_id:q.id}); const chatId=q.message.chat.id; const action=q.data;
    if(action==="home") return sendHome(env,chatId);
    if(action==="products") return tg(env,"sendMessage",{chat_id:chatId,text:"🛍️ <b>CHOOSE YOUR PANEL</b>",parse_mode:"HTML",reply_markup:{inline_keyboard:[[btn("🤖 ANDROID DOC PANEL","android")],[btn("🍎 iOS BASE PANEL","ios")],[btn("🏠 MAIN MENU","home")]]}});
    if(action==="android"||action==="ios") { const c=await config(env), key=action==="android"?"android_doc":"ios_base", plans=c.prices[key]||[]; return tg(env,"sendMessage",{chat_id:chatId,text:`<b>${action.toUpperCase()} PLANS</b>\nChoose your plan:`,parse_mode:"HTML",reply_markup:{inline_keyboard:[...plans.map((p,i)=>[btn(`${p.name} • ₹${p.price}`,`buy_${action}_${i}`)]),[btn("⬅️ BACK","products")]]}}); }
    if(action.startsWith("buy_")) { const [,platform,index]=action.split("_"); return createOrder(env,chatId,q.from,platform,Number(index)); }
    if(action==="demo"||action==="guide") { const cat=action==="demo"?"demo_video":"setup_video"; const media=await listDocs(env,"media"); const items=media.filter(x=>x.category===cat); if(!items.length) return tg(env,"sendMessage",{chat_id:chatId,text:action==="demo"?"Demo will be available soon.":"Setup guide will be available soon."}); for(const m of items) await sendStoredMedia(env,chatId,m); return; }
    if(action==="support") { const c=await config(env); return tg(env,"sendMessage",{chat_id:chatId,text:c.bot.supportMessage,parse_mode:"HTML",reply_markup:c.supportUrl?{inline_keyboard:[[{text:"CONTACT SUPPORT",url:c.supportUrl}]]}:undefined}); }
  }
  const m=update.message; if(!m?.chat?.id) return;
  const chatId=m.chat.id; const command=(m.text||"").trim().split(/\s+/)[0];
  if(command==="/start"||command.startsWith("/start@")) return sendHome(env,chatId);
  if(command==="/help") { const c=await config(env); return tg(env,"sendMessage",{chat_id:chatId,text:c.bot.supportMessage,parse_mode:"HTML"}); }
  const session=await getDoc(env,`sessions/${chatId}`); if(!session?.orderId) return;
  const order=await getDoc(env,`orders/${session.orderId}`); if(!order) return;
  if(session.step==="done") return tg(env,"sendMessage",{chat_id:chatId,text:"Your order is already pending manual verification. Send /start to place a new order."});
  if(m.photo) {
    const photo=m.photo[m.photo.length-1]; const file=await tg(env,"getFile",{file_id:photo.file_id});
    const fileUrl=`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${file.file_path}`;
    let screenshotUrl=fileUrl;
    if(env.MEDIA_BUCKET) {
      const imageResponse=await fetch(fileUrl);
      if(imageResponse.ok) {
        const key=`payment-screenshots/${order.id}-${Date.now()}.jpg`;
        await env.MEDIA_BUCKET.put(key,imageResponse.body,{httpMetadata:{contentType:"image/jpeg"}});
        screenshotUrl=`${env.R2_PUBLIC_BASE_URL}/${key}`;
      }
    }
    const oid=order.id; await putDoc(env,`orders/${oid}`,{...order,status:"pending",screenshotUrl,telegramFileId:photo.file_id,utr:session.utr||"",updatedAt:new Date().toISOString()});
    await putDoc(env,`sessions/${chatId}`,{step:"done",orderId:oid});
    if(env.ADMIN_CHAT_ID) await tg(env,"sendMessage",{chat_id:env.ADMIN_CHAT_ID,text:`🆕 <b>PAYMENT SCREENSHOT RECEIVED</b>\nOrder: ${oid}\nCustomer: ${order.customerName}\nTelegram ID: ${order.telegramId}\nPlan: ${order.plan}\nAmount: ₹${order.amount}\nPlease verify the actual payment in your UPI/bank app before approving.`,parse_mode:"HTML"});
    await tg(env,"sendMessage",{chat_id:chatId,text:`✅ Screenshot received. Order <b>${oid}</b> is pending manual verification.`,parse_mode:"HTML"}); return;
  }
  if(m.text) { await putDoc(env,`sessions/${chatId}`,{...session,utr:m.text.trim(),step:"payment",updatedAt:new Date().toISOString()}); return tg(env,"sendMessage",{chat_id:chatId,text:"Thanks. Now upload your payment screenshot. Your order will be checked manually."}); }
}
async function sendStoredMedia(env,chatId,m) {
  if(!m.key||!env.MEDIA_BUCKET) return;
  const obj=await env.MEDIA_BUCKET.get(m.key); if(!obj) return;
  const method=m.category==="apk"?"sendDocument":"sendVideo";
  const form=new FormData(); form.set("chat_id",String(chatId)); form.set(method==="sendDocument"?"document":"video",new File([await obj.arrayBuffer()],m.title||"file",{type:obj.httpMetadata?.contentType||"application/octet-stream"}));
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,{method:"POST",body:form});
}
async function apiRoute(request,env,url) {
  const origin=request.headers.get("Origin"); const ch=corsHeaders(origin,env);
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:ch});
  if(url.pathname==="/auth/login"&&request.method==="POST") { try { const b=await request.json(); return json(await firebaseLogin(env,b.email,b.password),200,ch); } catch(e){return json({error:e.message},401,ch);} }
  const user=await requireAdmin(request,env); if(!user) return json({error:"Unauthorized"},401,ch);
  try {
    const c=await config(env); let result;
    if(url.pathname==="/auth/me") result={email:user.email,uid:user.localId};
    else if(url.pathname==="/auth/logout") result={ok:true};
    else if(url.pathname==="/health") result={botToken:Boolean(env.BOT_TOKEN),firebase:Boolean(env.FIREBASE_SERVICE_ACCOUNT),firebaseApiKey:Boolean(env.FIREBASE_WEB_API_KEY),adminUid:Boolean(env.ADMIN_UID),adminOrigin:Boolean(env.ADMIN_ORIGIN),mediaBucket:Boolean(env.MEDIA_BUCKET),r2PublicUrl:Boolean(env.R2_PUBLIC_BASE_URL),adminChatId:Boolean(env.ADMIN_CHAT_ID)};
    else if(url.pathname==="/stats") { const orders=await listDocs(env,"orders"), customers=await listDocs(env,"customers"), now=Date.now(); result={pendingOrders:orders.filter(x=>x.status==="pending").length,approvedOrders:orders.filter(x=>x.status==="approved").length,rejectedOrders:orders.filter(x=>x.status==="rejected").length,totalCustomers:customers.length,activeSubscriptions:customers.filter(x=>!x.expiresAt ? Boolean(x.plan) : new Date(x.expiresAt).getTime()>now).length,expiringSoon:customers.filter(x=>x.expiresAt&&new Date(x.expiresAt).getTime()>now&&new Date(x.expiresAt).getTime()<now+7*86400000).length}; }
    else if(url.pathname==="/prices"&&request.method==="GET") result=c.prices;
    else if(url.pathname==="/prices"&&request.method==="PUT") { const b=await request.json(); if(!validPrices(b)) throw new Error("Invalid price data"); await putDoc(env,"system/config",{prices:b,bot:c.bot,qr:c.qr,upiId:c.upiId,supportUrl:c.supportUrl}); result={ok:true}; }
    else if(url.pathname==="/qr"&&request.method==="GET") result=c.qr?{url:`${env.R2_PUBLIC_BASE_URL}/${c.qr.key}`}:{};
    else if(url.pathname==="/qr"&&request.method==="PUT") { const f=(await request.formData()).get("file"); if(!f||!f.type.startsWith("image/")) throw new Error("A QR image is required"); if(f.size>5*1024*1024) throw new Error("QR image must be under 5 MB"); const key=`qr/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`; await env.MEDIA_BUCKET.put(key,f.stream(),{httpMetadata:{contentType:f.type}}); await putDoc(env,"system/config",{prices:c.prices,bot:c.bot,qr:{key,title:f.name},upiId:c.upiId,supportUrl:c.supportUrl}); result={url:`${env.R2_PUBLIC_BASE_URL}/${key}`}; }
    else if(url.pathname==="/media"&&request.method==="GET") { result=(await listDocs(env,"media")).filter(x=>x.category===url.searchParams.get("category")); }
    else if(url.pathname==="/media"&&request.method==="POST") { const form=await request.formData(), f=form.get("file"), category=form.get("category"); if(!f||! ["apk","setup_video","demo_video"].includes(category)) throw new Error("Invalid media upload"); if(f.size>MAX_UPLOAD) throw new Error("File must be under 45 MB (Telegram bot upload limit)"); const id=form.get("replaceId")||crypto.randomUUID(); const key=`media/${category}/${id}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`; await env.MEDIA_BUCKET.put(key,f.stream(),{httpMetadata:{contentType:f.type}}); const item={id,title:form.get("title")||f.name,category,key,size:f.size,updatedAt:new Date().toISOString()}; await putDoc(env,`media/${id}`,item); result=item; }
    else if(url.pathname.startsWith("/media/")&&request.method==="DELETE") { const id=url.pathname.split("/").pop(), item=await getDoc(env,`media/${id}`); if(item?.key) await env.MEDIA_BUCKET.delete(item.key); await deleteDoc(env,`media/${id}`); result={ok:true}; }
    else if(url.pathname==="/orders"&&request.method==="GET") result=(await listDocs(env,"orders")).filter(x=>x.status===url.searchParams.get("status"));
    else if(url.pathname.match(/^\/orders\/[^/]+\/approve$/)&&request.method==="POST") { const id=url.pathname.split("/")[2], o=await getDoc(env,`orders/${id}`); if(!o||o.status!=="pending") throw new Error("Order is not pending"); const now=new Date(), expires=new Date(now.getTime()+Math.max(1,o.days||1)*86400000).toISOString(); await putDoc(env,`orders/${id}`,{...o,status:"approved",approvedAt:now.toISOString()}); const customer={telegramId:o.telegramId,name:o.customerName,plan:o.plan,startedAt:now.toISOString(),expiresAt:(o.days>=36500?null:expires),lastOrderId:id}; await putDoc(env,`customers/${o.telegramId}`,customer); await tg(env,"sendMessage",{chat_id:o.telegramId,text:c.bot.approvedMessage,parse_mode:"HTML"}); const files=await listDocs(env,"media"); const cats=o.platform==="android"?["apk","setup_video","demo_video"]:["demo_video"]; for(const cat of cats) { const chosen=files.filter(x=>x.category===cat); for(const item of chosen) await sendStoredMedia(env,Number(o.telegramId),item); } result={ok:true}; }
    else if(url.pathname.match(/^\/orders\/[^/]+\/reject$/)&&request.method==="POST") { const id=url.pathname.split("/")[2], o=await getDoc(env,`orders/${id}`); if(!o||o.status!=="pending") throw new Error("Order is not pending"); const b=await request.json(); await putDoc(env,`orders/${id}`,{...o,status:"rejected",rejectReason:b.reason||"",rejectedAt:new Date().toISOString()}); await tg(env,"sendMessage",{chat_id:o.telegramId,text:c.bot.rejectedMessage+ (b.reason?`\nReason: ${b.reason}`:"")}); result={ok:true}; }
    else if(url.pathname==="/customers"&&request.method==="GET") result=await listDocs(env,"customers");
    else if(url.pathname==="/bot-settings"&&request.method==="GET") result=c.bot;
    else if(url.pathname==="/bot-settings"&&request.method==="PUT") { const b=await request.json(); await putDoc(env,"system/config",{prices:c.prices,bot:{...c.bot,...b},qr:c.qr,upiId:c.upiId,supportUrl:c.supportUrl}); result={ok:true}; }
    else return json({error:"Not found"},404,ch);
    return json(result,200,ch);
  } catch(e) { return json({error:e.message||"Server error"},500,ch); }
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname==="/telegram/webhook"&&request.method==="POST") { if(env.TELEGRAM_WEBHOOK_SECRET&&request.headers.get("X-Telegram-Bot-Api-Secret-Token")!==env.TELEGRAM_WEBHOOK_SECRET) return text("Forbidden",403); try { await telegramUpdate(await request.json(),env); return text("OK"); } catch(e) { return text(`Webhook error: ${e.message}`,500); } }
    if(url.pathname.startsWith("/auth/")||["/stats","/health","/prices","/qr","/media","/orders","/customers","/bot-settings"].some(p=>url.pathname===p||url.pathname.startsWith(p+"/"))) return apiRoute(request,env,url);
    if(request.method==="GET") return text("RYNEX INDIA API + TELEGRAM BOT ONLINE");
    return text("Not found",404);
  }
};
