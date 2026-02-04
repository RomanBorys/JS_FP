const STORAGE_KEY = 'your-energy-favorites';

function safeParse(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeExercise(exercise) {
  return {
    _id: exercise._id,
    name: exercise.name,
    rating: exercise.rating,
    burnedCalories: exercise.burnedCalories,
    time: exercise.time,
    bodyPart: exercise.bodyPart,
    target: exercise.target,
    gifUrl: exercise.gifUrl,
    imgURL: exercise.imgURL,
    equipment: exercise.equipment,
    popularity: exercise.popularity,
    description: exercise.description,
  };
}

export function getFavorites() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? safeParse(raw) : [];
}

function setFavorites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isFavorite(exerciseId) {
  if (!exerciseId) return false;
  const favorites = getFavorites();
  return favorites.some(item => item._id === exerciseId);
}

export function addFavorite(exercise) {
  if (!exercise || !exercise._id) return false;
  const favorites = getFavorites();
  if (favorites.some(item => item._id === exercise._id)) return true;

  favorites.push(normalizeExercise(exercise));
  setFavorites(favorites);
  return true;
}

export function removeFavorite(exerciseId) {
  const favorites = getFavorites();
  const next = favorites.filter(item => item._id !== exerciseId);
  setFavorites(next);
  return next;
}

export function toggleFavorite(exercise) {
  if (!exercise || !exercise._id) return false;
  if (isFavorite(exercise._id)) {
    removeFavorite(exercise._id);
    return false;
  }
  addFavorite(exercise);
  return true;
}

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  const empty = document.getElementById('favoritesEmpty');
  const template = document.getElementById('favoriteExerciseCardTemplate');

  if (!list || !empty || !template) return;

  const favorites = getFavorites();
  list.innerHTML = '';

  if (favorites.length === 0) {
    empty.classList.remove('is-hidden');
    list.classList.add('is-hidden');
    return;
  }

  empty.classList.add('is-hidden');
  list.classList.remove('is-hidden');

  favorites.forEach(exercise => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.exercises__detail-card');
    const ratingValue = clone.querySelector('.exercises__detail-rating-value');
    const title = clone.querySelector('.exercises__detail-title');
    const calories = clone.querySelector('.exercises__detail-calories');
    const bodypart = clone.querySelector('.exercises__detail-bodypart');
    const target = clone.querySelector('.exercises__detail-target');

    if (card) {
      card.dataset.exerciseId = exercise._id || '';
    }
    if (ratingValue) {
      const rating = exercise.rating ? Number(exercise.rating) : 0;
      ratingValue.textContent = rating.toFixed(1);
    }
    if (title) {
      title.textContent = exercise.name || 'Unknown exercise';
    }
    if (calories) {
      const burned = exercise.burnedCalories || 0;
      const time = exercise.time || 0;
      calories.textContent = `${burned} / ${time} min`;
    }
    if (bodypart) {
      bodypart.textContent = exercise.bodyPart || '-';
    }
    if (target) {
      target.textContent = exercise.target || '-';
    }

    list.appendChild(clone);
  });
}

function initializeFavoritesPage() {
  const list = document.getElementById('favoritesList');
  if (!list) return;

  list.addEventListener('click', event => {
    const removeBtn = event.target.closest('[data-favorite-remove]');
    if (!removeBtn) return;

    const card = removeBtn.closest('.exercises__detail-card');
    const id = card ? card.dataset.exerciseId : null;
    if (!id) return;

    removeFavorite(id);
    renderFavorites();
  });

  renderFavorites();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFavoritesPage);
} else {
  initializeFavoritesPage();
}
