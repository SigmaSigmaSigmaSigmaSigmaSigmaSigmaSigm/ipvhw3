import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.js';

const courses = ['Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing', 'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics'];
const teachers = [];
for (const user of [...randomUserMock, ...additionalUsers]) {
  const name = user.full_name || `${user.name.first} ${user.name.last}`;
  const existing = teachers.find((teacher) => teacher.full_name === name);
  if (existing) {
    existing.favorite ||= Boolean(user.favorite);
    continue;
  }
  const birthday = user.b_day || user.dob?.date || '';
  teachers.push({
    id: String(teachers.length + 1), full_name: name,
    course: user.course || courses[Math.floor(Math.random() * courses.length)],
    country: user.country || user.location?.country || '',
    city: user.city || user.location?.city || '',
    age: user.age ?? user.dob?.age ?? getAge(birthday),
    b_day: birthday, gender: user.gender || '',
    email: user.email || '', phone: user.phone || '',
    picture: user.picture_large || user.picture?.large || '',
    favorite: Boolean(user.favorite), note: user.note || '',
    bg_color: user.bg_color || '#ffffff',
  });
}

function getAge(birthday) {
  if (!birthday) return 0;
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

const list = document.querySelector('#teacher-list');
const favorites = document.querySelector('#favorites-list');
const template = list.firstElementChild.cloneNode(true);
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const country = document.querySelector('#region');
const info = document.querySelector('#info-dialog');
const add = document.querySelector('#add-dialog');
let currentTeacher;
let sortField = 'full_name';
let descending = false;

function updateCountries() {
  const selected = country.value;
  country.replaceChildren(new Option('All', ''));
  for (const value of [...new Set(teachers.map((teacher) => teacher.country))].sort()) {
    if (value) country.add(new Option(value, value));
  }
  country.value = selected;
}

function makeCard(teacher) {
  const card = template.cloneNode(true);
  for (const key of Object.keys(card.dataset)) delete card.dataset[key];
  card.dataset.id = teacher.id;
  card.querySelector('.teacher-name').textContent = teacher.full_name;
  card.querySelector('.speciality').textContent = teacher.course;
  card.querySelector('.country').textContent = teacher.country;
  const avatar = card.querySelector('.avatar');
  avatar.replaceChildren();
  if (teacher.picture) {
    const image = document.createElement('img');
    image.src = teacher.picture;
    image.alt = '';
    avatar.append(image);
  } else {
    const initials = document.createElement('span');
    initials.className = 'initials';
    initials.textContent = teacher.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('.');
    avatar.style.backgroundColor = teacher.bg_color;
    avatar.append(initials);
  }
  card.querySelector('button').setAttribute('aria-label', `Information about ${teacher.full_name}`);
  if (teacher.favorite) {
    const star = document.createElement('span');
    star.className = 'favorite-badge';
    star.textContent = '★';
    star.setAttribute('aria-label', 'Favorite');
    card.append(star);
  }
  return card;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const range = document.querySelector('#age').value;
  const [min, max] = range ? range.split('-').map(Number) : [0, Infinity];
  const gender = document.querySelector('#sex').value;
  const visible = teachers.filter((teacher) =>
    (!country.value || teacher.country === country.value) &&
    teacher.age >= min && teacher.age <= max &&
    (!gender || teacher.gender === gender) &&
    (!document.querySelector('#only-favorites').checked || teacher.favorite) &&
    (!document.querySelector('#with-photo').checked || teacher.picture) &&
    `${teacher.full_name} ${teacher.note} ${teacher.age}`.toLowerCase().includes(query));
  list.replaceChildren(...visible.map(makeCard));
  favorites.replaceChildren(...teachers.filter((teacher) => teacher.favorite).map(makeCard));
  const rows = [...teachers].sort((a, b) => {
    const result = sortField === 'age' ? a.age - b.age : String(a[sortField]).localeCompare(String(b[sortField]));
    return descending ? -result : result;
  });
  const body = document.querySelector('#statistics-body');
  body.replaceChildren();
  for (const teacher of rows) {
    const row = body.insertRow();
    for (const field of ['full_name', 'course', 'age', 'gender', 'country', 'b_day']) {
      row.insertCell().textContent = field === 'b_day' ? teacher.b_day.slice(0, 10) : teacher[field];
    }
  }
}

function showTeacher(teacher) {
  currentTeacher = teacher;
  document.querySelector('#profile-photo').replaceChildren(makeCard(teacher).querySelector('.avatar').cloneNode(true));
  for (const [id, value] of Object.entries({ name: teacher.full_name, speciality: teacher.course,
    location: `${teacher.city}, ${teacher.country}`, demographics: `${teacher.age}, ${teacher.gender}`, notes: teacher.note })) {
    document.querySelector(`#profile-${id}`).textContent = value;
  }
  for (const field of ['email', 'phone']) {
    const link = document.querySelector(`#profile-${field}`);
    link.textContent = teacher[field];
    link.href = (field === 'email' ? 'mailto:' : 'tel:') + teacher[field];
    link.parentElement.hidden = !teacher[field];
  }
  const star = document.querySelector('#profile-favorite');
  star.textContent = teacher.favorite ? '★' : '☆';
  star.setAttribute('aria-pressed', String(teacher.favorite));
  star.setAttribute('aria-label', teacher.favorite ? 'Remove from favorites' : 'Add to favorites');
  document.querySelector('#profile-map').href = 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(`${teacher.city} ${teacher.country}`);
  document.querySelector('.map-details').open = false;
  if (!info.open) info.showModal();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.matches('.add-teacher')) add.showModal();
  if (button.matches('.close-dialog')) button.closest('dialog').close();
  if (button.matches('.teacher-open')) showTeacher(teachers.find((teacher) => teacher.id === button.closest('.teacher-card').dataset.id));
  if (button.id === 'profile-favorite') {
    currentTeacher.favorite = !currentTeacher.favorite;
    render();
    showTeacher(currentTeacher);
  }
  if (button.dataset.sort) {
    descending = sortField === button.dataset.sort ? !descending : false;
    sortField = button.dataset.sort;
    for (const heading of document.querySelectorAll('th')) heading.removeAttribute('aria-sort');
    button.closest('th').setAttribute('aria-sort', descending ? 'descending' : 'ascending');
    render();
  }
});
search.addEventListener('input', render);
filters.addEventListener('change', render);
document.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id !== 'teacher-form') return;
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  if (!data.name.trim()) {
    form.elements.name.setCustomValidity('Enter a name');
    form.elements.name.reportValidity();
    return;
  }
  teachers.push({ id: String(teachers.length + 1), full_name: data.name.trim(), course: data.speciality,
    country: data.country, city: data.city.trim(), age: getAge(data.birth), b_day: data.birth,
    gender: data.sex, email: data.email, phone: data.phone, note: data.notes,
    bg_color: data.color, picture: '', favorite: false });
  form.reset();
  filters.reset();
  search.value = '';
  updateCountries();
  render();
  add.close();
});
document.querySelector('#teacher-form').elements.name.addEventListener('input', (event) => event.target.setCustomValidity(''));
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
document.querySelector('[name="birth"]').max = today.toISOString().slice(0, 10);
updateCountries();
render();
