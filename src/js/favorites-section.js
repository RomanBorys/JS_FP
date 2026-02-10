import { openExerciseDetail } from './exercises-page.js';

const API_BASE_URL = 'https://your-energy.b.goit.study/api';
const API_EXERCISES_URL = `${API_BASE_URL}/exercises`;

const STORAGE_KEY = 'your-energy-favorites';
const FAVORITES_EVENT = 'favorites:changed';

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeId(id) {
  const s = String(id || '').trim();
  return s;
}

export function getFavorites() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const arr = raw ? safeParseArray(raw) : [];
  return arr.map(normalizeId).filter(Boolean);
}

function setFavorites(ids) {
  const unique = Array.from(new Set((ids || []).map(normalizeId).filter(Boolean)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));

  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: { ids: unique } }));
}

export function isFavorite(exerciseId) {
  const id = normalizeId(exerciseId);
  if (!id) return false;
  return getFavorites().includes(id);
}

export function addFavorite(exerciseOrId) {
  const id = normalizeId(exerciseOrId?._id ?? exerciseOrId);
  if (!id) return false;

  const ids = getFavorites();
  if (ids.includes(id)) return true;

  ids.push(id);
  setFavorites(ids);
  return true;
}

export function removeFavorite(exerciseId) {
  const id = normalizeId(exerciseId);
  if (!id) return [];

  const ids = getFavorites().filter(x => x !== id);
  setFavorites(ids);
  return ids;
}

export function toggleFavorite(exerciseOrId) {
  const id = normalizeId(exerciseOrId?._id ?? exerciseOrId);
  if (!id) return false;

  if (isFavorite(id)) {
    removeFavorite(id);
    return false;
  }

  addFavorite(id);
  return true;
}

async function fetchExerciseById(exerciseId) {
  const id = normalizeId(exerciseId);
  if (!id) return null;

  const res = await fetch(`${API_EXERCISES_URL}/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

async function fetchExercisesByIds(ids) {
  const tasks = ids.map(async id => {
    try {
      return await fetchExerciseById(id);
    } catch (err) {
      console.error('Failed to fetch exercise by id:', id, err);
      return null;
    }
  });

  const results = await Promise.all(tasks);
  return results.filter(Boolean);
}

function fillFavoriteCard(clone, exercise) {
  const card = clone.querySelector('.exercises__detail-card');
  const ratingValue = clone.querySelector('.exercises__detail-rating-value');
  const title = clone.querySelector('.exercises__detail-title');
  const calories = clone.querySelector('.exercises__detail-calories');
  const bodypart = clone.querySelector('.exercises__detail-bodypart');
  const target = clone.querySelector('.exercises__detail-target');

  if (card) card.dataset.exerciseId = exercise._id || '';

  if (ratingValue) {
    const r = exercise.rating ? Number(exercise.rating) : 0;
    ratingValue.textContent = r.toFixed(1);
  }

  if (title) title.textContent = exercise.name || 'Unknown exercise';

  if (calories) {
    const burned = exercise.burnedCalories ?? 0;
    const time = exercise.time ?? 0;
    calories.textContent = `${burned} / ${time} min`;
  }

  if (bodypart) bodypart.textContent = exercise.bodyPart || '-';
  if (target) target.textContent = exercise.target || '-';

  const startBtn = clone.querySelector('.exercises__detail-start');
  if (startBtn) {
    startBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = exercise._id;
      if (id) openExerciseDetail(id);
    });
  }

  const removeBtn = clone.querySelector('[data-favorite-remove]');
  if (removeBtn) {
    removeBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = exercise._id;
      if (!id) return;
      removeFavorite(id);
    });
  }
}

async function renderFavorites() {
  const list = document.getElementById('favoritesList');
  const empty = document.getElementById('favoritesEmpty');
  const template = document.getElementById('favoriteExerciseCardTemplate');

  if (!list || !empty || !template) return;

  const ids = getFavorites();
  list.innerHTML = '';

  if (ids.length === 0) {
    empty.classList.remove('is-hidden');
    list.classList.add('is-hidden');
    return;
  }

  empty.classList.add('is-hidden');
  list.classList.remove('is-hidden');

  const exercises = await fetchExercisesByIds(ids);

  const actualIds = exercises.map(x => x._id).filter(Boolean);
  const broken = ids.filter(id => !actualIds.includes(id));
  if (broken.length) {
    setFavorites(actualIds);
  }

  exercises.forEach(exercise => {
    const clone = template.content.cloneNode(true);
    fillFavoriteCard(clone, exercise);
    list.appendChild(clone);
  });

  if (getFavorites().length === 0) {
    empty.classList.remove('is-hidden');
    list.classList.add('is-hidden');
  }
}

function initializeFavoritesPage() {
  const list = document.getElementById('favoritesList');
  if (!list) return;

  window.addEventListener(FAVORITES_EVENT, () => {
    renderFavorites();
  });

  
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) renderFavorites();
  });

  renderFavorites();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFavoritesPage);
} else {
  initializeFavoritesPage();
}
