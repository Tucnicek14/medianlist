let levels = [];

async function loadLevels() {
  try {
    const res = await fetch('levels.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    levels = await res.json();
    levels.sort((a, b) => a.rank - b.rank); // always trust "rank" field, not array order
    render(levels);
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
    row.addEventListener('click', () => openModal(row.dataset.id));
  });
}

function openModal(rank) {
  const lvl = levels.find(l => String(l.rank) === rank);
  if (!lvl) return;
  document.getElementById('modal-body').innerHTML = `
    <h2>#${lvl.rank} — ${escapeHtml(lvl.name)}</h2>
    <p>${escapeHtml(lvl.description || '')}</p>
    <p style="color:var(--text-dim); font-size:0.85rem;">
      Creator: ${escapeHtml(lvl.creator)} · Level ID: ${lvl.levelId} · ${lvl.points} points
    </p>
    ${lvl.videoId ? `<iframe src="https://www.youtube.com/embed/${lvl.videoId}" allowfullscreen></iframe>` : ''}
  `;
  document.getElementById('modal').hidden = false;
}

function closeModal() {
  document.getElementById('modal').hidden = true;
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

// modal close
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// nav tabs
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const view = btn.dataset.view;
    document.getElementById('main-view').hidden = view !== 'main';
    document.getElementById('about-view').hidden = view !== 'about';
  });
});

loadLevels();
