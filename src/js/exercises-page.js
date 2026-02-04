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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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

    if (filterType === 'Muscles') {
      params.append('muscles', category);
    } else if (filterType === 'Body parts') {
      params.append('bodypart', category);
    } else if (filterType === 'Equipment') {
      params.append('equipment', category);
    }

    if (keyword) {
      params.append('keyword', keyword);
    }

    const response = await fetch(`${API_ENDPOINTS.exercises}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
    const message = data && data.message ? data.message : 'Failed to submit rating. Please try again later.';
    throw new Error(message);
  }

  return data;
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

  if (data && data.results) {
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

  if (data && data.results) {
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

async function openExerciseDetail(exerciseId) {
  if (!exerciseModal) return;

  openModal();
  setModalState('loading');

  const data = await fetchExerciseById(exerciseId);

  if (!data) {
    setModalState('error', 'Failed to load exercise details. Please try again later.');
    return;
  }

  fillModalContent(data);
  setModalState('ready');
}

function openModal() {
  exerciseModal.classList.add('is-open');
  document.body.classList.add('no-scroll');
  exerciseModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!exerciseModal) return;
  exerciseModal.classList.remove('is-open');
  exerciseModal.classList.remove('exercises__modal--loading', 'exercises__modal--error');
  document.body.classList.remove('no-scroll');
  exerciseModal.setAttribute('aria-hidden', 'true');
}

function openRatingModal() {
  if (!ratingModal) return;
  if (exerciseModal && exerciseModal.classList.contains('is-open')) closeModal();
  resetRatingForm();
  setRatingModalState('ready');
  ratingModal.classList.add('is-open');
  document.body.classList.add('no-scroll');
  ratingModal.setAttribute('aria-hidden', 'false');
}

function closeRatingModal() {
  if (!ratingModal) return;
  ratingModal.classList.remove('is-open');
  ratingModal.classList.remove('exercises__modal--loading', 'exercises__modal--error');
  ratingModal.setAttribute('aria-hidden', 'true');
  if (!exerciseModal || !exerciseModal.classList.contains('is-open')) {
    document.body.classList.remove('no-scroll');
  }
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

function resetRatingForm() {
  currentRatingValue = 0;
  if (ratingEmailInput) ratingEmailInput.value = '';
  if (ratingReviewInput) ratingReviewInput.value = '';
  updateRatingModalStars(0);
}

function updateRatingModalStars(rating) {
  if (!ratingModalStars || !ratingModalValue) return;

  const stars = ratingModalStars.querySelectorAll('.exercises__rating-star');
  const activeCount = Math.round(rating);

  ratingModalValue.textContent = Number(rating).toFixed(1);

  stars.forEach((star, index) => {
    if (index < activeCount) star.classList.add('is-active');
    else star.classList.remove('is-active');
  });
}

async function handleRatingSubmit(event) {
  event.preventDefault();
  if (!currentModalExercise) return;

  const payload = {
    rating: Number(currentRatingValue) || 0,
  };

  try {
    setRatingModalState('loading');
    const data = await submitExerciseRating(currentModalExercise._id, payload);

    const newRating = data && typeof data.rating === 'number' ? data.rating : payload.rating;

    currentModalExercise.rating = newRating;

    if (exerciseModalRatingValue) {
      exerciseModalRatingValue.textContent = newRating.toFixed(1);
    }

    updateStars(newRating);

    const detailCard = document.querySelector(
      `.exercises__detail-card[data-exercise-id="${currentModalExercise._id}"]`
    );
    if (detailCard) {
      const ratingValueEl = detailCard.querySelector('.exercises__detail-rating-value');
      if (ratingValueEl) ratingValueEl.textContent = newRating.toFixed(1);
    }

    setRatingModalState('ready');
    closeRatingModal();
  } catch (error) {
    setRatingModalState('error', error.message);
  }
}

function setModalState(state, message = '') {
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

function fillModalContent(data) {
  if (!exerciseModal) return;

  currentModalExercise = data;

  exerciseModalImg.src = data.gifUrl || data.imgURL || '../img/placeholder.jpg';
  exerciseModalImg.alt = data.name || 'Exercise image';
  exerciseModalTitle.textContent = data.name || 'Exercise';

  const rating = data.rating ? Number(data.rating) : 0;
  exerciseModalRatingValue.textContent = rating.toFixed(1);
  updateStars(rating);

  exerciseModalTarget.textContent = data.target || '-';
  exerciseModalBodyPart.textContent = data.bodyPart || '-';
  exerciseModalEquipment.textContent = data.equipment || '-';
  exerciseModalPopularity.textContent = data.popularity || '0';
  exerciseModalCalories.textContent = `${data.burnedCalories} / ${data.time} min`;
  exerciseModalDescription.textContent = data.description || '';

  updateFavoriteButtonState(isFavorite(data._id));
}

function updateFavoriteButtonState(isFav) {
  if (!exerciseModalFavoriteBtnText) return;

  exerciseModalFavoriteBtnText.textContent = isFav ? 'Remove from favorites' : 'Add to favorites';
  if (exerciseModalFavoriteBtn) {
    exerciseModalFavoriteBtn.classList.toggle('is-active', isFav);
  }
}

function updateStars(rating) {
  if (!exerciseModalStars) return;

  const stars = exerciseModalStars.querySelectorAll('.exercises__modal-star');
  const activeCount = Math.round(rating);

  stars.forEach((star, index) => {
    if (index < activeCount) star.classList.add('is-active');
    else star.classList.remove('is-active');
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
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

  exercisesSearchInput.addEventListener(
    'input',
    debounce(e => {
      searchQuery = e.target.value.trim();
      if (isDetailView && currentCategory) {
        loadDetailExercises(currentCategory, currentFilter, 1);
      }
    }, 300)
  );
}

function init() {
  exercisesList = document.getElementById('exercisesList');
  exercisesPagination = document.getElementById('exercisesPagination');
  exercisesTabs = document.getElementById('exercisesTabs');
  exercisesSearch = document.getElementById('exercisesSearch');
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

  if (!exercisesList) return;

  initializeTabs();
  initializeSearch();

  if (exerciseModal) {
    const closeTargets = exerciseModal.querySelectorAll('[data-modal-close]');
    closeTargets.forEach(target => target.addEventListener('click', closeModal));

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;

      if (ratingModal && ratingModal.classList.contains('is-open')) {
        closeRatingModal();
        return;
      }

      if (exerciseModal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  if (ratingModal) {
    const ratingCloseTargets = ratingModal.querySelectorAll('[data-modal-close]');
    ratingCloseTargets.forEach(target => target.addEventListener('click', closeRatingModal));
  }

  if (exerciseModalFavoriteBtn) {
    exerciseModalFavoriteBtn.addEventListener('click', () => {
      if (!currentModalExercise) return;
      const isFav = toggleFavorite(currentModalExercise);
      updateFavoriteButtonState(isFav);
    });
  }

  if (exerciseModalRatingBtn) {
    exerciseModalRatingBtn.addEventListener('click', openRatingModal);
  }

  if (ratingModalStars) {
    ratingModalStars.addEventListener('click', e => {
      const target = e.target.closest('.exercises__rating-star');
      if (!target) return;
      const value = Number(target.dataset.value || 0);
      currentRatingValue = value;
      updateRatingModalStars(value);
    });
  }

  if (ratingModalForm) {
    ratingModalForm.addEventListener('submit', handleRatingSubmit);
  }

  loadCategories(currentFilter);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { loadCategories, loadDetailExercises, showExercisesForCategory };
