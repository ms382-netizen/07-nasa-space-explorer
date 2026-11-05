// =============================================================
// NASA Space Explorer — script.js
// Fetches Astronomy Picture of the Day (APOD) entries for the
// selected date range and shows them in a gallery with a modal.
// =============================================================

// "DEMO_KEY" works without signing up, but is limited (~30 requests/hour).
// For higher limits, get a free key at https://api.nasa.gov and paste it here.
const API_KEY = 'MQpgqQhJKPpgnL8bfgbgLmBTLGFmdngMqRmr7mtT';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// ---- Grab elements from the starter page ----
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton =
  document.querySelector('.filters button') || document.querySelector('button');
const gallery = document.getElementById('gallery');

// Provided by dateRange.js: sets default range + limits (June 16, 1995 → today)
setupDateInputs(startInput, endInput);

// =============================================================
// LevelUp: Random "Did You Know?" space fact
// =============================================================
const spaceFacts = [
  'A day on Venus is longer than its year — it takes 243 Earth days to spin once, but only 225 to orbit the Sun.',
  'Neutron stars are so dense that a teaspoon of their material would weigh about a billion tons on Earth.',
  'There are more stars in the observable universe than grains of sand on all of Earth’s beaches.',
  'Footprints left on the Moon by Apollo astronauts could last millions of years — there’s no wind to erase them.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Jupiter’s Great Red Spot is a storm wider than Earth that has been raging for over 300 years.',
  'Saturn is less dense than water — in a big enough bathtub, it would float.',
  'The International Space Station orbits Earth about every 90 minutes, so astronauts see 16 sunrises a day.',
  'Olympus Mons on Mars is the tallest volcano in the solar system — about 2.5 times the height of Mount Everest.',
  'The Milky Way and the Andromeda galaxy are on course to collide in about 4.5 billion years.',
  'Space is completely silent — there’s no air for sound waves to travel through.',
  'One million Earths could fit inside the Sun.',
];

function showRandomFact() {
  const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
  const section = document.createElement('section');
  section.className = 'space-fact';
  section.setAttribute('aria-label', 'Random space fact');

  const heading = document.createElement('h2');
  heading.textContent = '🪐 Did You Know?';
  const text = document.createElement('p');
  text.textContent = fact;

  section.append(heading, text);
  gallery.parentNode.insertBefore(section, gallery); // sits right above the gallery
}

// =============================================================
// Helpers
// =============================================================

// "2026-11-05" -> "November 5, 2026" (adding T00:00 avoids a timezone shift)
function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// "2026-11-05" -> "https://apod.nasa.gov/apod/ap261105.html"
function getApodPageUrl(dateString) {
  const [year, month, day] = dateString.split('-');
  return `https://apod.nasa.gov/apod/ap${year.slice(2)}${month}${day}.html`;
}

// Turns YouTube/Vimeo links into embeddable URLs. Returns null if it can't.
function getEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/')) return url;

  const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

function showMessage(html, className) {
  gallery.innerHTML = `<div class="${className}">${html}</div>`;
}

// =============================================================
// Fetch data from NASA's APOD API
// =============================================================
async function fetchApodData(startDate, endDate) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    start_date: startDate,
    end_date: endDate,
    thumbs: 'true', // asks NASA for thumbnail images of video entries
  });

  const response = await fetch(`${APOD_URL}?${params}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        'NASA’s rate limit was reached for the demo key. Wait a bit and try again, or add your own free API key in script.js.'
      );
    }
    let detail = '';
    try {
      const body = await response.json();
      detail = body.msg || (body.error && body.error.message) || '';
    } catch (e) {
      /* response wasn't JSON — ignore */
    }
    throw new Error(detail || `NASA’s API returned an error (status ${response.status}).`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : [data];

  // Newest first
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

// When NASA's site is missing a day's picture, the API sends a generic
// "NASA Science" placeholder instead. We hide those so the gallery only
// shows real Astronomy Pictures of the Day.
function isPlaceholder(item) {
  const title = (item.title || '').trim().toLowerCase();
  const explanation = (item.explanation || '').toLowerCase();
  return (
    title === 'nasa science' ||
    explanation.includes('no longer available') ||
    explanation.includes('default image')
  );
}

// =============================================================
// Gallery
// =============================================================
function createGalleryItem(item) {
  const card = document.createElement('div');
  card.className = 'gallery-item';
  card.tabIndex = 0; // keyboard accessible
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open details for ${item.title}`);

  const media = document.createElement('div');
  media.className = 'gallery-media';

  // Pick a thumbnail: images use "url" (loads faster than hdurl);
  // videos use the thumbnail NASA gives us, if there is one.
  const thumb = item.media_type === 'video' ? item.thumbnail_url : item.url;

  if (item.media_type !== 'video' && item.media_type !== 'image') {
    media.classList.add('no-thumb');
    media.textContent = '🌌 View on APOD';
  } else if (thumb) {
    const img = document.createElement('img');
    img.src = thumb;
    img.alt = item.title;
    img.loading = 'lazy';
    media.appendChild(img);
  } else {
    media.classList.add('no-thumb');
    media.textContent = '🎬';
  }

  // LevelUp: label video entries clearly
  if (item.media_type === 'video') {
    const badge = document.createElement('span');
    badge.className = 'video-badge';
    badge.textContent = '▶ Video';
    media.appendChild(badge);
  }

  const info = document.createElement('div');
  info.className = 'gallery-info';
  const title = document.createElement('h3');
  title.textContent = item.title;
  const date = document.createElement('p');
  date.className = 'gallery-date';
  date.textContent = formatDate(item.date);
  info.append(title, date);

  card.append(media, info);

  card.addEventListener('click', () => openModal(item, card));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(item, card);
    }
  });

  return card;
}

function renderGallery(items) {
  gallery.innerHTML = '';
  if (items.length === 0) {
    showMessage('<p>No entries found for that range. Try different dates!</p>', 'placeholder');
    return;
  }
  items.forEach((item) => gallery.appendChild(createGalleryItem(item)));
}

// =============================================================
// Modal (built here so index.html doesn't need changes)
// =============================================================
const modal = document.createElement('div');
modal.className = 'modal';
modal.hidden = true;
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-labelledby', 'modalTitle');
modal.innerHTML = `
  <div class="modal-content">
    <button class="modal-close" aria-label="Close">&times;</button>
    <div class="modal-media"></div>
    <div class="modal-body">
      <p class="modal-date"></p>
      <h2 id="modalTitle" class="modal-title"></h2>
      <p class="modal-explanation"></p>
      <p class="modal-credit"></p>
      <a class="modal-link" target="_blank" rel="noopener">View on NASA’s APOD site ↗</a>
    </div>
  </div>
`;
document.body.appendChild(modal);

const modalMedia = modal.querySelector('.modal-media');
const modalTitle = modal.querySelector('.modal-title');
const modalDate = modal.querySelector('.modal-date');
const modalExplanation = modal.querySelector('.modal-explanation');
const modalCredit = modal.querySelector('.modal-credit');
const modalLink = modal.querySelector('.modal-link');
const closeButton = modal.querySelector('.modal-close');
let lastFocusedCard = null;

function openModal(item, card) {
  lastFocusedCard = card;
  modalMedia.innerHTML = '';
  const apodPage = getApodPageUrl(item.date);

  if (item.media_type === 'image') {
    const img = document.createElement('img');
    img.src = item.hdurl || item.url; // larger version
    img.alt = item.title;
    modalMedia.appendChild(img);
  } else if (item.media_type === 'video') {
    const embedUrl = getEmbedUrl(item.url);
    if (embedUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.title = item.title;
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else if (item.url && /\.(mp4|webm|mov)$/i.test(item.url)) {
      const video = document.createElement('video');
      video.src = item.url;
      video.controls = true;
      modalMedia.appendChild(video);
    } else {
      modalMedia.appendChild(makeVideoLink(item.url || apodPage));
    }
  } else {
    modalMedia.appendChild(makeVideoLink(apodPage, '🌌 Open this entry on NASA’s site'));
  }

  modalDate.textContent = formatDate(item.date);
  modalTitle.textContent = item.title;
  modalExplanation.textContent = item.explanation;
  modalCredit.textContent = item.copyright ? `© ${item.copyright.trim()}` : '';
  modalLink.href = apodPage;

  modal.hidden = false;
  document.body.classList.add('modal-open');
  closeButton.focus();
}

function makeVideoLink(url, label = '▶ Watch this video') {
  const link = document.createElement('a');
  link.className = 'video-link';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = label;
  return link;
}

function closeModal() {
  modal.hidden = true;
  modalMedia.innerHTML = ''; // stops any playing video
  document.body.classList.remove('modal-open');
  if (lastFocusedCard) lastFocusedCard.focus();
}

closeButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal(); // click on dark backdrop
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) closeModal();
});

// =============================================================
// Button: load the gallery
// =============================================================
getImagesButton.addEventListener('click', async () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showMessage('<p>Please choose both a start and an end date.</p>', 'placeholder error');
    return;
  }
  if (startDate > endDate) {
    showMessage('<p>The start date needs to be before the end date.</p>', 'placeholder error');
    return;
  }

  showMessage('<span class="spinner" aria-hidden="true"></span><p>🔄 Loading space photos…</p>', 'loading');
  getImagesButton.disabled = true;

  try {
    const allItems = await fetchApodData(startDate, endDate);
    const items = allItems.filter((item) => !isPlaceholder(item));

    if (allItems.length > 0 && items.length === 0) {
      showMessage(
        '<div class="placeholder-icon">🛰️</div><p>NASA doesn’t have pictures available for these dates right now. Try an earlier date range!</p>',
        'placeholder'
      );
      return;
    }

    renderGallery(items);
  } catch (error) {
    console.error(error);
    const p = document.createElement('p');
    p.textContent = `⚠️ ${error.message || 'Something went wrong. Check your connection and try again.'}`;
    gallery.innerHTML = '<div class="placeholder error"></div>';
    gallery.firstChild.appendChild(p);
  } finally {
    getImagesButton.disabled = false;
  }
});

showRandomFact();