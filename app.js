'use strict';
/* Sansão — aplicativo pessoal de treino. Todos os dados ficam no aparelho (localStorage). */

const CHAVE = 'treino.v1';
const $ = (s, el = document) => el.querySelector(s);
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmtNum = (n) => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));
const fmtTempo = (s) => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const fmtDur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`; };
const fmtData = (ts) => new Date(ts).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
const APARELHOS = { esteira: 'Esteira', eliptico: 'Elíptico' };
const minuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);

/* ---------- Estado ---------- */
function estadoInicial() {
  return { v: 1, plano: clone(PLANO), planoVersao: PLANO.versao, planoInicio: null, proximo: 0, sessoes: [], atual: null, notas: {}, timer: null, medidas: [], altura: 174 };
}
let planoAtualizado = false;
const valido = (s) => s && s.plano && Array.isArray(s.sessoes);
// o plano mudou desde a última vez: troca pelo novo e mantém histórico, anotações e cargas
function migrar(s) {
  const e = { ...estadoInicial(), ...s, planoVersao: s.planoVersao };
  if (e.planoVersao !== PLANO.versao) { if (!(e.planoVersao >= 2)) { e.proximo = 0; planoAtualizado = 'ordem'; } else planoAtualizado = 'ajuste'; e.plano = clone(PLANO); e.planoVersao = PLANO.versao; }
  return e;
}
function lerGuardado() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return valido(s) ? s : null; } catch (e) { return null; } }
function carregar() { const s = lerGuardado(); return s ? migrar(s) : estadoInicial(); }
/* Junta duas cópias dos dados sem perder treino finalizado. Vale a cópia gravada por último (rev maior), mas os treinos
   finalizados das duas são somados. Isso resolve o caso de duas janelas do Sansão abertas (o app e uma aba do Chrome,
   por exemplo): a janela velha não apaga mais o que a outra gravou. */
function mesclar(a, b) {
  if (!valido(b)) return a; if (!valido(a)) return b;
  const base = (b.rev || 0) > (a.rev || 0) ? b : a, outro = base === a ? b : a;
  const apagadas = [...new Set([...(a.apagadas || []), ...(b.apagadas || [])])];
  const porId = new Map(); [...outro.sessoes, ...base.sessoes].forEach((s) => porId.set(s.id, s));
  const sessoes = [...porId.values()].filter((s) => !apagadas.includes(s.id)).sort((x, y) => x.fim - y.fim);
  const medApag = [...new Set([...(a.medidasApagadas || []), ...(b.medidasApagadas || [])])];
  const medPorId = new Map(); [...(outro.medidas || []), ...(base.medidas || [])].forEach((x) => medPorId.set(x.id, x));
  const medidas = [...medPorId.values()].filter((x) => !medApag.includes(x.id)).sort((x, y) => x.data - y.data);
  const m = { ...base, sessoes, apagadas, medidas, medidasApagadas: medApag, notas: { ...(outro.notas || {}), ...(base.notas || {}) }, rev: Math.max(a.rev || 0, b.rev || 0) };
  const ult = sessoes[sessoes.length - 1];
  if (ult && ult.idx != null && !base.sessoes.some((s) => s.id === ult.id)) m.proximo = (ult.idx + 1) % m.plano.treinos.length;
  if (m.atual && sessoes.some((s) => s.id === m.atual.id)) m.atual = null;
  return m;
}
let S = carregar();
let revLida = S.rev || 0;
function salvar() {
  try {
    // outra janela gravou depois da última leitura: junta antes, para não gravar por cima com dados velhos
    const g = lerGuardado();
    if (g && (g.rev || 0) > revLida) { S = migrar(mesclar(S, g)); setTimeout(() => { desenhar(); aviso('Dados atualizados com os da outra janela do Sansão.'); }, 0); }
    S.rev = Math.max(S.rev || 0, g ? g.rev || 0 : 0) + 1; S.salvoEm = Date.now();
    localStorage.setItem(CHAVE, JSON.stringify(S)); revLida = S.rev;
    agendarCopia();
  } catch (e) { aviso('Não consegui salvar. Faça um backup em Treinos.'); }
}
/* Segunda cópia no IndexedDB, gravada em modo "strict" (vai para o disco na hora). O localStorage pode perder os
   últimos segundos se o Android fechar o app; ao abrir, as duas cópias são juntadas. */
let idbP = null;
const idb = () => (idbP = idbP || new Promise((ok, erro) => { const r = indexedDB.open('sansao', 1); r.onupgradeneeded = () => r.result.createObjectStore('estado'); r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); }));
async function gravarCopia() {
  try { const db = await idb(), dados = clone(S); await new Promise((ok, erro) => { const tx = db.transaction('estado', 'readwrite', { durability: 'strict' }); tx.objectStore('estado').put(dados, 'S'); tx.oncomplete = ok; tx.onerror = () => erro(tx.error); }); } catch (e) { /* segue só com o localStorage */ }
}
async function lerCopia() {
  try { const db = await idb(); return await new Promise((ok) => { const r = db.transaction('estado').objectStore('estado').get('S'); r.onsuccess = () => ok(valido(r.result) ? r.result : null); r.onerror = () => ok(null); }); } catch (e) { return null; }
}
let copiaT = 0;
function agendarCopia() { clearTimeout(copiaT); copiaT = setTimeout(gravarCopia, 400); }
// volta a ler o que está gravado (outra janela pode ter mexido) e redesenha se mudou
function recarregarSeMudou() {
  const g = lerGuardado();
  if (g && (g.rev || 0) > revLida) { S = migrar(mesclar(S, g)); revLida = S.rev || 0; desenhar(); }
}
window.addEventListener('storage', (ev) => { if (ev.key === CHAVE) recarregarSeMudou(); });
const ui = { aba: 'hoje', escolha: null, hist: null, evo: null };

/* ---------- Consultas ---------- */
const treinos = () => S.plano.treinos;
function ultima(exId) {
  for (let i = S.sessoes.length - 1; i >= 0; i--) {
    const it = S.sessoes[i].itens.find((x) => x.ex === exId && x.sets.some((s) => s.ok));
    if (it) return { quando: S.sessoes[i].fim, sets: it.sets.filter((s) => s.ok), repMax: it.repMax, series: it.series };
  }
  return null;
}
function resumoSets(sets, un) {
  if (!sets.length) return '';
  const kgs = [...new Set(sets.map((s) => s.kg).filter((k) => k !== '' && k != null))];
  const reps = sets.map((s) => s.reps).join(', ');
  if (un === 's') return `${reps} s`;
  if (!kgs.length) return `${reps} rep.`;
  if (kgs.length === 1) return `${fmtNum(num(kgs[0]))} kg × ${reps}`;
  return sets.map((s) => `${fmtNum(num(s.kg))}×${s.reps}`).join(' · ');
}
function deveSubir(e) {
  const u = ultima(e.ex);
  if (!u || e.un === 's' || u.sets.length < (u.series || e.series)) return false;
  return u.sets.every((s) => num(s.reps) >= e.repMax);
}
const alvo = (e) => `${e.series} × ${e.repMin}–${e.repMax}${e.un === 's' ? ' s' : ''}`;
function estimativa(t, curto) {
  const lista = curto ? t.exercicios.slice(0, 4) : t.exercicios;
  const tipo = fasePlano().tipo;
  const forca = lista.reduce((a, e) => a + seriesDaFase(e.series, tipo) * (e.descanso + 45), 0) / 60;
  // + 4 min de cardio leve, 1 min por série leve e ~1,5 min de troca de aparelho por exercício
  const leves = lista.reduce((a, e) => a + (e.leves || 0), 0);
  return Math.round((forca + 4 + leves + lista.length * 1.5 + cardioMin(t.cardio)) / 5) * 5;
}
const cardioMin = (c) => (c.tipo === 'intervalado' ? Math.round(((c.aquec || 0) + c.voltas * (c.forte + c.leve)) / 60) : c.min);
const cardioTexto = (c) => (c.tipo === 'intervalado'
  ? `Intervalado: ${c.aquec ? `${c.aquec / 60} min de aquecimento, depois ` : ''}${c.forte / 60} min forte e ${c.leve / 60} min leve, ${c.voltas} vezes (${cardioMin(c)} min)`
  : `${c.min} min em ritmo constante`);
function inicioSemana(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
// Fases do plano, contadas em semanas (segunda a domingo) desde o primeiro treino:
// semanas 1 e 2 = adaptação (uma série a menos); semana 6 = alívio (metade das séries); o resto = normal
function fasePlano() {
  if (!S.planoInicio) return { sem: 1, tipo: 'adaptacao' };
  const sem = Math.round((inicioSemana(Date.now()) - inicioSemana(S.planoInicio)) / (7 * 864e5)) + 1;
  return { sem, tipo: sem <= 2 ? 'adaptacao' : sem === 6 ? 'alivio' : 'normal' };
}
const seriesDaFase = (n, tipo) => (tipo === 'adaptacao' ? Math.max(2, n - 1) : tipo === 'alivio' ? Math.max(1, Math.ceil(n / 2)) : n);
function avisoFase() {
  const f = fasePlano();
  if (f.tipo === 'adaptacao') return `<b>Semana ${f.sem} de 2 de adaptação.</b> Uma série a menos em cada exercício. Nas máquinas, leve a última série até perto do limite para achar a carga certa. No stiff, na elevação pélvica e nos halteres, deixe sobrar 3 repetições.`;
  if (f.tipo === 'alivio') return '<b>Semana de alívio.</b> Metade das séries, com a mesma carga de sempre. Não tente bater recordes: é para o corpo recuperar.';
  if (f.sem > 12) return `<b>Semana ${f.sem} do plano.</b> Ele foi feito para 8 a 12 semanas: está na hora de revisar o treino.`;
  return '';
}

/* ---------- Som, vibração e tela acesa ---------- */
let actx = null;
function som(vezes = 1, freq = 880) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    for (let i = 0; i < vezes; i++) {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.3;
      o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.start(t); o.stop(t + 0.26);
    }
  } catch (e) { /* sem áudio */ }
}
const vibrar = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* sem vibração */ } };
let trava = null;
async function telaAcesa() {
  try {
    if (S.atual && 'wakeLock' in navigator && document.visibilityState === 'visible') trava = await navigator.wakeLock.request('screen');
    else if (!S.atual && trava) { await trava.release(); trava = null; }
  } catch (e) { /* não suportado */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearTimeout(copiaT); gravarCopia(); enviarDescanso(); } else { recarregarSeMudou(); fecharNotificacoes(); }
  telaAcesa(); tique();
});
window.addEventListener('pagehide', () => { clearTimeout(copiaT); gravarCopia(); });

/* ---------- Aviso de descanso com o Sansão em segundo plano ----------
   Quem cuida do aviso fora da tela é o service worker (sw.js): ele recebe o fim do descanso, mantém uma notificação
   na barra com o tempo restante (atualizada a cada 5 s) e, no fim, troca por uma notificação com som e vibração.
   Não toca áudio nenhum, então não pausa a música de outro aplicativo. */
function avisarSW(msg) { try { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (c) { c.postMessage(msg); return true; } } catch (e) { /* sem service worker */ } return false; }
function enviarDescanso() {
  const T = S.timer; if (!T || S.avisoFundo === false) return;
  let acc = T.inicio;
  const fases = T.fases.map((f) => { acc += f.dur * 1000; return { rot: f.rot + (f.volta ? ` · ${f.volta}` : ''), fim: acc }; });
  const hora = new Date(acc).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  avisarSW({ tipo: 'descanso', id: `${T.inicio}:${acc}`, fim: acc, fases, hora,
    corpo: T.cardio ? `Termina às ${hora}` : proximaSerie(),
    final: T.cardio ? { titulo: 'Cardio concluído', corpo: 'Volte ao Sansão para finalizar o treino.' } : { titulo: 'Descanso acabou', corpo: proximaSerie() } });
}
function permissaoTexto() {
  if (!('Notification' in window)) return '<p class="rodape">Este navegador não mostra notificações.</p>';
  if (Notification.permission === 'granted') return '<p class="rodape">Notificações liberadas.</p>';
  if (Notification.permission === 'denied') return '<p class="rodape">As notificações estão bloqueadas. Libere em Configurações do Android → Apps → Sansão (ou Chrome) → Notificações.</p>';
  return '<button class="link" data-a="permissao">liberar notificações</button>';
}
function pedirPermissaoAviso() { try { if (S.avisoFundo !== false && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* sem notificações */ } }
function notificar(titulo, corpo) {
  try {
    if (S.avisoFundo === false || !document.hidden || !('Notification' in window) || Notification.permission !== 'granted' || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then((r) => r.showNotification(titulo, { body: corpo, tag: 'descanso', renotify: true, vibrate: [300, 150, 300, 150, 300], icon: 'icon-192.png', badge: 'icon-192.png' })).catch(() => {});
  } catch (e) { /* sem notificações */ }
}
function fecharNotificacoes() { try { if (navigator.serviceWorker) navigator.serviceWorker.ready.then((r) => r.getNotifications({ tag: 'descanso' })).then((ns) => ns.forEach((n) => n.close())).catch(() => {}); } catch (e) { /* nada */ } }
function proximaSerie() {
  const a = S.atual; if (!a) return '';
  for (const it of a.itens) { if (it.pulado) continue; const j = it.sets.findIndex((x) => !x.ok); if (j >= 0) return `Próxima: ${it.nome}, série ${j + 1}`; }
  return a.cardio.ok || a.cardio.pulado || a.cardio.opcional ? 'Treino completo.' : 'Falta o cardio.';
}

/* ---------- Cronômetro (descanso e cardio) ---------- */
function iniciarTimer(fases, opts = {}) {
  S.timer = { inicio: Date.now(), fases, cardio: !!opts.cardio, fase: 0, bip: -1 };
  enviarDescanso(); salvar(); tique();
}
// fimNatural: o tempo acabou sozinho; aí quem avisa fora da tela é o service worker, então não cancela o aviso dele
function pararTimer(fimNatural) { S.timer = null; if (!fimNatural) avisarSW({ tipo: 'parar' }); salvar(); $('#timer').hidden = true; }
function tique() {
  const rel = $('#relogio');
  if (rel && S.atual) rel.textContent = fmtTempo((Date.now() - S.atual.inicio) / 1000);
  // cronômetro de execução: conta para cima e apita ao chegar no mínimo e no máximo da faixa
  const C = S.crono, it = C && S.atual && S.atual.itens[C.i];
  if (it) {
    const seg = (Date.now() - C.inicio) / 1000, ct = $('#crono-t');
    if (ct) ct.textContent = fmtTempo(seg);
    if (C.bip < 1 && seg >= it.repMin) { C.bip = 1; som(1, 880); vibrar(200); }
    if (C.bip < 2 && seg >= it.repMax) { C.bip = 2; som(2, 1040); vibrar([200, 100, 200]); }
  }
  const T = S.timer, el = $('#timer');
  if (!T) { if (!el.hidden) el.hidden = true; return; }
  const total = T.fases.reduce((a, f) => a + f.dur, 0);
  const dec = (Date.now() - T.inicio) / 1000;
  if (dec >= total) {
    const eraCardio = T.cardio;
    pararTimer(true);
    if (!document.hidden) { som(3, 1040); vibrar([300, 150, 300, 150, 300]); }
    else if (!(navigator.serviceWorker && navigator.serviceWorker.controller)) notificar(eraCardio ? 'Cardio concluído' : 'Descanso acabou', eraCardio ? 'Volte ao Sansão para finalizar o treino.' : proximaSerie());
    if (eraCardio && S.atual) { S.atual.cardio.ok = true; salvar(); if (ui.aba === 'hoje') desenhar(); aviso('Cardio concluído!'); }
    else aviso('Descanso acabou. Próxima série!');
    return;
  }
  let acc = 0, i = 0;
  while (i < T.fases.length - 1 && dec >= acc + T.fases[i].dur) { acc += T.fases[i].dur; i++; }
  const f = T.fases[i], resta = f.dur - (dec - acc);
  if (i !== T.fase) { T.fase = i; T.bip = -1; if (!document.hidden) { som(2, f.forte ? 1040 : 660); vibrar([200, 100, 200]); } }
  const seg = Math.ceil(resta);
  if (seg <= 3 && seg !== T.bip) { T.bip = seg; if (!document.hidden) som(1, 620); }
  const multi = T.fases.length > 1;
  el.hidden = false;
  el.className = f.forte ? 'forte' : '';
  el.innerHTML = `<div class="in">
      <div class="grow"><div class="rot mono">${esc(f.rot)}${multi && f.volta ? ` · ${f.volta}` : ''}</div><div class="t mono">${fmtTempo(resta)}</div></div>
      ${multi ? '' : '<button data-a="t-menos">−15</button><button data-a="t-mais">+15</button>'}
      <button data-a="t-pular">${T.cardio ? 'parar' : 'pular'}</button>
    </div><i class="pg" style="width:${(100 * dec / total).toFixed(1)}%"></i>`;
}
setInterval(tique, 250);

/* ---------- Sessão de treino ---------- */
// Séries leves de aquecimento antes de um exercício (2 no primeiro do treino, 1 quando entra músculo frio)
const qtdLeves = (it, i) => (it.leves != null ? it.leves : S.atual && S.atual.pers && i === 0 ? 2 : 0);
const arredKg = (x) => (x >= 10 ? Math.round(x) : Math.round(x * 2) / 2);
function textoLeve(it, n) {
  const kg = num(it.sets[0] && it.sets[0].kg), tem = kg != null && kg > 0;
  if (n >= 2) return tem ? `${fmtNum(arredKg(kg / 2))} kg × 10, depois ${fmtNum(arredKg(kg * 0.75))} kg × 5` : 'metade da carga × 10, depois três quartos da carga × 5';
  return tem ? `${fmtNum(arredKg(kg / 2))} kg × 8 a 10` : 'metade da carga × 8 a 10';
}
// cria o exercício da sessão, já com carga e repetições da última vez em todas as séries
function montarItem(e) {
  const u = ultima(e.ex), base = clone(e); delete base.sets;
  return { ...base, sets: Array.from({ length: e.series }, (_, i) => { const p = u && (u.sets[i] || u.sets[u.sets.length - 1]); return { kg: p ? p.kg : '', reps: p ? p.reps : '', ok: false }; }) };
}
function comecar(idx, curto) {
  const t = treinos()[idx];
  const lista = curto ? t.exercicios.slice(0, 4) : t.exercicios;
  if (!S.planoInicio) S.planoInicio = Date.now();
  pedirPermissaoAviso();
  const fase = fasePlano().tipo;
  S.atual = {
    id: Date.now(), idx, treino: t.id, nome: t.nome, foco: t.foco, inicio: Date.now(), curto: !!curto,
    itens: lista.map((e) => montarItem({ ...e, series: seriesDaFase(e.series, fase) })), fase,
    cardio: { ...clone(t.cardio), aparelho: t.cardio.aparelho || 'esteira', ok: false },
  };
  ui.escolha = null; salvar(); telaAcesa(); desenhar(); window.scrollTo(0, 0);
}
// treino personalizado: começa vazio (ou repetindo um anterior) e não mexe na sequência A–E
function comecarPersonalizado(nome, base) {
  S.atual = {
    id: Date.now(), idx: null, treino: 'P', nome: nome || 'Personalizado', foco: 'Treino personalizado', inicio: Date.now(), curto: false, pers: true,
    itens: base ? base.itens.map((it) => montarItem({ ...it, series: it.series || it.sets.length })) : [],
    cardio: { tipo: 'continuo', min: 20, aparelho: 'esteira', ok: false, opcional: true },
  };
  ui.escolha = null; salvar(); telaAcesa(); fecharFolha(); desenhar(); window.scrollTo(0, 0);
  if (!S.atual.itens.length) folhaEscolher('adicionar');
}
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// parâmetros de um exercício novo na sessão: usa os do plano, se ele existir lá
function padrao(id) {
  for (const t of treinos()) { const e = t.exercicios.find((x) => x.ex === id); if (e) return { series: e.series, repMin: e.repMin, repMax: e.repMax, descanso: e.descanso }; }
  return CAT[id] && CAT[id].un === 's' ? { series: 3, repMin: 30, repMax: 45, descanso: 45 } : { series: 3, repMin: 10, repMax: 12, descanso: 60 };
}
function substituir(i, novo) {
  const it = S.atual.itens[i];
  const orig = it.original || { ex: it.ex, nome: it.nome, img: it.img, dica: it.dica, grupo: it.grupo, semCarga: it.semCarga, un: it.un, repMin: it.repMin, repMax: it.repMax };
  let { repMin, repMax } = orig;
  if ((novo.un || '') !== (orig.un || '')) [repMin, repMax] = novo.un === 's' ? [30, 45] : [12, 15];
  const item = montarItem({ ex: novo.ex, nome: novo.nome, img: novo.img || '', dica: novo.dica || '', grupo: novo.grupo || orig.grupo, semCarga: !!novo.semCarga, un: novo.un, series: it.sets.length, descanso: it.descanso, repMin, repMax, leves: qtdLeves(it, i) });
  if (novo.ex !== orig.ex) item.original = orig;
  S.atual.itens[i] = item; salvar();
}
function finalizar() {
  const a = S.atual; if (!a) return;
  const feitas = a.itens.reduce((n, it) => n + it.sets.filter((s) => s.ok).length, 0);
  const total = a.itens.reduce((n, it) => n + (it.pulado ? it.sets.filter((s) => s.ok).length : it.sets.length), 0);
  if (!feitas && !a.cardio.ok) {
    if (confirm('Nenhuma série foi marcada. Sair sem salvar este treino?')) { S.atual = null; pararTimer(); salvar(); telaAcesa(); desenhar(); }
    return;
  }
  if ((feitas < total || (!a.cardio.ok && !a.cardio.opcional && !a.cardio.pulado)) && !confirm('Ainda há séries ou cardio sem marcar. Finalizar mesmo assim? O que não foi marcado não entra no histórico.')) return;
  a.fim = Date.now();
  a.itens = a.itens.map((it) => ({ ...it, sets: it.sets.filter((s) => s.ok) })).filter((it) => it.sets.length);
  if (!a.cardio.ok) a.cardio.pulado = true;
  S.sessoes.push(a);
  if (a.idx != null) S.proximo = (a.idx + 1) % treinos().length;
  S.atual = null; S.crono = null; pararTimer(); salvar(); telaAcesa();
  ui.aba = 'historico'; ui.hist = a.id; desenhar(); window.scrollTo(0, 0);
  aviso('Treino salvo. Boa!');
}

/* ---------- Telas ---------- */
const anim = (img, cls = '') => (img
  ? `<span class="anim ${cls}"><img src="img/${esc(img)}-0.jpg" alt="" loading="lazy"><img src="img/${esc(img)}-1.jpg" alt="" loading="lazy"></span>`
  : `<span class="anim vazio ${cls}">sem foto</span>`);

function telaHoje() {
  if (S.atual) return telaTreino();
  const idx = ui.escolha ?? S.proximo % treinos().length, t = treinos()[idx];
  const ini = inicioSemana(Date.now());
  const naSemana = S.sessoes.filter((s) => s.fim >= ini).length;
  const ult = S.sessoes[S.sessoes.length - 1];
  const dias = ult ? Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(ult.fim).setHours(0, 0, 0, 0)) / 864e5) : null;
  const fase = fasePlano(), nota = avisoFase();
  return `<div class="abas">${treinos().map((x, i) => `<button class="${i === idx ? 'on' : ''}" data-a="escolher" data-i="${i}" aria-label="Treino ${esc(x.id)}">${esc(x.id)}</button>`).join('')}<button class="mais" data-a="personalizado" aria-label="Treino personalizado">+</button></div>
  <header class="ficha">
    <div class="kick mono">Sansão · ficha nº ${S.sessoes.length + 1} · ${esc(fmtData(Date.now()))}</div>
    <h1 class="tt">Treino ${esc(t.id)}</h1>
    <div class="st">${esc(t.nome)}, <mark>${esc(minuscula(t.foco))}</mark></div>
    <div class="carimbo mono"><span><b>${estimativa(t)}</b>min<br>${t.exercicios.length} exerc.</span></div>
  </header>
  ${nota ? `<p class="fase">${nota}</p>` : ''}
  <ol class="lista">${t.exercicios.map((e, i) => `<li><span class="i mono">${i + 1}</span><span class="n">${esc(e.nome)}</span><span class="dots"></span><span class="q mono">${seriesDaFase(e.series, fase.tipo)}×${e.repMin}–${e.repMax}${e.un === 's' ? 's' : ''}</span></li>`).join('')}
    <li><span class="i mono">+</span><span class="n">Cardio${t.cardio.tipo === 'intervalado' ? ' intervalado' : ''}</span><span class="dots"></span><span class="q mono">${cardioMin(t.cardio)} min</span></li></ol>
  <button class="btn pri" data-a="comecar" data-i="${idx}">Começar treino →</button>
  <button class="lnk centro" data-a="comecar" data-i="${idx}" data-curto="1">ou treino curto: 4 exercícios, ~${estimativa(t, true)} min</button>
  <div class="semana mono"><span>Semana ${naSemana}/5</span><span class="bx">${[0, 1, 2, 3, 4].map((i) => `<i>${i < naSemana ? '✕' : ''}</i>`).join('')}</span></div>
  <p class="rodape">${ult ? `Último treino: ${esc(ult.treino === 'P' ? ult.nome : `${ult.treino} (${ult.nome})`)}, ${dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}.` : 'Nenhum treino registrado ainda.'}</p>`;
}

function cartaoExercicio(it, i) {
  if (it.pulado) {
    const k = it.sets.filter((s) => s.ok).length;
    return `<div class="card ex pulado" id="it-${i}"><div class="row"><div class="grow"><span class="nm">${esc(it.nome)}</span>
      <span class="mt mono">pulado hoje${k ? ` · ${k} série${k > 1 ? 's' : ''} feita${k > 1 ? 's' : ''} fica${k > 1 ? 'm' : ''} no histórico` : ''}</span></div>
      <button class="lnk" data-a="pular" data-i="${i}">desfazer</button></div></div>`;
  }
  const u = ultima(it.ex), feito = it.sets.every((s) => s.ok), semKg = it.un === 's', atual = it.sets.findIndex((s) => !s.ok), nl = qtdLeves(it, i);
  const dica = deveSubir(it)
    ? `<div class="ult sobe"><mark>Bateu ${it.repMax} repetições em todas as séries da última vez: suba a carga hoje.</mark></div>`
    : u ? `<div class="ult">última vez (${esc(fmtData(u.quando))}): ${esc(resumoSets(u.sets, it.un))}</div>`
      : '<div class="ult cinza">primeira vez: comece leve e ache a carga em que as 2 últimas repetições saiam difíceis</div>';
  return `<div class="card ex ${feito ? 'feito' : ''}" id="it-${i}">
    <button class="exhead" data-a="detalhe" data-i="${i}"><span class="pola">${anim(it.img)}</span>
      <span class="nm">${esc(it.nome)}</span><span class="mt mono">${alvo(it)} · descanso ${fmtTempo(it.descanso)}</span></button>
    ${it.original ? `<div class="obs">hoje no lugar de: ${esc(it.original.nome)}</div>` : ''}
    ${dica}${S.notas[it.ex] ? `<div class="obs">nota: ${esc(S.notas[it.ex])}</div>` : ''}
    ${nl ? `<div class="leve ${it.leveOk ? 'ok' : ''}"><span class="grow"><b class="mono">${nl === 1 ? '1 série leve antes' : '2 séries leves antes'}</b><span id="lv-${i}">${esc(textoLeve(it, nl))}</span></span>
      <button class="check ${it.leveOk ? 'carimbo-ok' : ''}" data-a="leve-ok" data-i="${i}" aria-label="${it.leveOk ? 'Desmarcar' : 'Marcar'} séries leves">✓</button></div>` : ''}
    <div class="sets ${semKg ? 'sem-kg' : ''}"><div class="cab mono"><span>série</span>${semKg ? '' : '<span>kg</span>'}<span>${semKg ? 'seg' : 'rep'}</span><span></span></div>
      ${it.sets.map((s, j) => `<div class="set ${s.ok ? 'ok' : j === atual ? 'now' : ''}">
        <span class="n mono">${j + 1}</span>
        ${semKg ? '' : `<input class="mono" inputmode="decimal" data-c="kg" data-i="${i}" data-s="${j}" value="${esc(s.kg)}" placeholder="${it.semCarga ? '–' : '0'}" aria-label="Carga da série ${j + 1}">`}
        <input class="mono" inputmode="numeric" data-c="reps" data-i="${i}" data-s="${j}" value="${esc(s.reps)}" placeholder="${it.repMin}–${it.repMax}" aria-label="${semKg ? 'Segundos' : 'Repetições'} da série ${j + 1}">
        <button class="check ${s.ok ? 'carimbo-ok' : ''}" data-a="ok" data-i="${i}" data-s="${j}" aria-label="${s.ok ? 'Desmarcar' : 'Concluir'} série ${j + 1}">✓</button>
      </div>`).join('')}</div>
    ${semKg && !feito ? (S.crono && S.crono.i === i
      ? `<button class="btn pri crono" data-a="crono" data-i="${i}"><span id="crono-t">00:00</span> · parar e marcar a série</button>`
      : `<button class="btn crono" data-a="crono" data-i="${i}">▶ Cronometrar a série ${atual + 1}</button>`) : ''}
    <div class="acts"><span><button class="lnk" data-a="mais-serie" data-i="${i}">+ série</button>${it.sets.length > 1 ? ` · <button class="lnk" data-a="menos-serie" data-i="${i}">− série</button>` : ''}</span>
      <span>${feito ? '' : `<button class="lnk" data-a="pular" data-i="${i}">pular</button> · `}<button class="lnk verm" data-a="trocar" data-i="${i}">trocar</button></span></div>
  </div>`;
}
function cartaoCardio() {
  const c = S.atual.cardio, rodando = S.timer && S.timer.cardio;
  if (c.pulado) return `<div class="card ex pulado" id="cardio"><div class="row"><div class="grow"><span class="nm">Cardio</span><span class="mt mono">pulado hoje · não entra no histórico</span></div>
    <button class="lnk" data-a="cardio-pular">desfazer</button></div></div>`;
  return `<div class="card ex ${c.ok ? 'feito' : ''}" id="cardio">
    <div class="exhead"><span class="pola">${anim(c.aparelho)}</span><span class="nm">Cardio</span><span class="mt mono">${esc(cardioTexto(c))}${c.opcional ? ' · opcional' : ''}</span></div>
    <div class="seg">${Object.entries(APARELHOS).map(([k, v]) => `<button class="${c.aparelho === k ? 'on' : ''}" data-a="aparelho" data-k="${k}">${v}</button>`).join('')}</div>
    <div class="ult cinza">${c.tipo === 'intervalado' ? 'no trecho forte não deve dar para conversar; no leve, recupere o fôlego' : 'respiração acelerada, mas ainda dá para falar frases curtas; a cada 2 semanas, suba um pouco a inclinação ou o ritmo'}</div>
    <div class="row" style="margin-top:12px"><button class="btn ${c.ok ? '' : 'pri'} grow" data-a="cardio-iniciar">${rodando ? 'Reiniciar cronômetro' : 'Iniciar cronômetro'}</button>
      <button class="btn estreito" style="min-height:60px" data-a="cardio-ok">${c.ok ? 'desmarcar' : 'já fiz ✓'}</button></div>
    ${c.ok ? '' : '<div class="acts"><span></span><button class="lnk" data-a="cardio-pular">pular o cardio hoje</button></div>'}
  </div>`;
}
// linha de progresso: um quadradinho por exercício (cheio = feito) e um círculo para o cardio
// linha de progresso: um quadradinho por exercício (cheio = feito, × = pulado) e um círculo para o cardio
function progHTML() {
  const a = S.atual, n = a.itens.length;
  const q = a.itens.map((it) => { if (it.pulado) return '×'; const k = it.sets.filter((x) => x.ok).length; return k === it.sets.length ? '■' : k ? '◧' : '□'; }).join('');
  const prox = a.itens.findIndex((it) => !it.pulado && it.sets.some((x) => !x.ok));
  const cardioFeito = a.cardio.ok || a.cardio.pulado || a.cardio.opcional;
  const txt = !n ? 'Nenhum exercício ainda' : prox >= 0 ? `Exercício ${prox + 1} de ${n}` : cardioFeito ? 'Tudo feito' : 'Falta o cardio';
  return `<div class="pr mono" id="prog"><span>${txt}</span><b>${q}${a.cardio.opcional ? '' : a.cardio.pulado ? ' ×' : a.cardio.ok ? ' ●' : ' ○'}</b></div>`;
}
function telaTreino() {
  const a = S.atual;
  return `<div class="top"><div><h1 class="a">${a.pers ? esc(a.nome) : `Treino ${esc(a.treino)}`} <span class="mono rel">· <span id="relogio">00:00</span></span></h1>
      <div class="st small">${a.pers ? 'treino personalizado' : `${esc(a.nome)}, ${esc(minuscula(a.foco))}`}${a.curto ? ' (curto)' : ''}</div></div>
    <button class="fim-btn mono" data-a="finalizar">Finalizar<span>✓</span></button></div>
  ${progHTML()}
  ${!a.pers && avisoFase() ? `<p class="fase">${avisoFase()}</p>` : ''}
  ${a.itens.length ? `<div class="card aquec ${a.aquecOk ? 'feito' : ''}" id="aquec"><div class="row"><div class="grow"><span class="nm">Aquecimento</span><span class="mt mono">3 a 5 min de cardio leve (pode encurtar)</span></div>
      <button class="check ${a.aquecOk ? 'carimbo-ok' : ''}" data-a="aquec-ok" aria-label="${a.aquecOk ? 'Desmarcar' : 'Marcar'} aquecimento">✓</button></div>
    <div class="ult cinza">o que não deve ser pulado são as séries leves marcadas nas fichas abaixo; alongar antes é opcional (menos de 1 min por músculo)</div></div>` : ''}
  ${a.itens.length ? '' : '<p class="rodape">Este treino está vazio. Adicione os exercícios conforme for fazendo.</p>'}
  ${a.itens.map(cartaoExercicio).join('')}
  <button class="btn" style="width:calc(100% - 4px)" data-a="adicionar-ex">+ adicionar exercício</button>
  ${cartaoCardio()}
  <div class="stack"><button class="btn pri" data-a="finalizar">Finalizar treino</button><button class="lnk verm centro" data-a="descartar">cancelar este treino</button></div>`;
}

function telaHistorico() {
  const lista = [...S.sessoes].reverse();
  return `<div class="top"><h1>Histórico</h1><div class="mut">${lista.length} treino${lista.length === 1 ? '' : 's'}</div></div>
  ${lista.length ? '' : '<div class="card mut">Seus treinos finalizados aparecem aqui.</div>'}
  ${lista.map((s) => {
    const aberto = ui.hist === s.id, series = s.itens.reduce((n, it) => n + it.sets.length, 0);
    return `<div class="card"><button class="exhead" data-a="hist" data-id="${s.id}"><span class="tag">${esc(s.treino)}</span>
        <span class="grow"><span class="nome">${esc(s.nome)}${s.curto ? ' (curto)' : ''}</span><br><span class="mut small">${esc(fmtData(s.fim))} · ${fmtDur(s.fim - s.inicio)} · ${series} séries${s.cardio && s.cardio.ok ? ' · cardio ✓' : ''}</span></span><span class="mono mut">${aberto ? '−' : '+'}</span></button>
      ${aberto ? `<div style="margin-top:10px">${s.itens.map((it) => `<div class="item"><b>${esc(it.nome)}</b><span class="mut" style="text-align:right">${esc(resumoSets(it.sets, it.un))}</span></div>`).join('')}
        ${s.cardio && s.cardio.ok ? `<div class="item"><b>Cardio</b><span class="mut">${esc(APARELHOS[s.cardio.aparelho] || '')}, ${cardioMin(s.cardio)} min</span></div>
        <button class="link" data-a="hist-sem-cardio" data-id="${s.id}">não fiz o cardio neste dia</button>` : ''}
        <button class="link bad" data-a="apagar-sessao" data-id="${s.id}">Apagar este treino</button></div>` : ''}</div>`;
  }).join('')}`;
}

function telaEvolucao() {
  const hoje = inicioSemana(Date.now()), semanas = [];
  for (let k = 7; k >= 0; k--) { const ini = hoje - k * 7 * 864e5; semanas.push({ ini, n: S.sessoes.filter((s) => inicioSemana(s.fim) === inicioSemana(ini + 36e5)).length }); }
  const mx = Math.max(5, ...semanas.map((w) => w.n));
  const nomes = {};
  S.sessoes.forEach((s) => s.itens.forEach((it) => { if (it.un !== 's' && it.sets.some((x) => num(x.kg) != null)) nomes[it.ex] = it.nome; }));
  const ids = Object.keys(nomes).sort((a, b) => nomes[a].localeCompare(nomes[b]));
  const sel = ids.includes(ui.evo) ? ui.evo : ids[0];
  const pts = !sel ? [] : S.sessoes.map((s) => { const it = s.itens.find((x) => x.ex === sel); if (!it) return null; const ks = it.sets.map((x) => num(x.kg)).filter((k) => k != null); return ks.length ? { t: s.fim, kg: Math.max(...ks), sets: it.sets } : null; }).filter(Boolean);
  return `<div class="top"><h1>Evolução</h1></div>
  ${cartaoCorpo()}
  <div class="card"><b>Treinos por semana</b><div class="mut small">Últimas 8 semanas · meta: 5</div>
    <div class="bars">${semanas.map((w) => `<div><span>${w.n || ''}</span><i style="height:${(70 * w.n) / mx}px"></i><span>${new Date(w.ini).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></div>`).join('')}</div></div>
  <div class="card"><b>Carga por exercício</b>
    ${!ids.length ? '<div class="mut small" style="margin-top:6px">Depois do primeiro treino com carga anotada, o gráfico aparece aqui.</div>' : `
    <select class="f" data-c="evo" aria-label="Exercício" style="margin-top:8px">${ids.map((id) => `<option value="${esc(id)}" ${id === sel ? 'selected' : ''}>${esc(nomes[id])}</option>`).join('')}</select>
    ${grafico(pts)}
    <div style="margin-top:8px">${[...pts].reverse().slice(0, 8).map((p) => `<div class="item"><span>${esc(fmtData(p.t))}</span><span class="mut">${esc(resumoSets(p.sets))}</span></div>`).join('')}</div>`}
  </div>`;
}
function grafico(pts, un = 'kg', rot = 'treinos') {
  const U = un.toUpperCase();
  if (pts.length < 2) return `<p class="rodape">${pts.length ? `Até agora: ${fmtNum(pts[0].kg)} ${un}. O gráfico aparece a partir do segundo registro.` : ''}</p>`;
  const W = 320, H = 150, pad = 26, ks = pts.map((p) => p.kg), lo = Math.min(...ks), hi = Math.max(...ks), amp = hi - lo || 1;
  const xy = pts.map((p, i) => [pad + (i * (W - 2 * pad)) / (pts.length - 1), H - pad - ((p.kg - lo) / amp) * (H - 2 * pad)]);
  const fonte = "font-family=\"'Plex Mono', monospace\" font-size=\"10.5\" fill=\"#6f6858\"";
  return `<svg class="graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico">
    <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#1d1b18" stroke-width="1.5"/>
    <polyline fill="none" stroke="#1d1b18" stroke-width="2.5" stroke-linejoin="round" points="${xy.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}"/>
    ${xy.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#d4402b" stroke="#fbf7ee" stroke-width="1.5"/>`).join('')}
    <text x="${pad}" y="14" ${fonte}>MÁX. ${fmtNum(hi)} ${U}</text><text x="${pad}" y="${H - 8}" ${fonte}>MÍN. ${fmtNum(lo)} ${U} · ${pts.length} ${rot.toUpperCase()}</text></svg>`;
}

function telaTreinos() {
  return `<div class="top"><h1>Treinos</h1></div>
  ${treinos().map((t, w) => `<div class="card"><div class="row"><span class="tag">${esc(t.id)}</span><div class="grow"><b>${esc(t.nome)}</b><div class="mut small">${esc(t.foco)}</div></div></div>
    <div style="margin-top:8px">${t.exercicios.map((e, i) => `<div class="item"><button class="grow" style="text-align:left" data-a="editar" data-w="${w}" data-i="${i}"><b>${esc(e.nome)}</b><br><span class="mut small">${alvo(e)} · descanso ${fmtTempo(e.descanso)}</span></button><span class="mut">✎</span></div>`).join('')}
      <div class="item"><button class="grow" style="text-align:left" data-a="editar-cardio" data-w="${w}"><b>Cardio</b><br><span class="mut small">${esc(cardioTexto(t.cardio))}</span></button><span class="mut">✎</span></div></div>
    <button class="link" data-a="novo-ex" data-w="${w}">+ adicionar exercício</button></div>`).join('')}
  <div class="card"><h2>Fase do plano</h2><div class="mut small">${S.planoInicio ? `Começou em ${esc(fmtData(S.planoInicio))}. Você está na semana ${fasePlano().sem}.` : 'A contagem começa no primeiro treino.'} Semanas 1 e 2: adaptação, com uma série a menos. Semana 6: alívio, com metade das séries. O plano vale por 8 a 12 semanas.</div>
    ${S.planoInicio ? '<button class="link" data-a="reiniciar-fase">recomeçar a contagem das semanas</button>' : ''}</div>
  <div class="card"><h2>Plano original</h2><div class="mut small">Desfaz as edições que você fez nos treinos A a E. O histórico continua.</div>
    <button class="btn ghost bad" style="margin-top:10px" data-a="plano-original">Voltar ao plano de treino original</button></div>`;
}

function telaAjustes() {
  return `<div class="top"><h1>Ajustes</h1></div>
  <div class="card"><h2>Aviso de descanso</h2><div class="mut small">Com o aviso ligado, quando você sai do Sansão durante o descanso aparece uma notificação com o tempo que falta, e no fim ela vibra e toca o som de notificação. Não mexe na música.</div>
    ${permissaoTexto()}
    <button class="btn" style="margin-top:10px" data-a="aviso-fundo">${S.avisoFundo === false ? 'Desligado · tocar para ligar' : 'Ligado · tocar para desligar'}</button></div>
  <div class="card"><h2>Backup</h2><div class="mut small">Os dados ficam só neste celular. Salve um arquivo de backup no fim de cada semana.${S.ultimoBackup ? ` Último: ${esc(fmtData(S.ultimoBackup))}.` : ''}</div>
    <div class="stack" style="margin-top:10px"><button class="btn" data-a="exportar">Salvar backup</button>
      <label class="btn ghost">Restaurar backup<input type="file" accept="application/json,.json" data-c="importar" hidden></label></div></div>
  <div class="card"><h2>Seus dados</h2>
    <label class="f">Altura (cm), para a conta cintura ÷ altura<input inputmode="numeric" data-c="altura" value="${esc(S.altura || 174)}"></label></div>
  <p class="rodape centro">Sansão · ${S.sessoes.length} treinos registrados</p>`;
}

/* ---------- Corpo: peso e medidas ---------- */
const MEDIDAS = [
  ['peso', 'Peso', 'kg', 'De manhã, em jejum, depois de ir ao banheiro. Pese 2 ou 3 vezes por semana: o que vale é a média.'],
  ['cintura', 'Cintura', 'cm', 'Na altura do umbigo, barriga relaxada, no fim de uma expiração normal. É a medida que mais mostra a perda de gordura.'],
  ['peito', 'Peito', 'cm', 'Na linha dos mamilos, braços soltos ao lado do corpo.'],
  ['braco', 'Braço', 'cm', 'Braço direito relaxado ao lado do corpo, no ponto mais grosso.'],
  ['coxa', 'Coxa', 'cm', 'Coxa direita, em pé com o peso nas duas pernas, no ponto mais grosso.'],
];
function cartaoCorpo() {
  const ms = S.medidas || [];
  const ultimoDe = (k) => { for (let i = ms.length - 1; i >= 0; i--) if (ms[i][k] != null) return ms[i]; return null; };
  const primeiroDe = (k) => ms.find((x) => x[k] != null) || null;
  const linhas = MEDIDAS.map(([k, nome, un]) => {
    const u = ultimoDe(k), p = primeiroDe(k); if (!u) return '';
    const d = u[k] - p[k], sinal = d > 0 ? '+' : d < 0 ? '−' : '±';
    return `<div class="item"><b>${nome}</b><span class="mono">${fmtNum(u[k])} ${un}${u !== p ? ` <span class="${(k === 'peso' || k === 'cintura') ? (d < 0 ? 'bom' : d > 0 ? 'ruim' : 'mut') : (d > 0 ? 'bom' : 'mut')}">${sinal}${fmtNum(Math.abs(d))}</span>` : ''}</span></div>`;
  }).join('');
  // média de peso dos últimos 7 dias contra os 7 anteriores
  const agora = Date.now(), media = (a, b) => { const v = ms.filter((x) => x.peso != null && x.data > agora - a * 864e5 && x.data <= agora - b * 864e5).map((x) => x.peso); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const m1 = media(7, 0), m2 = media(14, 7);
  const cint = ultimoDe('cintura'), rca = cint && S.altura ? cint.cintura / S.altura : null;
  const ids = MEDIDAS.filter(([k]) => ms.filter((x) => x[k] != null).length).map(([k]) => k);
  const sel = ids.includes(ui.evoCorpo) ? ui.evoCorpo : ids[0], def = MEDIDAS.find(([k]) => k === sel);
  const pts = sel ? ms.filter((x) => x[sel] != null).map((x) => ({ t: x.data, kg: x[sel] })) : [];
  const ultMed = ms.length ? ms[ms.length - 1].data : null, dias = ultMed ? Math.floor((agora - ultMed) / 864e5) : null;
  return `<div class="card"><div class="row"><b class="grow">Corpo</b><button class="btn sm" data-a="medida-nova">+ registrar</button></div>
    ${!ms.length ? '<p class="rodape">Registre peso e medidas para acompanhar a evolução do corpo. Sugestão: peso 2 ou 3 vezes por semana, medidas a cada 2 semanas, sempre de manhã e em jejum.</p>' : `
    <div style="margin-top:8px">${linhas}</div>
    ${m1 != null ? `<div class="item"><b>Média de peso da semana</b><span class="mono">${fmtNum(Math.round(m1 * 10) / 10)} kg${m2 != null ? ` <span class="${m1 < m2 ? 'bom' : m1 > m2 ? 'ruim' : 'mut'}">${m1 < m2 ? '−' : m1 > m2 ? '+' : '±'}${fmtNum(Math.round(Math.abs(m1 - m2) * 10) / 10)}</span>` : ''}</span></div>` : ''}
    ${rca ? `<div class="item"><b>Cintura ÷ altura</b><span class="mono">${fmtNum(Math.round(rca * 100) / 100)} <span class="mut">(saudável: abaixo de 0,5)</span></span></div>` : ''}
    ${ids.length ? `<select class="f" data-c="evo-corpo" aria-label="Medida" style="margin-top:10px">${ids.map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${MEDIDAS.find((x) => x[0] === k)[1]}</option>`).join('')}</select>
      ${grafico(pts, def[2], 'registros')}` : ''}
    ${dias != null && dias >= 14 ? `<p class="fase">Faz ${dias} dias que você não registra medidas.</p>` : ''}
    <div style="margin-top:10px">${[...ms].reverse().slice(0, 6).map((x) => `<div class="item"><span>${esc(fmtData(x.data))}</span><span class="mono mut" style="text-align:right">${MEDIDAS.filter(([k]) => x[k] != null).map(([k, nome, un]) => (un === 'kg' ? `${fmtNum(x[k])} kg` : `${nome.toLowerCase().slice(0, 4)}. ${fmtNum(x[k])}`)).join(' · ')} <button class="lnk verm" style="padding:0 0 0 6px" data-a="medida-apagar" data-id="${x.id}" aria-label="Apagar registro">×</button></span></div>`).join('')}</div>`}
  </div>`;
}
function folhaMedida() {
  const hoje = new Date(), iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  abrirFolha(`<h2>Registrar medidas</h2><div class="mut small">Preencha só o que mediu hoje. Fita métrica justa na pele, sem apertar.</div>
    <label class="f">Data<input type="date" id="m-data" value="${iso}"></label>
    ${MEDIDAS.map(([k, nome, un, dica]) => `<label class="f">${nome} (${un})<input id="m-${k}" inputmode="decimal" placeholder="${un}"></label><div class="obs" style="margin-top:4px">${dica}</div>`).join('')}
    <div class="stack" style="margin-top:14px"><button class="btn pri" data-a="medida-salvar">Salvar</button><button class="btn ghost" data-a="fechar">Cancelar</button></div>`);
}

/* ---------- Folhas ---------- */
function abrirFolha(html) { const s = $('#sheet'); s.innerHTML = `<div class="box">${html}</div>`; s.hidden = false; sincronizarVoltar(); }
function fecharFolha() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; sincronizarVoltar(); }
function folhaDetalhe(i) {
  const it = S.atual.itens[i];
  const hist = S.sessoes.map((s) => ({ s, it: s.itens.find((x) => x.ex === it.ex) })).filter((x) => x.it).slice(-4).reverse();
  const busca = encodeURIComponent(`${it.nome} execução correta`);
  abrirFolha(`${anim(it.img, 'big')}
    <h2 style="margin-top:12px">${esc(it.nome)}</h2><div class="mut small">${alvo(it)} · descanso ${fmtTempo(it.descanso)}</div>
    ${it.dica ? `<p>${esc(it.dica)}</p>` : ''}
    <a class="btn" href="https://www.youtube.com/results?search_query=${busca}" target="_blank" rel="noopener">▶ Ver vídeos no YouTube</a>
    <label class="f">Minha anotação (ex.: posição do banco)<textarea rows="2" data-c="nota" data-ex="${esc(it.ex)}">${esc(S.notas[it.ex] || '')}</textarea></label>
    ${hist.length ? `<div style="margin-top:12px"><b>Últimas vezes</b>${hist.map((h) => `<div class="item"><span>${esc(fmtData(h.s.fim))}</span><span class="mut">${esc(resumoSets(h.it.sets, it.un))}</span></div>`).join('')}</div>` : ''}
    <button class="btn pri" style="margin-top:14px" data-a="fechar">Fechar</button>`);
}
// Lista de exercícios para trocar (modo 'trocar', índice i) ou adicionar (modo 'adicionar') na sessão
function folhaEscolher(modo, i, todos) {
  ui.pick = { modo, i };
  const it = modo === 'trocar' ? S.atual.itens[i] : null;
  const usados = new Set(S.atual.itens.map((x) => x.ex));
  const linha = ([id, e]) => `<button class="pick" data-a="pick" data-id="${esc(id)}"><img src="img/${esc(e.img)}-0.jpg" alt="" loading="lazy"><span class="grow">${esc(e.nome)}${usados.has(id) ? ' <span class="mut small">(já está no treino)</span>' : ''}</span></button>`;
  const todosEx = Object.entries(CAT).filter(([id]) => !it || id !== it.ex);
  const porArea = () => [...new Set(Object.values(GRUPOS))].map((area) => `<h3>${esc(area)}</h3>${todosEx.filter(([, e]) => GRUPOS[e.grupo] === area).map(linha).join('')}`).join('');
  let corpo;
  if (it && it.grupo && GRUPOS[it.grupo] && !todos) {
    const area = GRUPOS[it.grupo];
    const mesmo = todosEx.filter(([, e]) => e.grupo === it.grupo), musculo = todosEx.filter(([, e]) => e.grupo !== it.grupo && GRUPOS[e.grupo] === area);
    corpo = `${mesmo.length ? `<h3>Mesmo movimento</h3>${mesmo.map(linha).join('')}` : ''}
      ${musculo.length ? `<h3>Mesmo músculo (${esc(area)}), outro movimento</h3>${musculo.map(linha).join('')}` : ''}
      <button class="link" data-a="pick-todos">Ver todos os exercícios</button>`;
  } else corpo = porArea();
  abrirFolha(`<h2>${it ? 'Trocar exercício' : 'Adicionar exercício'}</h2>
    ${it ? `<div class="mut small">No lugar de: ${esc(it.nome)}. Vale só para o treino de hoje; séries, repetições e descanso continuam os mesmos.</div>` : ''}
    ${it && it.original ? `<button class="btn" style="margin-top:12px" data-a="pick-original">← Voltar para ${esc(it.original.nome)}</button>` : ''}
    ${corpo}
    <h3>Não achou? Digite o nome</h3>
    <div class="row"><label class="f grow" style="margin:0"><input id="p-nome" placeholder="Nome do exercício" aria-label="Nome do exercício"></label><button class="btn sm" style="min-height:48px;margin-top:4px" data-a="pick-livre">Usar</button></div>
    <div class="stack" style="margin-top:14px">${it ? '<button class="btn ghost bad" data-a="pick-remover">Tirar este exercício do treino de hoje</button>' : ''}
      <button class="btn ghost" data-a="fechar">Cancelar</button></div>`);
}
function aplicarEscolha(novo) {
  const { modo, i } = ui.pick;
  if (modo === 'trocar') {
    if (S.atual.itens[i].sets.some((s) => s.ok) && !confirm('As séries já marcadas deste exercício serão apagadas. Trocar mesmo assim?')) return;
    substituir(i, novo);
  } else { S.atual.itens.push(montarItem({ ...novo, ...padrao(novo.ex) })); salvar(); }
  fecharFolha(); desenhar();
  const alvoEl = $(`#it-${modo === 'trocar' ? i : S.atual.itens.length - 1}`); if (alvoEl) alvoEl.scrollIntoView({ block: 'center' });
}
function folhaPersonalizado() {
  const vistos = new Set(), antigos = [];
  for (let k = S.sessoes.length - 1; k >= 0 && antigos.length < 4; k--) { const s = S.sessoes[k]; if (s.pers && !vistos.has(s.nome)) { vistos.add(s.nome); antigos.push(s); } }
  abrirFolha(`<h2>Treino personalizado</h2>
    <div class="mut small">Para o dia em que você faz um treino diferente (por exemplo, o da sua namorada). Ele entra no histórico, mas não muda a sequência A–E.</div>
    <label class="f">Nome do treino<input id="tp-nome" placeholder="Ex.: Treino com a Ana" maxlength="40"></label>
    <div class="stack" style="margin-top:14px"><button class="btn pri" data-a="pers-comecar">Começar e ir adicionando exercícios</button>
      ${antigos.length ? `<h3>Repetir um treino personalizado</h3>${antigos.map((s) => `<button class="btn" data-a="pers-repetir" data-id="${s.id}">${esc(s.nome)} <span class="mut small">· ${s.itens.length} exercícios · ${esc(fmtData(s.fim))}</span></button>`).join('')}` : ''}
      <button class="btn ghost" data-a="fechar">Cancelar</button></div>`);
}
function folhaEditar(w, i) {
  const novo = i == null, e = novo ? { nome: '', series: 3, repMin: 10, repMax: 12, descanso: 60 } : treinos()[w].exercicios[i];
  abrirFolha(`<h2>${novo ? 'Novo exercício' : 'Editar exercício'}</h2>
    <label class="f">Nome<input id="e-nome" value="${esc(e.nome)}"></label>
    <div class="grid2"><label class="f">Séries<input id="e-series" inputmode="numeric" value="${e.series}"></label><label class="f">Descanso (segundos)<input id="e-desc" inputmode="numeric" value="${e.descanso}"></label>
      <label class="f">Repetições mínimas<input id="e-min" inputmode="numeric" value="${e.repMin}"></label><label class="f">Repetições máximas<input id="e-max" inputmode="numeric" value="${e.repMax}"></label></div>
    <label class="f">Séries leves antes (0, 1 ou 2)<input id="e-leves" inputmode="numeric" value="${e.leves || 0}"></label>
    <div class="stack" style="margin-top:14px"><button class="btn pri" data-a="salvar-ex" data-w="${w}" ${novo ? '' : `data-i="${i}"`}>Salvar</button>
      ${novo ? '' : `<div class="row"><button class="btn grow" data-a="mover" data-w="${w}" data-i="${i}" data-d="-1">↑ Subir</button><button class="btn grow" data-a="mover" data-w="${w}" data-i="${i}" data-d="1">↓ Descer</button></div>
      <button class="btn ghost bad" data-a="remover-ex" data-w="${w}" data-i="${i}">Remover do treino</button>`}
      <button class="btn ghost" data-a="fechar">Cancelar</button></div>`);
}
function folhaCardio(w) {
  const c = treinos()[w].cardio;
  abrirFolha(`<h2>Cardio do treino ${esc(treinos()[w].id)}</h2>
    <label class="f">Tipo<select class="f" id="c-tipo"><option value="continuo" ${c.tipo === 'continuo' ? 'selected' : ''}>Ritmo constante</option><option value="intervalado" ${c.tipo === 'intervalado' ? 'selected' : ''}>Intervalado (forte / leve)</option></select></label>
    <label class="f">Minutos (ritmo constante)<input id="c-min" inputmode="numeric" value="${c.min || 20}"></label>
    <label class="f">Voltas (intervalado: 1 min forte + 1 min leve cada)<input id="c-voltas" inputmode="numeric" value="${c.voltas || 8}"></label>
    <div class="stack" style="margin-top:14px"><button class="btn pri" data-a="salvar-cardio" data-w="${w}">Salvar</button><button class="btn ghost" data-a="fechar">Cancelar</button></div>`);
}

/* ---------- Desenho ---------- */
const ABAS = [['hoje', 'Hoje'], ['historico', 'Histórico'], ['evolucao', 'Evolução'], ['treinos', 'Treinos'], ['ajustes', 'Ajustes']];
function desenhar() {
  const telas = { hoje: telaHoje, historico: telaHistorico, evolucao: telaEvolucao, treinos: telaTreinos, ajustes: telaAjustes };
  $('#app').innerHTML = telas[ui.aba]();
  sincronizarVoltar();
  $('#nav').innerHTML = ABAS.map(([k, v]) => `<button class="${ui.aba === k ? 'on' : ''}" data-a="aba" data-k="${k}"><span>${v}${k === 'hoje' && S.atual && ui.aba !== 'hoje' ? ' <i>●</i>' : ''}</span></button>`).join('');
  tique();
}
function redesenharItem(i) { const el = $(`#it-${i}`); if (el) el.outerHTML = cartaoExercicio(S.atual.itens[i], i); const p = $('#prog'); if (p) p.outerHTML = progHTML(); }
function redesenharCardio() { const el = $('#cardio'); if (el) el.outerHTML = cartaoCardio(); const p = $('#prog'); if (p) p.outerHTML = progHTML(); }
let avisoT = 0;
function aviso(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(avisoT); avisoT = setTimeout(() => { t.hidden = true; }, 2600); }

/* ---------- Botão voltar do Android ----------
   Sem isto, o voltar fecha o app. Agora ele fecha a janela aberta, depois volta para a aba Hoje; com treino em
   andamento pede um segundo toque para sair. Funciona guardando uma entrada extra no histórico do navegador. */
let armado = false, ignorarPop = false, saidaAte = 0;
const precisaArmar = () => !$('#sheet').hidden || ui.aba !== 'hoje' || !!S.atual;
function sincronizarVoltar() {
  if (Date.now() < saidaAte) return;
  const quer = precisaArmar();
  if (quer && !armado) { history.pushState({ sansao: 1 }, ''); armado = true; }
  else if (!quer && armado) { armado = false; ignorarPop = true; history.back(); }
}
window.addEventListener('popstate', () => {
  if (ignorarPop) { ignorarPop = false; return; }
  armado = false;
  if (!$('#sheet').hidden) { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; if (S.atual && ui.aba === 'hoje') desenhar(); }
  else if (ui.aba !== 'hoje') { ui.aba = 'hoje'; desenhar(); window.scrollTo(0, 0); }
  else if (S.atual) { aviso('Treino em andamento. Toque em voltar de novo para sair; nada se perde.'); saidaAte = Date.now() + 2500; setTimeout(sincronizarVoltar, 2600); return; }
  sincronizarVoltar();
});

/* ---------- Ações ---------- */
const acoes = {
  aba: (d) => { ui.aba = d.k; desenhar(); window.scrollTo(0, 0); },
  escolher: (d) => { ui.escolha = +d.i; desenhar(); },
  comecar: (d) => comecar(+d.i, !!d.curto),
  finalizar,
  descartar: () => { if (confirm('Cancelar este treino? O que foi marcado hoje será perdido.')) { S.atual = null; S.crono = null; pararTimer(); salvar(); telaAcesa(); desenhar(); window.scrollTo(0, 0); } },
  detalhe: (d) => folhaDetalhe(+d.i),
  fechar: () => { fecharFolha(); if (S.atual && ui.aba === 'hoje') desenhar(); },
  ok: (d) => {
    const i = +d.i, j = +d.s, it = S.atual.itens[i], s = it.sets[j];
    if (s.ok) { s.ok = false; salvar(); redesenharItem(i); return; }
    if (num(s.reps) == null || num(s.reps) <= 0) { aviso(it.un === 's' ? 'Digite quantos segundos você fez.' : 'Digite quantas repetições você fez.'); const c = $(`input[data-c="reps"][data-i="${i}"][data-s="${j}"]`); if (c) c.focus(); return; }
    s.ok = true;
    salvar(); redesenharItem(i);
    const ultimaDeTodas = S.atual.itens.every((x) => x.pulado || x.sets.every((y) => y.ok));
    if (!ultimaDeTodas) iniciarTimer([{ rot: 'Descanso', dur: it.descanso }]);
    else { pararTimer(); aviso('Musculação concluída. Agora o cardio!'); }
  },
  'mais-serie': (d) => { const it = S.atual.itens[+d.i], u = it.sets[it.sets.length - 1]; it.sets.push({ kg: u ? u.kg : '', reps: '', ok: false }); salvar(); redesenharItem(+d.i); },
  'menos-serie': (d) => { const it = S.atual.itens[+d.i]; if (it.sets.length > 1) { it.sets.pop(); salvar(); redesenharItem(+d.i); } },
  trocar: (d) => folhaEscolher('trocar', +d.i),
  'adicionar-ex': () => folhaEscolher('adicionar'),
  'pick-todos': () => folhaEscolher(ui.pick.modo, ui.pick.i, true),
  pick: (d) => aplicarEscolha({ ex: d.id, ...CAT[d.id] }),
  'pick-original': () => aplicarEscolha(S.atual.itens[ui.pick.i].original),
  'pick-livre': () => {
    const nome = $('#p-nome').value.trim(); if (!nome) { aviso('Digite o nome do exercício.'); return; }
    aplicarEscolha({ ex: `livre-${slug(nome)}`, nome, img: '', dica: '' });
  },
  'pick-remover': () => { const l = S.atual.itens, i = ui.pick.i; if (confirm(`Tirar "${l[i].nome}" do treino de hoje?`)) { l.splice(i, 1); salvar(); fecharFolha(); desenhar(); } },
  personalizado: () => folhaPersonalizado(),
  'pers-comecar': () => comecarPersonalizado($('#tp-nome').value.trim()),
  'pers-repetir': (d) => { const s = S.sessoes.find((x) => x.id === +d.id); if (s) comecarPersonalizado(s.nome, s); },
  aparelho: (d) => { S.atual.cardio.aparelho = d.k; salvar(); redesenharCardio(); },
  crono: (d) => {
    const i = +d.i, it = S.atual.itens[i];
    if (S.crono && S.crono.i === i) {
      // parar: grava os segundos na série da vez, marca como feita e começa o descanso
      const seg = Math.max(1, Math.round((Date.now() - S.crono.inicio) / 1000)), j = it.sets.findIndex((x) => !x.ok);
      S.crono = null;
      if (j < 0) { salvar(); redesenharItem(i); return; }
      it.sets[j].reps = String(seg); salvar(); acoes.ok({ i: String(i), s: String(j) });
    } else {
      const outro = S.crono ? S.crono.i : null;
      pararTimer(); S.crono = { i, inicio: Date.now(), bip: 0 }; salvar(); som(1, 660);
      if (outro != null) redesenharItem(outro);
      redesenharItem(i); tique();
    }
  },
  'aviso-fundo': () => { S.avisoFundo = S.avisoFundo === false; salvar(); if (S.avisoFundo) { pedirPermissaoAviso(); enviarDescanso(); } else avisarSW({ tipo: 'parar' }); desenhar(); },
  'permissao': () => { try { Notification.requestPermission().then(() => desenhar()); } catch (e) { /* sem notificações */ } },
  pular: (d) => {
    const i = +d.i, it = S.atual.itens[i];
    it.pulado = !it.pulado; if (S.crono && S.crono.i === i) S.crono = null;
    salvar(); redesenharItem(i);
    if (it.pulado && S.atual.itens.every((x) => x.pulado || x.sets.every((y) => y.ok))) { pararTimer(); aviso('Musculação concluída. Agora o cardio!'); }
  },
  'cardio-pular': () => { const c = S.atual.cardio; c.pulado = !c.pulado; if (c.pulado) c.ok = false; if (S.timer && S.timer.cardio) pararTimer(); salvar(); redesenharCardio(); },
  'hist-sem-cardio': (d) => {
    const s = S.sessoes.find((x) => x.id === +d.id);
    if (s && confirm('Tirar o cardio deste treino do histórico?')) { s.cardio.ok = false; s.cardio.pulado = true; salvar(); desenhar(); }
  },
  'medida-nova': () => folhaMedida(),
  'medida-salvar': () => {
    const data = $('#m-data').value ? new Date(`${$('#m-data').value}T12:00:00`).getTime() : Date.now();
    const r = { id: Date.now(), data };
    let algum = false;
    MEDIDAS.forEach(([k]) => { const v = num($(`#m-${k}`).value); if (v != null && v > 0) { r[k] = v; algum = true; } });
    if (!algum) { aviso('Preencha pelo menos uma medida.'); return; }
    S.medidas = [...(S.medidas || []), r].sort((x, y) => x.data - y.data); salvar(); fecharFolha(); desenhar(); aviso('Medidas registradas.');
  },
  'medida-apagar': (d) => {
    if (!confirm('Apagar este registro de medidas?')) return;
    S.medidas = (S.medidas || []).filter((x) => x.id !== +d.id); S.medidasApagadas = [...(S.medidasApagadas || []), +d.id]; salvar(); desenhar();
  },
  'leve-ok': (d) => { const it = S.atual.itens[+d.i]; it.leveOk = !it.leveOk; salvar(); redesenharItem(+d.i); },
  'aquec-ok': () => { S.atual.aquecOk = !S.atual.aquecOk; salvar(); desenhar(); },
  'reiniciar-fase': () => { if (confirm('Recomeçar a contagem das semanas? O próximo treino volta a ser a semana 1 (adaptação).')) { S.planoInicio = null; salvar(); desenhar(); } },
  'cardio-ok': () => { const c = S.atual.cardio; c.ok = !c.ok; if (S.timer && S.timer.cardio) pararTimer(); salvar(); redesenharCardio(); },
  'cardio-iniciar': () => {
    const c = S.atual.cardio, ap = APARELHOS[c.aparelho];
    if (c.tipo === 'intervalado') {
      const f = c.aquec ? [{ rot: `Aquecimento · ${ap}`, dur: c.aquec }] : []; for (let v = 1; v <= c.voltas; v++) { f.push({ rot: `Forte · ${ap}`, dur: c.forte, forte: true, volta: `${v}/${c.voltas}` }, { rot: `Leve · ${ap}`, dur: c.leve, volta: `${v}/${c.voltas}` }); }
      iniciarTimer(f, { cardio: true });
    } else iniciarTimer([{ rot: `Cardio · ${ap}`, dur: c.min * 60 }], { cardio: true });
    som(1, 880); redesenharCardio();
  },
  't-mais': () => { if (S.timer) { S.timer.fases[0].dur += 15; enviarDescanso(); salvar(); tique(); } },
  't-menos': () => { if (S.timer) { S.timer.fases[0].dur = Math.max(1, S.timer.fases[0].dur - 15); enviarDescanso(); salvar(); tique(); } },
  't-pular': () => { const c = S.timer && S.timer.cardio; pararTimer(); if (c) redesenharCardio(); },
  hist: (d) => { ui.hist = ui.hist === +d.id ? null : +d.id; desenhar(); },
  'apagar-sessao': (d) => { if (confirm('Apagar este treino do histórico? Não dá para desfazer.')) { S.sessoes = S.sessoes.filter((s) => s.id !== +d.id); S.apagadas = [...(S.apagadas || []), +d.id]; salvar(); desenhar(); } },
  editar: (d) => folhaEditar(+d.w, +d.i),
  'novo-ex': (d) => folhaEditar(+d.w, null),
  'editar-cardio': (d) => folhaCardio(+d.w),
  'salvar-ex': (d) => {
    const nome = $('#e-nome').value.trim(); if (!nome) { aviso('Dê um nome ao exercício.'); return; }
    const series = Math.min(10, Math.max(1, Math.round(num($('#e-series').value) || 3)));
    const repMin = Math.max(1, Math.round(num($('#e-min').value) || 8)), repMax = Math.max(repMin, Math.round(num($('#e-max').value) || repMin));
    const descanso = Math.min(600, Math.max(10, Math.round(num($('#e-desc').value) || 60)));
    const lista = treinos()[+d.w].exercicios;
    const leves = Math.min(2, Math.max(0, Math.round(num($('#e-leves').value) || 0)));
    if (d.i != null) Object.assign(lista[+d.i], { nome, series, repMin, repMax, descanso, leves });
    else lista.push({ ex: `meu-${Date.now()}`, nome, img: '', series, repMin, repMax, descanso, leves, dica: '' });
    salvar(); fecharFolha(); desenhar();
  },
  mover: (d) => { const l = treinos()[+d.w].exercicios, i = +d.i, j = i + +d.d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; salvar(); desenhar(); folhaEditar(+d.w, j); },
  'remover-ex': (d) => { const l = treinos()[+d.w].exercicios; if (confirm(`Remover "${l[+d.i].nome}" deste treino? O histórico dele continua guardado.`)) { l.splice(+d.i, 1); salvar(); fecharFolha(); desenhar(); } },
  'salvar-cardio': (d) => {
    const c = treinos()[+d.w].cardio, tipo = $('#c-tipo').value;
    c.tipo = tipo; c.min = Math.min(120, Math.max(1, Math.round(num($('#c-min').value) || 20)));
    if (tipo === 'intervalado') { c.voltas = Math.min(30, Math.max(1, Math.round(num($('#c-voltas').value) || 8))); c.forte = c.forte || 60; c.leve = c.leve || 60; c.aparelho = c.aparelho || 'eliptico'; if (c.aquec == null) c.aquec = 180; }
    salvar(); fecharFolha(); desenhar();
  },
  exportar: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
    a.download = `sansao-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    S.ultimoBackup = Date.now(); salvar(); desenhar();
    aviso('Backup salvo na pasta de downloads.');
  },
  'plano-original': () => { if (confirm('Voltar os 5 treinos ao plano original? Suas edições nos treinos serão perdidas (o histórico continua).')) { S.plano = clone(PLANO); S.proximo = 0; salvar(); desenhar(); } },
};

document.addEventListener('click', (ev) => {
  if (ev.target.id === 'sheet') { acoes.fechar(); return; }
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const f = acoes[b.dataset.a]; if (f) f(b.dataset);
});
document.addEventListener('input', (ev) => {
  const d = ev.target.dataset;
  if ((d.c === 'kg' || d.c === 'reps') && S.atual) {
    // o que for digitado numa série vale também para as séries seguintes ainda não concluídas
    const v = ev.target.value.trim();
    if (d.c === 'kg' && +d.s === 0) setTimeout(() => { const it = S.atual && S.atual.itens[+d.i], lv = $(`#lv-${d.i}`); if (it && lv) lv.textContent = textoLeve(it, qtdLeves(it, +d.i)); }, 0);
    S.atual.itens[+d.i].sets.forEach((x, k) => {
      if (k === +d.s) x[d.c] = v;
      else if (k > +d.s && !x.ok) { x[d.c] = v; const el = $(`input[data-c="${d.c}"][data-i="${d.i}"][data-s="${k}"]`); if (el) el.value = v; }
    });
    salvar();
  }
  else if (d.c === 'altura') { const v = num(ev.target.value); if (v && v > 100 && v < 250) { S.altura = v; salvar(); } }
  else if (d.c === 'nota') { const v = ev.target.value.trim(); if (v) S.notas[d.ex] = v; else delete S.notas[d.ex]; salvar(); }
});
document.addEventListener('change', (ev) => {
  const d = ev.target.dataset;
  if (d.c === 'evo') { ui.evo = ev.target.value; desenhar(); }
  else if (d.c === 'evo-corpo') { ui.evoCorpo = ev.target.value; desenhar(); }
  else if (d.c === 'importar' && ev.target.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const n = JSON.parse(r.result);
        if (!n || !n.plano || !Array.isArray(n.plano.treinos) || !Array.isArray(n.sessoes)) throw new Error('formato');
        if (confirm(`Restaurar este backup (${n.sessoes.length} treinos)? Os dados atuais deste celular serão substituídos.`)) { S = { ...estadoInicial(), ...n, planoVersao: n.planoVersao, atual: null, timer: null }; if (S.planoVersao !== PLANO.versao) { if (!(S.planoVersao >= 2)) S.proximo = 0; S.plano = clone(PLANO); S.planoVersao = PLANO.versao; } salvar(); desenhar(); aviso('Backup restaurado.'); }
      } catch (e) { aviso('Este arquivo não é um backup válido do Sansão.'); }
    };
    r.readAsText(ev.target.files[0]); ev.target.value = '';
  }
});
// seleciona o conteúdo ao tocar num campo de número, para digitar por cima
document.addEventListener('focusin', (ev) => { if (ev.target.matches('.set input')) ev.target.select(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* sem armazenamento persistente */ }
telaAcesa();
desenhar();
// junta com a cópia do IndexedDB (pode ter o que o localStorage perdeu quando o Android fechou o app)
lerCopia().then((c) => {
  if (!c) { gravarCopia(); return; }
  const antes = JSON.stringify([S.rev, S.sessoes.length, !!S.atual]);
  S = migrar(mesclar(S, c));
  if (JSON.stringify([S.rev, S.sessoes.length, !!S.atual]) !== antes) { localStorage.setItem(CHAVE, JSON.stringify(S)); revLida = S.rev || 0; desenhar(); }
  gravarCopia();
});
if (planoAtualizado) { salvar(); aviso(planoAtualizado === 'ordem' ? 'Treino atualizado: nova ordem de A a E.' : 'Treino atualizado.'); }
