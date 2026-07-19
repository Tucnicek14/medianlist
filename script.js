let levels = [];

async function loadLevels() {
  try {
    const res = await fetch('levels.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    levels = await res.json();
    levels.sort((a, b) => a.rank - b.rank); // always trust "rank" field, not array order
    render(levels);
    handleRoute(); // in case the page loaded on a #level-N link
  } catch (err) {
    document.getElementById('list').innerHTML =
      `<p class="empty">Couldn't load levels.json (${err.message}). If you're opening this file directly, run a local server instead — see the README note.</p>`;
  }
}

function render(data) {
  const list = document.getElementById('list');
  const count = document.getElementById('count');
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
      window.location.hash = `level-${row.dataset.id}`;
    });
  });
}

function showDetail(rank) {
  const lvl = levels.find(l => String(l.rank) === String(rank));
  const body = document.getElementById('detail-body');

  if (!lvl) {
    body.innerHTML = `<p class="detail-not-found">Level not found.</p>`;
  } else {
    body.innerHTML = `
      <div class="detail-card">
        <p class="detail-rank">#${lvl.rank}</p>
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
  document.getElementById('about-view').hidden = view !== 'about';
  document.getElementById('detail-view').hidden = view !== 'detail';

  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('is-active'));
  const navBtn = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (navBtn) navBtn.classList.add('is-active');
}

function handleRoute() {
  const hash = window.location.hash; // e.g. "#level-3"
  const match = hash.match(/^#level-(.+)$/);
  if (match) {
    showDetail(match[1]);
  } else {
    setView('main');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// search
document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = levels.filter(l =>
    l.name.toLowerCase().includes(q) || l.creator.toLowerCase().includes(q)
  );
  render(filtered);
});

// back button clears the hash and returns to the list
document.getElementById('back-btn').addEventListener('click', () => {
  window.location.hash = '';
});

// nav tabs (Main List / About)
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'main') window.location.hash = '';
    setView(btn.dataset.view);
  });
});

// respond to back/forward navigation and hash changes
window.addEventListener('hashchange', handleRoute);

loadLevels();
