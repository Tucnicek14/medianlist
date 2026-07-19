let mainLevels = [];
let legacyLevels = [];

// generic loader: fetches a JSON file into an array and renders it into a given list element
async function loadList(url, targetArray, listElId, countElId, onError) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.sort((a, b) => a.rank - b.rank); // always trust "rank" field, not array order
    targetArray.push(...data);
    render(targetArray, listElId, countElId, targetArray === mainLevels ? 'level' : 'advanced-level');
  } catch (err) {
    document.getElementById(listElId).innerHTML =
      `<p class="empty">Couldn't load ${url} (${err.message}). If you're opening this file directly, run a local server instead — see the README note.</p>`;
  }
}

function render(data, listElId, countElId, hashPrefix) {
  const list = document.getElementById(listElId);
  const count = document.getElementById(countElId);
  count.textContent = `${data.length} level${data.length === 1 ? '' : 's'}`;

  if (data.length === 0) {
    list.innerHTML = `<p class="empty">No levels match your search.</p>`;
    return;
  }

  list.innerHTML = data.map(lvl => `
    <article class="row" data-id="${lvl.rank}">
      <div class="rank">#${lvl.rank}</div>
      <div class="info">
        <h3>${escapeHtml(lvl.name)}</h3>
        <p>by ${escapeHtml(lvl.creator)} · verified by ${escapeHtml(lvl.verifier)}</p>
      </div>
      <div class="meta">
        <span class="diff-tag">${escapeHtml(lvl.difficulty)}</span>
        <span class="points">${lvl.points} pts</span>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('.row').forEach(row => {
    row.addEventListener('click', () => {
      window.location.hash = `${hashPrefix}-${row.dataset.id}`;
    });
  });
}

function showDetail(rank, source) {
  const pool = source === 'advanced' ? advancedLevels : mainLevels;
  const lvl = pool.find(l => String(l.rank) === String(rank));
  const body = document.getElementById('detail-body');
  const backBtn = document.getElementById('back-btn');

  // back button should return to whichever list this level came from
  backBtn.dataset.returnTo = source === 'advanced' ? 'advanced' : 'main';

  if (!lvl) {
    body.innerHTML = `<p class="detail-not-found">Level not found.</p>`;
  } else {
    body.innerHTML = `
      <div class="detail-card">
        <p class="detail-rank">#${lvl.rank}${source === 'advanced' ? ' · Advanced List' : ''}</p>
        <h2>${escapeHtml(lvl.name)}</h2>
        <div class="detail-meta">
          <span>Creator: ${escapeHtml(lvl.creator)}</span>
          <span>Verifier: ${escapeHtml(lvl.verifier)}</span>
          <span>Level ID: ${lvl.levelId}</span>
          <span>${lvl.points} points</span>
          <span class="diff-tag">${escapeHtml(lvl.difficulty)}</span>
        </div>
        <p class="description">${escapeHtml(lvl.description || '')}</p>
        ${lvl.videoId ? `<iframe src="https://www.youtube.com/embed/${lvl.videoId}" allowfullscreen title="Verification video for ${escapeHtml(lvl.name)}"></iframe>` : ''}
      </div>
    `;
  }

  setView('detail');
}

function setView(view) {
  document.getElementById('main-view').hidden = view !== 'main';
  document.getElementById('advanced-view').hidden = view !== 'legacy';
  document.getElementById('about-view').hidden = view !== 'about';
  document.getElementById('detail-view').hidden = view !== 'detail';

  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('is-active'));
  const navBtn = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (navBtn) navBtn.classList.add('is-active');
}

function handleRoute() {
  const hash = window.location.hash; // "#level-3" or "#legacy-level-2" or "" or "#legacy" or "#about"
  const advancedLevelMatch = hash.match(/^#advanced-level-(.+)$/);
  const levelMatch = hash.match(/^#level-(.+)$/);

  if (advancedLevelMatch) {
    showDetail(advancedLevelMatch[1], 'legacy');
  } else if (levelMatch) {
    showDetail(levelMatch[1], 'main');
  } else if (hash === '#advanced') {
    setView('advanced');
  } else if (hash === '#about') {
    setView('about');
  } else {
    setView('main');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// search — main list
document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = mainLevels.filter(l =>
    l.name.toLowerCase().includes(q) || l.creator.toLowerCase().includes(q)
  );
  render(filtered, 'list', 'count', 'level');
});

// search — legacy list
document.getElementById('advancedsearch').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = advancedLevels.filter(l =>
    l.name.toLowerCase().includes(q) || l.creator.toLowerCase().includes(q)
  );
  render(filtered, 'advanced-list', 'advanced-count', 'advanced-level');
});

// back button returns to whichever list the level was opened from
document.getElementById('back-btn').addEventListener('click', () => {
  const returnTo = document.getElementById('back-btn').dataset.returnTo;
  window.location.hash = returnTo === 'advanced' ? 'advanced' : '';
});

// nav tabs
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    window.location.hash = view === 'main' ? '' : view;
    setView(view);
  });
});

window.addEventListener('hashchange', handleRoute);

loadList('levels.json', mainLevels, 'list', 'count').then(() => handleRoute());
loadList('legacy.json', legacyLevels, 'legacy-list', 'legacy-count').then(() => handleRoute());
