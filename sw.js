const VERSAO = 'sansao-v6';
const ARQUIVOS = ['./', 'index.html', 'styles.css', 'data.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'fonts/fraunces-italico.woff2',
  'fonts/fraunces.woff2',
  'fonts/plexmono-400.woff2',
  'fonts/plexmono-500.woff2',
  'fonts/plexmono-600.woff2',
  'img/abdominal-infra-0.jpg',
  'img/abdominal-infra-1.jpg',
  'img/abdominal-maquina-0.jpg',
  'img/abdominal-maquina-1.jpg',
  'img/abdominal-polia-0.jpg',
  'img/abdominal-polia-1.jpg',
  'img/abdominal-supra-0.jpg',
  'img/abdominal-supra-1.jpg',
  'img/abdutora-0.jpg',
  'img/abdutora-1.jpg',
  'img/afundo-halteres-0.jpg',
  'img/afundo-halteres-1.jpg',
  'img/barra-fixa-0.jpg',
  'img/barra-fixa-1.jpg',
  'img/crossover-0.jpg',
  'img/crossover-1.jpg',
  'img/crucifixo-halteres-0.jpg',
  'img/crucifixo-halteres-1.jpg',
  'img/crucifixo-inclinado-halteres-0.jpg',
  'img/crucifixo-inclinado-halteres-1.jpg',
  'img/crucifixo-inverso-0.jpg',
  'img/crucifixo-inverso-1.jpg',
  'img/crucifixo-inverso-halteres-0.jpg',
  'img/crucifixo-inverso-halteres-1.jpg',
  'img/crucifixo-inverso-polia-0.jpg',
  'img/crucifixo-inverso-polia-1.jpg',
  'img/crucifixo-maquina-0.jpg',
  'img/crucifixo-maquina-1.jpg',
  'img/desenvolvimento-arnold-0.jpg',
  'img/desenvolvimento-arnold-1.jpg',
  'img/desenvolvimento-halteres-0.jpg',
  'img/desenvolvimento-halteres-1.jpg',
  'img/desenvolvimento-maquina-0.jpg',
  'img/desenvolvimento-maquina-1.jpg',
  'img/desenvolvimento-smith-0.jpg',
  'img/desenvolvimento-smith-1.jpg',
  'img/elevacao-lateral-0.jpg',
  'img/elevacao-lateral-1.jpg',
  'img/elevacao-lateral-polia-0.jpg',
  'img/elevacao-lateral-polia-1.jpg',
  'img/elevacao-lateral-sentado-0.jpg',
  'img/elevacao-lateral-sentado-1.jpg',
  'img/elevacao-pelvica-0.jpg',
  'img/elevacao-pelvica-1.jpg',
  'img/elevacao-pernas-0.jpg',
  'img/elevacao-pernas-1.jpg',
  'img/eliptico-0.jpg',
  'img/eliptico-1.jpg',
  'img/esteira-0.jpg',
  'img/esteira-1.jpg',
  'img/extensora-0.jpg',
  'img/extensora-1.jpg',
  'img/extensora-unilateral-0.jpg',
  'img/extensora-unilateral-1.jpg',
  'img/face-pull-0.jpg',
  'img/face-pull-1.jpg',
  'img/flexora-0.jpg',
  'img/flexora-1.jpg',
  'img/flexora-em-pe-0.jpg',
  'img/flexora-em-pe-1.jpg',
  'img/gemeos-halter-0.jpg',
  'img/gemeos-halter-1.jpg',
  'img/gemeos-leg-press-0.jpg',
  'img/gemeos-leg-press-1.jpg',
  'img/gemeos-pe-0.jpg',
  'img/gemeos-pe-1.jpg',
  'img/gemeos-sentado-0.jpg',
  'img/gemeos-sentado-1.jpg',
  'img/gemeos-smith-0.jpg',
  'img/gemeos-smith-1.jpg',
  'img/gluteo-polia-0.jpg',
  'img/gluteo-polia-1.jpg',
  'img/hiperextensao-0.jpg',
  'img/hiperextensao-1.jpg',
  'img/leg-press-0.jpg',
  'img/leg-press-1.jpg',
  'img/mesa-flexora-0.jpg',
  'img/mesa-flexora-1.jpg',
  'img/ponte-gluteo-0.jpg',
  'img/ponte-gluteo-1.jpg',
  'img/ponte-unilateral-0.jpg',
  'img/ponte-unilateral-1.jpg',
  'img/prancha-0.jpg',
  'img/prancha-1.jpg',
  'img/prancha-lateral-0.jpg',
  'img/prancha-lateral-1.jpg',
  'img/pull-through-0.jpg',
  'img/pull-through-1.jpg',
  'img/puxada-frente-0.jpg',
  'img/puxada-frente-1.jpg',
  'img/puxada-neutra-0.jpg',
  'img/puxada-neutra-1.jpg',
  'img/puxada-supinada-0.jpg',
  'img/puxada-supinada-1.jpg',
  'img/remada-baixa-0.jpg',
  'img/remada-baixa-1.jpg',
  'img/remada-cavalinho-0.jpg',
  'img/remada-cavalinho-1.jpg',
  'img/remada-curvada-0.jpg',
  'img/remada-curvada-1.jpg',
  'img/remada-maquina-0.jpg',
  'img/remada-maquina-1.jpg',
  'img/rosca-45-0.jpg',
  'img/rosca-45-1.jpg',
  'img/rosca-concentrada-0.jpg',
  'img/rosca-concentrada-1.jpg',
  'img/rosca-direta-halteres-0.jpg',
  'img/rosca-direta-halteres-1.jpg',
  'img/rosca-martelo-0.jpg',
  'img/rosca-martelo-1.jpg',
  'img/rosca-polia-0.jpg',
  'img/rosca-polia-1.jpg',
  'img/rosca-scott-0.jpg',
  'img/rosca-scott-1.jpg',
  'img/rosca-scott-maquina-0.jpg',
  'img/rosca-scott-maquina-1.jpg',
  'img/rosca-w-0.jpg',
  'img/rosca-w-1.jpg',
  'img/serrote-0.jpg',
  'img/serrote-1.jpg',
  'img/step-up-0.jpg',
  'img/step-up-1.jpg',
  'img/stiff-0.jpg',
  'img/stiff-1.jpg',
  'img/stiff-barra-0.jpg',
  'img/stiff-barra-1.jpg',
  'img/superman-0.jpg',
  'img/superman-1.jpg',
  'img/supino-articulado-0.jpg',
  'img/supino-articulado-1.jpg',
  'img/supino-inclinado-articulado-0.jpg',
  'img/supino-inclinado-articulado-1.jpg',
  'img/supino-inclinado-barra-0.jpg',
  'img/supino-inclinado-barra-1.jpg',
  'img/supino-inclinado-halteres-0.jpg',
  'img/supino-inclinado-halteres-1.jpg',
  'img/supino-inclinado-smith-0.jpg',
  'img/supino-inclinado-smith-1.jpg',
  'img/supino-maquina-0.jpg',
  'img/supino-maquina-1.jpg',
  'img/supino-reto-barra-0.jpg',
  'img/supino-reto-barra-1.jpg',
  'img/supino-reto-halteres-0.jpg',
  'img/supino-reto-halteres-1.jpg',
  'img/supino-smith-0.jpg',
  'img/supino-smith-1.jpg',
  'img/terra-romeno-0.jpg',
  'img/terra-romeno-1.jpg',
  'img/triceps-banco-0.jpg',
  'img/triceps-banco-1.jpg',
  'img/triceps-barra-polia-0.jpg',
  'img/triceps-barra-polia-1.jpg',
  'img/triceps-corda-0.jpg',
  'img/triceps-corda-1.jpg',
  'img/triceps-frances-0.jpg',
  'img/triceps-frances-1.jpg',
  'img/triceps-frances-polia-0.jpg',
  'img/triceps-frances-polia-1.jpg',
  'img/triceps-maquina-0.jpg',
  'img/triceps-maquina-1.jpg',
  'img/triceps-maquina-extensao-0.jpg',
  'img/triceps-maquina-extensao-1.jpg',
  'img/triceps-testa-0.jpg',
  'img/triceps-testa-1.jpg',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
/* ---------- Aviso de descanso fora da tela ----------
   O app manda o fim do descanso. Enquanto o Sansão não estiver na tela, aqui fica uma notificação silenciosa com o
   tempo que falta (atualizada a cada 5 s); no fim, ela vira um aviso com som de notificação e vibração.
   O Chrome encerra o service worker depois de uns 5 minutos; para tempos maiores (cardio), mostra só a hora do fim. */
let descanso = null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const relogio = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
async function algumVisivel() { const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); return cs.some((c) => c.visibilityState === 'visible'); }
async function fecharAviso() { const ns = await self.registration.getNotifications({ tag: 'descanso' }); ns.forEach((n) => n.close()); }
function mostrar(titulo, corpo, alerta) {
  const op = { tag: 'descanso', body: corpo, icon: 'icon-192.png', badge: 'icon-192.png', renotify: !!alerta, silent: !alerta };
  if (alerta) op.vibrate = [300, 150, 300, 150, 300];
  return self.registration.showNotification(titulo, op).catch(() => {});
}
async function vigiar(id) {
  const limite = Date.now() + 4.5 * 60e3;
  let faseAnterior = -1;
  while (descanso && descanso.id === id) {
    const d = descanso, agora = Date.now();
    if (agora >= d.fim - 150) { descanso = null; if (!(await algumVisivel())) await mostrar(d.final.titulo, d.final.corpo, true); return; }
    if (agora > limite) { if (!(await algumVisivel())) await mostrar(`Cardio · termina às ${d.hora}`, d.corpo, false); return; }
    let k = d.fases.findIndex((f) => agora < f.fim - 150); if (k < 0) k = d.fases.length - 1;
    const f = d.fases[k];
    if (await algumVisivel()) await fecharAviso();
    else await mostrar(`${f.rot} · falta ${relogio(f.fim - agora)}`, d.corpo, faseAnterior !== -1 && k !== faseAnterior);
    faseAnterior = k;
    const ateTroca = f.fim - Date.now();
    await espera(Math.max(200, Math.min(5000, ateTroca > 5500 ? 5000 : ateTroca)));
  }
}
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.tipo === 'descanso') { descanso = d; e.waitUntil(vigiar(d.id)); }
  else if (d.tipo === 'parar') { descanso = null; e.waitUntil(fecharAviso()); }
});
// tocar na notificação de fim de descanso traz o Sansão para a frente
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => (cs.length ? cs[0].focus() : self.clients.openWindow('./'))));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/img/') || u.pathname.includes('/fonts/') || u.pathname.endsWith('.png')) {
    // fotos: primeiro o que já está guardado
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  } else {
    // páginas e código: tenta a versão nova; sem internet, usa a guardada
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSAO).then((k) => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  }
});
