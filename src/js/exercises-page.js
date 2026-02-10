import { isFavorite, toggleFavorite } from './favorites-section.js';

const API_BASE_URL = 'https://your-energy.b.goit.study/api';
const API_ENDPOINTS = {
  exercises: `${API_BASE_URL}/exercises`,
  filters: `${API_BASE_URL}/filters`,
};

let currentFilter = 'Muscles';
let currentPage = 1;
let currentCategory = null;
let isDetailView = false;
let searchQuery = '';

function getPerPage() {
  const width = window.innerWidth;
  if (width >= 768 && width < 1440) {
    return isDetailView ? 10 : 12;
  }
  return 12;
}

let exercisesList;
let exercisesPagination;
let tabButtons;
let exercisesTabs;
let exercisesSearch;
let exercisesSearchInput;
let exercisesSearchForm;
let exercisesCategoryTitle;

let exerciseModal;
let exerciseModalImg;
let exerciseModalTitle;
let exerciseModalRatingValue;
let exerciseModalStars;
let exerciseModalTarget;
let exerciseModalBodyPart;
let exerciseModalEquipment;
let exerciseModalPopularity;
let exerciseModalCalories;
let exerciseModalDescription;
let exerciseModalError;
let exerciseModalFavoriteBtn;
let exerciseModalFavoriteBtnText;
let exerciseModalRatingBtn;

let ratingModal;
let ratingModalValue;
let ratingModalStars;
let ratingEmailInput;
let ratingReviewInput;
let ratingModalForm;
let ratingModalError;

let currentModalExercise = null;
let currentRatingValue = 0;

async function fetchFilters(filter, page = 1) {
  try {
    const params = new URLSearchParams({
      filter,
      page: String(page),
      limit: String(getPerPage()),
    });

    const response = await fetch(`${API_ENDPOINTS.filters}?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('Error fetching filters:', error);
    showError('Failed to load categories. Please try again later.');
    return null;
  }
}

async function fetchExercisesByCategory(category, filterType, page = 1, keyword = '') {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(getPerPage()),
    });

    if (filterType === 'Muscles') params.append('muscles', category);
    else if (filterType === 'Body parts') params.append('bodypart', category);
    else if (filterType === 'Equipment') params.append('equipment', category);

    if (keyword) params.append('keyword', keyword);

    const response = await fetch(`${API_ENDPOINTS.exercises}?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('Error fetching exercises:', error);
    showError('Failed to load exercises. Please try again later.');
    return null;
  }
}

async function fetchExerciseById(exerciseId) {
  try {
    const response = await fetch(`${API_ENDPOINTS.exercises}/${exerciseId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching exercise detail:', error);
    return null;
  }
}


async function submitExerciseRating(exerciseId, payload) {
  const response = await fetch(`${API_ENDPOINTS.exercises}/${exerciseId}/rating`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const data = hasJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || 'Failed to submit rating. Please try again later.';
    throw new Error(message);
  }

  return data;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoading() {
  if (exercisesList) exercisesList.innerHTML = '<li class="exercises__loading">Loading...</li>';
}

function hideLoading() {}

function showError(message) {
  if (exercisesList) exercisesList.innerHTML = `<li class="exercises__error">${message}</li>`;
}

function updateUIForCategoryView() {
  if (exercisesCategoryTitle) exercisesCategoryTitle.textContent = '';
  if (exercisesSearch) exercisesSearch.style.display = 'none';
  if (exercisesTabs) exercisesTabs.style.display = '';
  if (exercisesSearchInput) exercisesSearchInput.value = '';
}

function updateUIForDetailView(categoryName) {
  if (exercisesCategoryTitle) {
    exercisesCategoryTitle.innerHTML = ` / <span class="exercises__category-name">${capitalizeFirstLetter(
      categoryName
    )}</span>`;
  }
  if (exercisesSearch) exercisesSearch.style.display = '';
}

function createCategoryCard(category) {
  const template = document.getElementById('exerciseCardTemplate');
  const clone = template.content.cloneNode(true);

  const card = clone.querySelector('.exercises__card');
  const img = clone.querySelector('.exercises__card-img');
  const title = clone.querySelector('.exercises__card-title');
  const subtitle = clone.querySelector('.exercises__card-subtitle');

  img.src = category.imgURL || category.gifUrl || '../img/placeholder.jpg';
  img.alt = `${category.name} category`;

  title.textContent = category.name;
  subtitle.textContent = category.filter || currentFilter;

  card.addEventListener('click', () => {
    showExercisesForCategory(category.name);
  });

  return clone;
}

function createDetailExerciseCard(exercise) {
  const template = document.getElementById('exerciseDetailCardTemplate');
  const clone = template.content.cloneNode(true);

  const card = clone.querySelector('.exercises__detail-card');
  const ratingValue = clone.querySelector('.exercises__detail-rating-value');
  const title = clone.querySelector('.exercises__detail-title');
  const calories = clone.querySelector('.exercises__detail-calories');
  const bodypart = clone.querySelector('.exercises__detail-bodypart');
  const target = clone.querySelector('.exercises__detail-target');

  card.dataset.exerciseId = exercise._id;

  ratingValue.textContent = exercise.rating ? Number(exercise.rating).toFixed(1) : '0.0';
  title.textContent = exercise.name || 'Unknown exercise';

  calories.textContent = `${exercise.burnedCalories || 0} / ${exercise.time || 3} min`;
  bodypart.textContent = exercise.bodyPart || '-';
  target.textContent = exercise.target || '-';

  const startBtn = clone.querySelector('.exercises__detail-start');
  startBtn.addEventListener('click', e => {
    e.stopPropagation();
    openExerciseDetail(exercise._id);
  });

  return clone;
}

function renderCategories(categories) {
  if (!exercisesList) return;

  exercisesList.innerHTML = '';
  exercisesList.classList.remove('exercises__list--detail');

  if (!categories || categories.length === 0) {
    exercisesList.innerHTML = '<li class="exercises__empty">No categories found</li>';
    return;
  }

  categories.forEach(category => {
    exercisesList.appendChild(createCategoryCard(category));
  });
}

function renderDetailExercises(exercises) {
  if (!exercisesList) return;

  exercisesList.innerHTML = '';
  exercisesList.classList.add('exercises__list--detail');

  if (!exercises || exercises.length === 0) {
    exercisesList.innerHTML = '<li class="exercises__empty">No exercises found</li>';
    return;
  }

  exercises.forEach(exercise => {
    exercisesList.appendChild(createDetailExerciseCard(exercise));
  });
}

function renderPagination(activePage, totalPages, isDetail = false) {
  if (!exercisesPagination) return;

  exercisesPagination.innerHTML = '';
  if (totalPages <= 1) return;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, activePage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    exercisesPagination.appendChild(createPaginationButton(i, i, i === activePage, isDetail));
  }
}

function createPaginationButton(text, page, isActive = false, isDetail = false) {
  const btn = document.createElement('button');
  btn.className = 'exercises__pagination-btn';
  if (isActive) btn.classList.add('exercises__pagination-btn--active');
  btn.textContent = text;

  if (isDetail) {
    btn.addEventListener('click', () => loadDetailExercises(currentCategory, currentFilter, page));
  } else {
    btn.addEventListener('click', () => loadCategories(currentFilter, page));
  }

  return btn;
}

async function loadCategories(filter, page = 1) {
  isDetailView = false;
  currentCategory = null;
  searchQuery = '';

  updateUIForCategoryView();
  showLoading();

  const data = await fetchFilters(filter, page);

  if (data?.results) {
    const activePage = parseInt(data.page, 10) || page;
    const totalPages = parseInt(data.totalPages, 10) || 1;

    renderCategories(data.results);
    renderPagination(activePage, totalPages, false);

    currentPage = activePage;
    currentFilter = filter;
  }

  hideLoading();
}

async function loadDetailExercises(category, filterType, page = 1) {
  showLoading();

  const data = await fetchExercisesByCategory(category, filterType, page, searchQuery);

  if (data?.results) {
    const activePage = parseInt(data.page, 10) || page;
    const totalPages = parseInt(data.totalPages, 10) || 1;

    renderDetailExercises(data.results);
    renderPagination(activePage, totalPages, true);

    currentPage = activePage;
  } else if (exercisesList) {
    exercisesList.innerHTML = '<li class="exercises__error">Failed to load exercises</li>';
  }

  hideLoading();
}

function showExercisesForCategory(categoryName) {
  isDetailView = true;
  currentCategory = categoryName;
  currentPage = 1;

  updateUIForDetailView(categoryName);
  loadDetailExercises(categoryName, currentFilter, 1);
}

let onKeyDownHandler = null;

function addKeyboardListeners() {
  if (onKeyDownHandler) return;

  onKeyDownHandler = e => {
    if (e.key !== 'Escape') return;

    if (ratingModal?.classList.contains('is-open')) {
      closeRatingModal();
      return;
    }
    if (exerciseModal?.classList.contains('is-open')) {
      closeExerciseModal();
    }
  };

  document.addEventListener('keydown', onKeyDownHandler);
}

function removeKeyboardListenersIfNoModalsOpen() {
  const anyOpen =
    (exerciseModal && exerciseModal.classList.contains('is-open')) ||
    (ratingModal && ratingModal.classList.contains('is-open'));

  if (anyOpen) return;

  if (onKeyDownHandler) {
    document.removeEventListener('keydown', onKeyDownHandler);
    onKeyDownHandler = null;
  }
}

function lockScroll() {
  document.body.classList.add('no-scroll');
}

function unlockScrollIfNoModalsOpen() {
  const anyOpen =
    (exerciseModal && exerciseModal.classList.contains('is-open')) ||
    (ratingModal && ratingModal.classList.contains('is-open'));

  if (!anyOpen) document.body.classList.remove('no-scroll');
}

function setExerciseModalState(state, message = '') {
  if (!exerciseModal) return;

  exerciseModal.classList.remove('exercises__modal--loading', 'exercises__modal--error');

  if (state === 'loading') {
    exerciseModal.classList.add('exercises__modal--loading');
    if (exerciseModalError) exerciseModalError.textContent = '';
  }
  if (state === 'error') {
    exerciseModal.classList.add('exercises__modal--error');
    if (exerciseModalError) exerciseModalError.textContent = message;
  }
  if (state === 'ready') {
    if (exerciseModalError) exerciseModalError.textContent = '';
  }
}

function openExerciseModal() {
  if (!exerciseModal) return;
  exerciseModal.classList.add('is-open');
  exerciseModal.setAttribute('aria-hidden', 'false');
  lockScroll();
  addKeyboardListeners();
}

function closeExerciseModal() {
  if (!exerciseModal) return;
  exerciseModal.classList.remove('is-open', 'exercises__modal--loading', 'exercises__modal--error');
  exerciseModal.setAttribute('aria-hidden', 'true');
  unlockScrollIfNoModalsOpen();
  removeKeyboardListenersIfNoModalsOpen();
}

function setRatingModalState(state, message = '') {
  if (!ratingModal) return;

  ratingModal.classList.remove('exercises__modal--loading', 'exercises__modal--error');

  if (state === 'loading') {
    ratingModal.classList.add('exercises__modal--loading');
    if (ratingModalError) ratingModalError.textContent = '';
  }
  if (state === 'error') {
    ratingModal.classList.add('exercises__modal--error');
    if (ratingModalError) ratingModalError.textContent = message;
  }
  if (state === 'ready') {
    if (ratingModalError) ratingModalError.textContent = '';
  }
}

function openRatingModal() {
  if (!ratingModal) return;
  if (exerciseModal?.classList.contains('is-open')) closeExerciseModal();

  resetRatingForm();
  setRatingModalState('ready');

  ratingModal.classList.add('is-open');
  ratingModal.setAttribute('aria-hidden', 'false');
  lockScroll();
  addKeyboardListeners();
}

function closeRatingModal() {
  if (!ratingModal) return;

  ratingModal.classList.remove('is-open', 'exercises__modal--loading', 'exercises__modal--error');
  ratingModal.setAttribute('aria-hidden', 'true');

  unlockScrollIfNoModalsOpen();
  removeKeyboardListenersIfNoModalsOpen();
}

function updateStars(rating) {
  if (!exerciseModalStars) return;

  const stars = exerciseModalStars.querySelectorAll('.exercises__modal-star');
  const activeCount = Math.round(Number(rating) || 0);

  stars.forEach((star, idx) => {
    star.classList.toggle('is-active', idx < activeCount);
  });
}

function updateFavoriteButtonState(isFav) {
  if (!exerciseModalFavoriteBtnText) return;
  exerciseModalFavoriteBtnText.textContent = isFav ? 'Remove from favorites' : 'Add to favorites';
  if (exerciseModalFavoriteBtn) {
    exerciseModalFavoriteBtn.classList.toggle('is-active', isFav);
  }
}

function fillModalContent(data) {
  if (!exerciseModal) return;

  currentModalExercise = data;

  if (exerciseModalImg) {
    exerciseModalImg.src = data.gifUrl || data.imgURL || '../img/placeholder.jpg';
    exerciseModalImg.alt = data.name || 'Exercise image';
  }
  if (exerciseModalTitle) exerciseModalTitle.textContent = data.name || 'Exercise';

  const rating = data.rating ? Number(data.rating) : 0;
  if (exerciseModalRatingValue) exerciseModalRatingValue.textContent = rating.toFixed(1);
  updateStars(rating);

  if (exerciseModalTarget) exerciseModalTarget.textContent = data.target || '-';
  if (exerciseModalBodyPart) exerciseModalBodyPart.textContent = data.bodyPart || '-';
  if (exerciseModalEquipment) exerciseModalEquipment.textContent = data.equipment || '-';
  if (exerciseModalPopularity) exerciseModalPopularity.textContent = String(data.popularity || 0);
  if (exerciseModalCalories) exerciseModalCalories.textContent = `${data.burnedCalories} / ${data.time} min`;
  if (exerciseModalDescription) exerciseModalDescription.textContent = data.description || '';

  updateFavoriteButtonState(isFavorite(data._id));
}

async function openExerciseDetail(exerciseId) {
  if (!exerciseModal) return;

  openExerciseModal();
  setExerciseModalState('loading');

  const data = await fetchExerciseById(exerciseId);

  if (!data) {
    setExerciseModalState('error', 'Failed to load exercise details. Please try again later.');
    return;
  }

  fillModalContent(data);
  setExerciseModalState('ready');
}

function resetRatingForm() {
  currentRatingValue = 0;
  if (ratingEmailInput) ratingEmailInput.value = '';
  if (ratingReviewInput) ratingReviewInput.value = '';
  updateRatingModalStars(0);
}

function updateRatingModalStars(rating) {
  if (!ratingModalStars || !ratingModalValue) return;

  const stars = ratingModalStars.querySelectorAll('.exercises__rating-star');
  const activeCount = Math.round(Number(rating) || 0);

  ratingModalValue.textContent = Number(rating || 0).toFixed(1);

  stars.forEach((star, idx) => {
    star.classList.toggle('is-active', idx < activeCount);
  });
}

async function handleRatingSubmit(e) {
  e.preventDefault();
  if (!currentModalExercise) return;

  const email = (ratingEmailInput?.value || '').trim();
  const review = (ratingReviewInput?.value || '').trim();
  const rate = Number(currentRatingValue) || 0;

  if (rate <= 0) {
    setRatingModalState('error', 'Please select a rating (1–5 stars).');
    return;
  }
  if (!email) {
    setRatingModalState('error', 'Email is required.');
    return;
  }

  const payload = { rate, email, review };

  try {
    setRatingModalState('loading');

    const data = await submitExerciseRating(currentModalExercise._id, payload);

    const newRating =
      (data && typeof data.rating === 'number' && data.rating) ||
      (data && typeof data.rate === 'number' && data.rate) ||
      rate;

    currentModalExercise.rating = newRating;

    if (exerciseModalRatingValue) exerciseModalRatingValue.textContent = Number(newRating).toFixed(1);
    updateStars(newRating);

    const card = document.querySelector(`.exercises__detail-card[data-exercise-id="${currentModalExercise._id}"]`);
    if (card) {
      const ratingEl = card.querySelector('.exercises__detail-rating-value');
      if (ratingEl) ratingEl.textContent = Number(newRating).toFixed(1);
    }

    setRatingModalState('ready');
    closeRatingModal();
  } catch (error) {
    setRatingModalState('error', error.message || 'Failed to submit rating.');
  }
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function initializeTabs() {
  tabButtons = document.querySelectorAll('.exercises__tab');

  const activeLine = document.createElement('div');
  activeLine.className = 'exercises__tab--active_line';

  const initialActiveTab = document.querySelector('.exercises__tab--active');
  if (initialActiveTab) initialActiveTab.appendChild(activeLine);

  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('exercises__tab--active'));
      tab.classList.add('exercises__tab--active');
      tab.appendChild(activeLine);

      const filter = tab.dataset.filter;
      loadCategories(filter, 1);
    });
  });
}

function initializeSearch() {
  if (!exercisesSearchInput) return;

  const runSearch = () => {
    searchQuery = exercisesSearchInput.value.trim();
    if (isDetailView && currentCategory) {
      loadDetailExercises(currentCategory, currentFilter, 1);
    }
  };

  if (exercisesSearchForm) {
    exercisesSearchForm.addEventListener('submit', e => {
      e.preventDefault();
      runSearch();
    });
  }

  exercisesSearchInput.addEventListener('input', debounce(runSearch, 300));
}

function init() {
  exercisesList = document.getElementById('exercisesList');
  exercisesPagination = document.getElementById('exercisesPagination');
  exercisesTabs = document.getElementById('exercisesTabs');
  exercisesSearch = document.getElementById('exercisesSearch');

  exercisesSearchForm = document.getElementById('exercisesSearchForm') || null;

  exercisesSearchInput = document.getElementById('exercisesSearchInput');
  exercisesCategoryTitle = document.getElementById('exercisesCategoryTitle');

  exerciseModal = document.getElementById('exerciseModal');
  exerciseModalImg = document.getElementById('exerciseModalImg');
  exerciseModalTitle = document.getElementById('exerciseModalTitle');
  exerciseModalRatingValue = document.getElementById('exerciseModalRatingValue');
  exerciseModalStars = document.getElementById('exerciseModalStars');
  exerciseModalTarget = document.getElementById('exerciseModalTarget');
  exerciseModalBodyPart = document.getElementById('exerciseModalBodyPart');
  exerciseModalEquipment = document.getElementById('exerciseModalEquipment');
  exerciseModalPopularity = document.getElementById('exerciseModalPopularity');
  exerciseModalCalories = document.getElementById('exerciseModalCalories');
  exerciseModalDescription = document.getElementById('exerciseModalDescription');
  exerciseModalError = document.getElementById('exerciseModalError');

  exerciseModalFavoriteBtn = exerciseModal ? exerciseModal.querySelector('.exercises__modal-btn--primary') : null;
  exerciseModalFavoriteBtnText = exerciseModal ? exerciseModal.querySelector('.exercises__modal-btn-text') : null;
  exerciseModalRatingBtn = document.getElementById('exerciseModalRatingBtn');

  ratingModal = document.getElementById('ratingModal');
  ratingModalValue = document.getElementById('ratingModalValue');
  ratingModalStars = document.getElementById('ratingModalStars');
  ratingEmailInput = document.getElementById('ratingEmailInput');
  ratingReviewInput = document.getElementById('ratingReviewInput');
  ratingModalForm = document.getElementById('ratingModalForm');
  ratingModalError = document.getElementById('ratingModalError');

  const hasExercisesList = Boolean(exercisesList);

  if (hasExercisesList) {
    initializeTabs();
    initializeSearch();
    loadCategories(currentFilter);
  }

  if (exerciseModal) {
    const closeTargets = exerciseModal.querySelectorAll('[data-modal-close]');
    closeTargets.forEach(btn => btn.addEventListener('click', closeExerciseModal));
  }

  if (ratingModal) {
    const closeTargets = ratingModal.querySelectorAll('[data-modal-close]');
    closeTargets.forEach(btn => btn.addEventListener('click', closeRatingModal));
  }

  if (exerciseModalFavoriteBtn) {
    exerciseModalFavoriteBtn.addEventListener('click', () => {
      if (!currentModalExercise) return;
      const isFavNow = toggleFavorite(currentModalExercise);
      updateFavoriteButtonState(isFavNow);
    });
  }

  if (exerciseModalRatingBtn) {
    exerciseModalRatingBtn.addEventListener('click', openRatingModal);
  }

  if (ratingModalStars) {
    ratingModalStars.addEventListener('click', e => {
      const btn = e.target.closest('.exercises__rating-star');
      if (!btn) return;
      const value = Number(btn.dataset.value || 0);
      currentRatingValue = value;
      updateRatingModalStars(value);
      setRatingModalState('ready');
    });
  }

  if (ratingModalForm) {
    ratingModalForm.addEventListener('submit', handleRatingSubmit);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { loadCategories, loadDetailExercises, showExercisesForCategory, openExerciseDetail };
