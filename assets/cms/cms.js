// De Gouden Schaar · bewerkmodus
// Klik op een tekst of foto om ze aan te passen, druk op "Publiceren".
// De wijzigingen gaan als één commit naar de _data/-bestanden in GitHub;
// GitHub Pages zet ze daarna vanzelf online.
// De sleutel (GitHub-token) blijft alleen in deze browser bewaard, nooit in de repository.
import { parseDocument, isScalar, isCollection, isPair } from './yaml.min.js';

const script = document.getElementById('cms-script');
const REPO = script.dataset.repo;
const BRANCH = script.dataset.branch || 'main';
const HOME = script.dataset.home || '/';
const API = 'https://api.github.com';
const TOKEN_KEY = 'dgs-cms-token';
const IMG_DIR = 'assets/images/';
const MAX_IMG = 1800; // langste zijde van een opgeladen foto, in pixels

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const store = {
  get() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } },
  set(v) { try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {} },
  clear() { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} },
};

// ---------- 1. Inhoud op de pagina herkennen ----------

// "winkel:adres.straat" -> { file: 'winkel', path: ['adres', 'straat'] }
function parseKey(key) {
  const [file, rest = ''] = key.split(':');
  return { file, path: rest ? rest.split('.') : [] };
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// De waarde van een bewerkbaar element zoals ze in het databestand hoort.
function valueOf(el) {
  if (el.hasAttribute('data-cms-img')) return el.dataset.cmsValue || '';
  const text = norm(el.textContent);
  const empty = el.dataset.cmsEmpty;
  if (empty !== undefined && (text === '' || text.toLowerCase() === empty.toLowerCase())) return null;
  return text;
}

const lists = $$('[data-cms-list]');
const scalars = $$('[data-cms]').filter((el) => !el.closest('[data-cms-list]'));
const toggles = $$('[data-cms-toggle]');
const original = new Map(); // element -> beginwaarde
const templates = new Map(); // lijst -> lege kopie van een item
const pendingImages = new Map(); // "/assets/images/x.jpg" -> base64

function snapshot() {
  original.clear();
  scalars.forEach((el) => original.set(el, valueOf(el)));
  toggles.forEach((el) => original.set(el, !el.hidden));
  lists.forEach((list) => {
    itemsOf(list).forEach((item, i) => {
      item.dataset.cmsIndex = i;
      $$('[data-cms-field]', item).forEach((f) => original.set(f, valueOf(f)));
    });
  });
}
const itemsOf = (list) => $$('[data-cms-item]', list).filter((it) => it.parentElement.closest('[data-cms-list]') === list);

// ---------- 2. Bewerkbaar maken ----------

const plainOnly = (() => {
  const d = document.createElement('div');
  d.contentEditable = 'plaintext-only';
  return d.contentEditable === 'plaintext-only';
})();

function makeEditable(el) {
  if (el.hasAttribute('data-cms-img')) {
    el.title = 'Klik om deze foto te vervangen';
    el.addEventListener('click', (e) => { e.preventDefault(); pickImage((file) => replaceImage(el, file)); });
    return;
  }
  el.contentEditable = plainOnly ? 'plaintext-only' : 'true';
  el.spellcheck = true;
  el.title = 'Klik om te wijzigen';
}

document.addEventListener('keydown', (e) => {
  const el = e.target.closest && e.target.closest('[contenteditable]');
  if (el && e.key === 'Enter') { e.preventDefault(); el.blur(); }
  if (el && e.key === 'Escape') { el.blur(); }
});
document.addEventListener('paste', (e) => {
  const el = e.target.closest && e.target.closest('[contenteditable]');
  if (!el) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
  document.execCommand('insertText', false, text);
});
document.addEventListener('drop', (e) => { if (e.target.closest && e.target.closest('[contenteditable]')) e.preventDefault(); });

// Dezelfde gegevens (bv. het adres) staan soms op meerdere plaatsen: hou ze gelijk.
document.addEventListener('input', (e) => {
  const el = e.target.closest && e.target.closest('[data-cms]');
  if (el) $$(`[data-cms="${el.dataset.cms}"]`).forEach((o) => { if (o !== el) o.textContent = el.textContent; });
  refresh();
});
document.addEventListener('focusout', (e) => {
  const el = e.target;
  if (!el.dataset || el.dataset.cmsEmpty === undefined) return;
  const isEmpty = valueOf(el) === null;
  if (isEmpty) el.textContent = el.dataset.cmsEmpty;
  el.classList.toggle('closed', isEmpty);
  refresh();
});

// Links zouden de bewerkpagina verlaten: blokkeer ze, maar laat menulinks wel scrollen.
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.closest('.cms-bar, .cms-dialog')) return;
  e.preventDefault();
  const hash = a.getAttribute('href').split('#')[1];
  const target = hash && document.getElementById(hash);
  if (target && !a.closest('[contenteditable]')) target.scrollIntoView({ behavior: 'smooth' });
}, true);

// ---------- 3. Foto's ----------

function pickImage(cb) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => input.files[0] && cb(input.files[0]);
  input.click();
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'foto';

// Verkleint de foto in de browser (snel opladen) en geeft { path, url } terug.
async function prepareImage(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMG / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
  const path = '/' + IMG_DIR + slug(file.name) + '-' + Date.now().toString(36) + '.jpg';
  pendingImages.set(path, b64);
  return { path, url: URL.createObjectURL(blob) };
}

async function replaceImage(img, file) {
  try {
    img.classList.add('cms-busy');
    const { path, url } = await prepareImage(file);
    img.src = url;
    img.removeAttribute('srcset');
    img.dataset.cmsValue = path;
  } catch (e) {
    toast('Deze foto kon niet gelezen worden. Probeer een JPG- of PNG-bestand.', 'error');
  } finally {
    img.classList.remove('cms-busy');
    refresh();
  }
}

// ---------- 4. Lijsten: items toevoegen en verwijderen ----------

function addItemControls(item) {
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'cms-del';
  del.title = 'Verwijderen';
  del.setAttribute('aria-label', 'Verwijderen');
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); item.remove(); refresh(); });
  item.appendChild(del);
}

function setupList(list) {
  const items = itemsOf(list);
  items.forEach((item) => $$('[data-cms-field]', item).forEach(makeEditable));
  if (list.hasAttribute('data-cms-fixed') || !items.length) return;

  const tpl = items[0].cloneNode(true);
  delete tpl.dataset.cmsIndex;
  $$('[data-cms-field]', tpl).forEach((f) => { if (!f.hasAttribute('data-cms-img')) f.textContent = ''; });
  templates.set(list, tpl);
  items.forEach(addItemControls);

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'cms-add';
  add.textContent = '+ ' + (list.dataset.cmsAdd || 'Toevoegen');
  list.after(add);
  add.addEventListener('click', () => {
    const create = (img) => {
      const item = templates.get(list).cloneNode(true);
      $$('[data-cms-field]', item).forEach((f) => {
        if (f.hasAttribute('data-cms-img')) { f.src = img.url; f.dataset.cmsValue = img.path; }
        else f.dataset.cmsPh = 'Typ hier…';
        makeEditable(f);
      });
      addItemControls(item);
      (itemsOf(list).pop() || list.lastElementChild).after(item);
      const first = $('[contenteditable]', item);
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (first) first.focus();
      refresh();
    };
    if ($('[data-cms-img]', templates.get(list))) pickImage(async (file) => create(await prepareImage(file)));
    else create();
  });
}

// ---------- 5. Wijzigingen verzamelen ----------

// Geeft per bestand een lijst bewerkingen terug.
function collect() {
  const edits = {};
  const push = (file, op) => (edits[file] = edits[file] || []).push(op);

  const seen = new Set();
  scalars.forEach((el) => {
    const key = el.dataset.cms;
    if (seen.has(key)) return;
    seen.add(key);
    const v = valueOf(el);
    if (v !== original.get(el)) { const { file, path } = parseKey(key); push(file, { path, value: v }); }
  });
  toggles.forEach((el) => {
    if (!el.hidden !== original.get(el)) { const { file, path } = parseKey(el.dataset.cmsToggle); push(file, { path, value: !el.hidden }); }
  });
  lists.forEach((list) => {
    const { file, path } = parseKey(list.dataset.cmsList);
    const items = itemsOf(list);
    const sameShape = items.length === Number(list.dataset.cmsCount) &&
      items.every((it, i) => it.dataset.cmsIndex === String(i));
    if (sameShape) {
      items.forEach((it, i) => $$('[data-cms-field]', it).forEach((f) => {
        const v = valueOf(f);
        if (v !== original.get(f)) push(file, { path: [...path, i, f.dataset.cmsField], value: v });
      }));
    } else {
      push(file, {
        path,
        list: items.map((it) => ({
          from: it.dataset.cmsIndex === undefined ? null : Number(it.dataset.cmsIndex),
          fields: Object.fromEntries($$('[data-cms-field]', it).map((f) => [f.dataset.cmsField, valueOf(f)])),
        })),
      });
    }
  });
  return edits;
}

const countEdits = (edits) => Object.values(edits).reduce((n, ops) => n + ops.length, 0);

// ---------- 6. YAML aanpassen (commentaar en opmaak blijven behouden) ----------

// Waarden zoals "09:00", "1920" of "ja" moeten tussen aanhalingstekens, anders leest Jekyll ze als getal of ja/nee.
function quoteRisky(node) {
  if (isScalar(node)) {
    if (typeof node.value === 'string' && (!node.type || node.type === 'PLAIN') &&
        /^[\d\s:.,+\-]*$|^(y|n|yes|no|on|off|true|false|null|~)$|[:#]|^[\s&*!|>'"%@`[\]{}-]/i.test(node.value)) node.type = 'QUOTE_DOUBLE';
  } else if (isCollection(node)) {
    node.items.forEach((it) => quoteRisky(isPair(it) ? it.value : it));
  }
}

function applyEdits(text, ops) {
  const doc = parseDocument(text);
  ops.forEach((op) => {
    if (op.list) {
      // Bestaande items hergebruiken, zodat commentaar en opmaak blijven staan.
      const seq = op.path.length ? doc.getIn(op.path, true) : doc.contents;
      const oldItems = seq.items.slice();
      seq.items = op.list.map((it) => {
        const node = it.from !== null && oldItems[it.from] ? oldItems[it.from] : doc.createNode({});
        Object.entries(it.fields).forEach(([k, v]) => {
          if (!node.has(k) || node.get(k) !== v) { node.set(k, v); quoteRisky(node.get(k, true)); }
        });
        return node;
      });
      // Het commentaar bovenaan de lijst hoort bij het eerste item: hou het bovenaan.
      const top = oldItems[0] && oldItems[0].commentBefore;
      if (top) {
        seq.items.forEach((n) => { if (n.commentBefore === top) n.commentBefore = undefined; });
        if (seq.items[0]) seq.items[0].commentBefore = top;
      }
    } else {
      doc.setIn(op.path, op.value);
      quoteRisky(doc.getIn(op.path, true));
    }
  });
  return doc.toString({ lineWidth: 0, nullStr: '' });
}

// ---------- 7. GitHub ----------

async function gh(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + store.get(),
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    const err = new Error('GitHub ' + res.status);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

const decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

async function publish(edits) {
  const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
  const head = ref.object.sha;
  const commit = await gh(`/repos/${REPO}/git/commits/${head}`);
  const tree = [];

  for (const [file, ops] of Object.entries(edits)) {
    const path = `_data/${file}.yml`;
    const cur = await gh(`/repos/${REPO}/contents/${path}?ref=${head}`);
    const before = decode(cur.content);
    const after = applyEdits(before, ops);
    if (after !== before) tree.push({ path, mode: '100644', type: 'blob', content: after });
  }

  // Alleen foto's die na het bewerken nog gebruikt worden, opladen.
  const used = new Set($$('[data-cms-img]').map((img) => img.dataset.cmsValue));
  for (const [p, b64] of pendingImages) {
    if (!used.has(p)) continue;
    const blob = await gh(`/repos/${REPO}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: b64, encoding: 'base64' }) });
    tree.push({ path: p.replace(/^\//, ''), mode: '100644', type: 'blob', sha: blob.sha });
  }
  if (!tree.length) return false;

  const newTree = await gh(`/repos/${REPO}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
  const newCommit = await gh(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Website aangepast via de bewerkmodus', tree: newTree.sha, parents: [head] }),
  });
  await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });
  return true;
}

// ---------- 8. Werkbalk, aanmelden en meldingen ----------

const bar = document.createElement('div');
bar.className = 'cms-bar';
bar.innerHTML = `
  <div class="cms-bar-in">
    <strong class="cms-title">✂ Bewerkmodus</strong>
    <span class="cms-hint">Klik op een tekst of foto om ze te wijzigen.</span>
    ${toggles.length ? '<label class="cms-check"><input type="checkbox" id="cms-notice"> Mededeling bovenaan tonen</label>' : ''}
    <span class="cms-count" aria-live="polite"></span>
    <button type="button" class="cms-btn cms-ghost" id="cms-undo">Ongedaan maken</button>
    <button type="button" class="cms-btn" id="cms-publish" disabled>Publiceren</button>
    <details class="cms-more"><summary aria-label="Meer">⋯</summary>
      <div><a href="${HOME}" target="_blank" rel="noopener">Bekijk de echte website ↗</a>
      <button type="button" id="cms-logout">Afmelden op dit toestel</button></div>
    </details>
  </div>`;
document.body.appendChild(bar);
document.body.classList.add('cms-on');

const noticeBox = $('#cms-notice');
if (noticeBox) {
  noticeBox.checked = !toggles[0].hidden;
  noticeBox.addEventListener('change', () => { toggles.forEach((t) => (t.hidden = !noticeBox.checked)); refresh(); });
}

let dirty = 0;
function refresh() {
  dirty = countEdits(collect());
  $('.cms-count').textContent = dirty ? (dirty === 1 ? '1 wijziging' : dirty + ' wijzigingen') : '';
  $('#cms-publish').disabled = !dirty;
  $$('[data-cms], [data-cms-field]').forEach((el) => {
    el.classList.toggle('cms-changed', original.has(el) && valueOf(el) !== original.get(el));
  });
}

window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

$('#cms-undo').addEventListener('click', () => { if (dirty) { dirty = 0; location.reload(); } });
$('#cms-logout').addEventListener('click', () => { store.clear(); toast('Afgemeld. Bij de volgende keer publiceren vragen we je sleutel opnieuw.'); });

let toastTimer;
function toast(msg, kind = 'ok') {
  let t = $('.cms-toast');
  if (!t) { t = document.createElement('div'); t.className = 'cms-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  t.dataset.kind = kind;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), kind === 'error' ? 9000 : 6000);
}

function askToken(reason) {
  return new Promise((resolve) => {
    const dlg = document.createElement('div');
    dlg.className = 'cms-dialog';
    dlg.innerHTML = `
      <form class="cms-card">
        <h2>Aanmelden om te publiceren</h2>
        ${reason ? `<p class="cms-err">${reason}</p>` : ''}
        <p>Plak hier je sleutel. Dit moet maar één keer per toestel: daarna onthoudt deze browser hem.</p>
        <input type="password" autocomplete="off" placeholder="github_pat_…" required>
        <details><summary>Ik heb nog geen sleutel</summary>
          <ol>
            <li>Meld je aan op <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → nieuwe sleutel</a>.</li>
            <li>Geef een naam (bv. "Website bewerken") en kies een vervaldatum.</li>
            <li>Bij <em>Repository access</em>: kies <em>Only select repositories</em> → <code>${REPO}</code>.</li>
            <li>Bij <em>Permissions → Contents</em>: kies <em>Read and write</em>.</li>
            <li>Klik <em>Generate token</em> en plak de sleutel hierboven.</li>
          </ol>
        </details>
        <div class="cms-row"><button type="button" class="cms-btn cms-ghost" data-x>Annuleren</button><button class="cms-btn">Aanmelden</button></div>
      </form>`;
    document.body.appendChild(dlg);
    const input = $('input', dlg);
    input.focus();
    const done = (v) => { dlg.remove(); resolve(v); };
    $('[data-x]', dlg).onclick = () => done(null);
    $('form', dlg).onsubmit = (e) => { e.preventDefault(); store.set(input.value.trim()); done(input.value.trim()); };
  });
}

$('#cms-publish').addEventListener('click', async () => {
  const btn = $('#cms-publish');
  let reason = '';
  for (;;) {
    if (!store.get() && !(await askToken(reason))) return;
    btn.disabled = true;
    btn.textContent = 'Bezig…';
    try {
      await publish(collect());
      pendingImages.clear();
      lists.forEach((l) => (l.dataset.cmsCount = itemsOf(l).length));
      snapshot();
      refresh();
      toast('Gepubliceerd! Binnen 1 à 2 minuten staat het op de website.');
      return;
    } catch (e) {
      if (e.status === 401) { store.clear(); reason = 'Deze sleutel werkt niet (meer). Plak een geldige sleutel.'; continue; }
      if (e.status === 403 || e.status === 404) { store.clear(); reason = 'Deze sleutel mag de website niet wijzigen. Controleer stap 3 en 4 hieronder.'; continue; }
      if (e.status === 409 || e.status === 422) toast('Iemand anders paste de website net aan. Probeer opnieuw.', 'error');
      else toast('Publiceren lukte niet. Controleer je internetverbinding en probeer opnieuw.', 'error');
      return;
    } finally {
      btn.textContent = 'Publiceren';
      btn.disabled = !dirty;
    }
  }
});

// ---------- Start ----------
scalars.forEach(makeEditable);
lists.forEach((l) => { l.dataset.cmsCount = itemsOf(l).length; setupList(l); });
snapshot();
refresh();
