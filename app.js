/* ============================================================
   PIXEL app.js v2
   - Directories collapsed until search/filter active
   - "View All" opens full dataset in new tab
   - Language toggle: AR (RTL) <-> EN (LTR)
   ============================================================ */
'use strict';

// ── CSV parser ─────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const cols = [];
    let inQ = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cols.push(cur.trim());
    return cols;
  });
}

// ── Populate a <select> with unique sorted values ──────────────────────────
function populateSelect(selectEl, values, firstOpt) {
  // Remove existing dynamic options (keep first)
  while (selectEl.options.length > 1) selectEl.remove(1);
  const sorted = [...new Set(values)].filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'ar', { sensitivity: 'base' }));
  sorted.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

// ── Generate "View All" standalone HTML page ───────────────────────────────
function buildViewAllPage(title, headers, rows) {
  const thead = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
  const tbody = rows.map(r =>
    '<tr>' + r.cols.map((c, i) =>
      i === r.cols.length - 1
        ? `<td><a href="tel:${c}" dir="ltr">${c}</a></td>`
        : `<td>${c}</td>`
    ).join('') + '</tr>'
  ).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — بيكسل | Pixel</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Tajawal',Arial,sans-serif;font-size:.95rem;color:#0f0f0f;background:#fff;padding:2rem}
h1{font-size:1.6rem;margin-bottom:1.5rem;padding-bottom:.5rem;border-bottom:2px solid #cc0000}
.count{font-size:.82rem;color:#5a5a56;margin-bottom:1rem}
.wrapper{overflow-x:auto;border:1px solid #d8d8d5;border-radius:2px}
table{width:100%;border-collapse:collapse;font-size:.88rem}
thead{background:#0f0f0f;color:#fff}
th,td{padding:.65em 1em;text-align:right}
th{font-weight:500;white-space:nowrap}
tbody tr:nth-child(even){background:#f3f3f1}
td a{color:#0f0f0f;text-decoration:none;direction:ltr;display:inline-block}
td a:hover{color:#cc0000}
</style>
</head>
<body>
<h1>${title}</h1>
<p class="count">${rows.length} سجل</p>
<div class="wrapper">
<table>
<thead>${thead}</thead>
<tbody>${tbody}</tbody>
</table>
</div>
</body>
</html>`;
}

// ── Directory class ─────────────────────────────────────────────────────────
class Directory {
  constructor(cfg) {
    this.url        = cfg.url;
    this.tableId    = cfg.tableId;
    this.wrapId     = cfg.wrapId;
    this.tbodyId    = cfg.tbodyId;
    this.statusId   = cfg.statusId;
    this.countId    = cfg.countId;
    this.searchId   = cfg.searchId;
    this.collapsedId = cfg.collapsedId;
    this.viewAllId  = cfg.viewAllId;
    this.filters    = cfg.filters;     // [{selectId, colIndex}]
    this.colIndices = cfg.colIndices;  // indices in raw CSV row (after header)
    this.phoneIdx   = cfg.phoneIdx;    // index within colIndices
    this.headers    = cfg.headers;     // display header names
    this.title      = cfg.title;

    this.rawData = [];
    this.sortCol = -1;
    this.sortDir = 'asc';

    this.tableEl     = document.getElementById(this.tableId);
    this.wrapEl      = document.getElementById(this.wrapId);
    this.tbodyEl     = document.getElementById(this.tbodyId);
    this.statusEl    = document.getElementById(this.statusId);
    this.countEl     = document.getElementById(this.countId);
    this.searchEl    = document.getElementById(this.searchId);
    this.collapsedEl = document.getElementById(this.collapsedId);
    this.viewAllEl   = document.getElementById(this.viewAllId);

    this._active = false; // whether search/filter has been initiated
  }

  isQueryActive() {
    const q = this.searchEl ? this.searchEl.value.trim() : '';
    if (q) return true;
    return this.filters.some(f => {
      const sel = document.getElementById(f.selectId);
      return sel && sel.value !== '';
    });
  }

  async init() {
    // Show spinner while loading
    this.statusEl.classList.remove('hidden');

    try {
      const res = await fetch(this.url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const rows = parseCSV(text);
      // Skip header (row 0), map colIndices (skip col 0 = Timestamp)
      this.rawData = rows.slice(1)
        .map(row => ({ cols: this.colIndices.map(i => (row[i] || '').trim()) }))
        .filter(r => r.cols.some(c => c));

      this.populateFilters();
      this.updateViewAll();

      // Done loading
      this.statusEl.classList.add('hidden');
      // Start collapsed
      this.collapsedEl.hidden = false;
      this.wrapEl.hidden = true;
      this.countEl.hidden = true;

      this.bindEvents();
    } catch (err) {
      this.statusEl.innerHTML = '⚠ تعذّر تحميل البيانات.';
      console.error(this.tableId, err);
    }
  }

  populateFilters() {
    this.filters.forEach(f => {
      const sel = document.getElementById(f.selectId);
      if (!sel) return;
      const vals = this.rawData.map(r => r.cols[f.colIndex]);
      populateSelect(sel, vals);
    });
  }

  updateViewAll() {
    if (!this.viewAllEl) return;
    this.viewAllEl.addEventListener('click', e => {
      e.preventDefault();
      const html = buildViewAllPage(this.title, this.headers, this.rawData);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, '_blank');
      // Revoke after tab loaded
      if (win) setTimeout(() => URL.revokeObjectURL(url), 30000);
    });
  }

  getFiltered() {
    const q = (this.searchEl ? this.searchEl.value : '').trim().toLowerCase();
    const filterVals = this.filters.map(f => {
      const sel = document.getElementById(f.selectId);
      return { colIndex: f.colIndex, val: sel ? sel.value : '' };
    });

    let data = this.rawData;

    if (q) {
      data = data.filter(r => r.cols.some(c => c.toLowerCase().includes(q)));
    }
    filterVals.forEach(fv => {
      if (fv.val) data = data.filter(r => r.cols[fv.colIndex] === fv.val);
    });
    if (this.sortCol >= 0) {
      data = [...data].sort((a, b) => {
        const x = a.cols[this.sortCol] || '';
        const y = b.cols[this.sortCol] || '';
        const cmp = x.localeCompare(y, 'ar', { sensitivity: 'base' });
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }

  render() {
    const active = this.isQueryActive();

    if (!active) {
      // Collapse: hide table, show hint
      this.wrapEl.hidden = true;
      this.countEl.hidden = true;
      this.collapsedEl.hidden = false;
      return;
    }

    // Show results
    this.collapsedEl.hidden = true;
    this.wrapEl.hidden = false;
    this.countEl.hidden = false;

    const data = this.getFiltered();
    this.tbodyEl.innerHTML = '';

    if (data.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = this.colIndices.length;
      td.textContent = 'لا توجد نتائج مطابقة.';
      td.style.cssText = 'text-align:center;padding:2rem;color:#888';
      tr.appendChild(td);
      this.tbodyEl.appendChild(tr);
    } else {
      data.forEach(row => {
        const tr = document.createElement('tr');
        row.cols.forEach((val, i) => {
          const td = document.createElement('td');
          if (i === this.phoneIdx) {
            const a = document.createElement('a');
            a.href = 'tel:+218' + val.replace(/^0/, '');
            a.textContent = val;
            a.dir = 'ltr';
            td.appendChild(a);
          } else {
            td.textContent = val;
          }
          tr.appendChild(td);
        });
        this.tbodyEl.appendChild(tr);
      });
    }

    const lang = document.documentElement.dataset.lang || 'ar';
    const ofWord = lang === 'ar' ? 'من' : 'of';
    const recWord = lang === 'ar' ? 'سجل' : 'records';
    this.countEl.textContent = `${data.length} ${ofWord} ${this.rawData.length} ${recWord}`;
  }

  bindEvents() {
    const onChange = () => this.render();
    if (this.searchEl) this.searchEl.addEventListener('input', onChange);
    this.filters.forEach(f => {
      const sel = document.getElementById(f.selectId);
      if (sel) sel.addEventListener('change', onChange);
    });
    // Sort
    const ths = this.tableEl ? this.tableEl.querySelectorAll('th.sortable') : [];
    ths.forEach(th => {
      th.addEventListener('click', () => {
        const col = parseInt(th.dataset.col, 10);
        if (this.sortCol === col) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortCol = col;
          this.sortDir = 'asc';
        }
        ths.forEach(t => t.setAttribute('aria-sort', 'none'));
        th.setAttribute('aria-sort', this.sortDir === 'asc' ? 'ascending' : 'descending');
        this.render();
      });
    });
  }
}

// ── Language toggle ─────────────────────────────────────────────────────────
function initLangToggle() {
  const btn  = document.getElementById('lang-toggle');
  const html = document.documentElement;
  if (!btn) return;

  function applyLang(lang) {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';

    // Swap all data-ar / data-en text nodes
    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
      const val = el.getAttribute('data-' + lang);
      if (!val) return;
      // Handle innerHTML if it contains <br>
      if (val.includes('<br>') || val.includes('<br/>')) {
        el.innerHTML = val;
      } else {
        // Only update textContent for non-input elements
        if (el.tagName !== 'INPUT') {
          el.textContent = val;
        }
      }
    });

    // Search placeholder
    document.querySelectorAll('[data-placeholder-' + lang + ']').forEach(el => {
      el.placeholder = el.getAttribute('data-placeholder-' + lang);
      el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });

    // Update table th text nodes (they also have data-ar/data-en)
    document.querySelectorAll('th[data-ar][data-en]').forEach(th => {
      const base = th.getAttribute('data-' + lang);
      // Preserve sort indicator — strip trailing ↑/↓ and reset
      const sort = th.getAttribute('aria-sort');
      let indicator = '';
      if (sort === 'ascending') indicator = ' ↑';
      if (sort === 'descending') indicator = ' ↓';
      th.textContent = base + indicator;
    });

    localStorage.setItem('px-lang', lang);
  }

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-lang') || 'ar';
    applyLang(current === 'ar' ? 'en' : 'ar');
  });

  // Restore from storage
  const saved = localStorage.getItem('px-lang');
  if (saved && saved !== 'ar') applyLang(saved);
}

// ── Mobile nav ──────────────────────────────────────────────────────────────
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.hidden = open;
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); });
  });
}

// ── Footer year ─────────────────────────────────────────────────────────────
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Directory instances ─────────────────────────────────────────────────────
const bizDir = new Directory({
  url: 'https://docs.google.com/spreadsheets/d/1qquOnU1WrlnS3vRSX0WTmKjmWDEonSNsG8SMSAbuXTU/export?format=csv&gid=1430807274',
  tableId:     'biz-table',
  wrapId:      'biz-table-wrapper',
  tbodyId:     'biz-tbody',
  statusId:    'biz-status',
  countId:     'biz-count',
  searchId:    'biz-search',
  collapsedId: 'biz-collapsed',
  viewAllId:   'biz-viewall',
  title:       'دليل الأنشطة التجارية',
  headers:     ['إسم النشاط', 'نوع النشاط', 'المدينة', 'رقم الهاتف'],
  // CSV: col0=Timestamp, col1=إسم النشاط, col2=نوع النشاط, col3=المدينة, col4=رقم الهاتف
  colIndices: [1, 2, 3, 4],
  phoneIdx:   3,
  filters: [
    { selectId: 'biz-filter-city', colIndex: 2 },
    { selectId: 'biz-filter-type', colIndex: 1 },
  ],
});

const prosDir = new Directory({
  url: 'https://docs.google.com/spreadsheets/d/10P9zO00lAUgwrDpD5uxhFJFI8NNvP422zmw-gyPN-_M/export?format=csv&gid=607347722',
  tableId:     'pros-table',
  wrapId:      'pros-table-wrapper',
  tbodyId:     'pros-tbody',
  statusId:    'pros-status',
  countId:     'pros-count',
  searchId:    'pros-search',
  collapsedId: 'pros-collapsed',
  viewAllId:   'pros-viewall',
  title:       'دليل أصحاب المهن',
  headers:     ['الإسم', 'الحرفة أو المهنة', 'المدينة', 'رقم الهاتف'],
  // CSV: col0=Timestamp, col1=الإسم, col2=الحرفة, col3=المدينة, col4=رقم الهاتف
  colIndices: [1, 2, 3, 4],
  phoneIdx:   3,
  filters: [
    { selectId: 'pros-filter-city',  colIndex: 2 },
    { selectId: 'pros-filter-craft', colIndex: 1 },
  ],
});

// ── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initYear();
  initLangToggle();
  bizDir.init();
  prosDir.init();
});
