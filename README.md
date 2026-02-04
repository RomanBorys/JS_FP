# Your Energy 💪

**Your Energy** — це вебзастосунок для перегляду фізичних вправ, збереження улюблених тренувань та отримання щоденної мотивації для здорового способу життя.

Проєкт створений як навчальний, з використанням сучасного JavaScript, SCSS та збірника Vite.

---

## 🔍 Функціональність

- 📋 Перегляд списку вправ
- ⭐ Додавання та видалення вправ з обраного (Favorites)
- 💾 Збереження обраних вправ у `localStorage`
- 🧠 Щоденна мотиваційна цитата (API)
- 📩 Підписка на новини через email
- 📱 Адаптивний дизайн (mobile / tablet / desktop)
- 🍔 Мобільне меню з активною навігацією

---

## 🛠️ Використані технології

- **HTML5**
- **SCSS (Sass)**  
  - partial-файли (`_header.scss`, `_footer.scss`, тощо)
  - змінні та модульна структура
- **JavaScript (ES6+)**
- **Vite** — для збірки та dev-сервера
- **REST API**
- **LocalStorage**
- **modern-normalize**
- **sass-embedded**

---

## 📁 Структура проєкту

  src/
├── css/
│ ├── _base.scss
│ ├── _variables.scss
│ ├── _header.scss
│ ├── _footer.scss
│ ├── _hero.scss
│ ├── _exercises.scss
│ ├── _inspiration.scss
│ ├── _favourites-section.scss
│ └── styles.scss
│
├── js/
│ ├── favorites-section.js
│ ├── exercises-page.js
│ ├── mobile-nav.js
│ ├── daily-quote.js
│ └── newsletter.js
│
├── partials/
│ ├── header.html
│ ├── hero.html
│ ├── exercises.html
│ ├── inspiration.html
│ ├── favorites-section.html
│ └── footer.html
│
├── index.html
├── page-2.html
└── main.js

--

## 🚀 Запуск проєкту локально

1. Клонувати репозиторій:
```bash
git clone <repo-url>
Перейти у папку проєкту:

cd JS_FP
Встановити залежності:

npm install
Запустити dev-сервер:

npm run dev
Відкрити у браузері:

http://localhost:5173
⚠️ Важливо
Для коректної роботи SCSS використовується sass-embedded

Дані обраних вправ зберігаються у localStorage

Email-підписка та цитати використовують зовнішній API

👩‍💻 Автор
Проєкт виконаний у навчальних цілях.
Автор: Борис Роман