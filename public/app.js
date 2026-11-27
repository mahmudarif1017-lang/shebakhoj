'use strict';

// Browser code. It only talks to our own server; it never sees the API key.

const EXAMPLES = [
  'বাসার ফ্যান ঘুরছে না, বিদ্যুৎও কমে গেছে',
  'বাথরুমের পাইপ ফুটো, পানি পড়ছে',
  'Wi-Fi কাজ করছে না, ইন্টারনেট ধীর',
  'দেওয়ালে নতুন করে পেইন্ট করতে চাই',
  'বাড়িতে পরিষ্কারের কাজের লোক দরকার',
  'My laptop will not turn on, need a repair',
];

const elements = {
  query: document.getElementById('query'),
  searchButton: document.getElementById('search-btn'),
  searchButtonLabel: document.getElementById('search-btn-label'),
  examples: document.getElementById('example-list'),
  formError: document.getElementById('form-error'),
  results: document.getElementById('results'),
  category: document.getElementById('result-category'),
  modeBadge: document.getElementById('mode-badge'),
  summary: document.getElementById('result-summary'),
  note: document.getElementById('result-note'),
  keywords: document.getElementById('keyword-list'),
  providersTitle: document.getElementById('result-providers-title'),
  providerList: document.getElementById('provider-list'),
  emptyMessage: document.getElementById('empty-message'),
  demoProviderList: document.getElementById('demo-provider-list'),
};

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function makeChip(text, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chip';
  button.textContent = text;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

function renderExamples() {
  clear(elements.examples);
  for (const example of EXAMPLES) {
    elements.examples.appendChild(
      makeChip(example, () => {
        elements.query.value = example;
        elements.query.focus();
        runSearch();
      })
    );
  }
}

function setLoading(isLoading) {
  elements.searchButton.disabled = isLoading;
  elements.searchButtonLabel.textContent = isLoading ? 'খোঁজা হচ্ছে…' : 'সেবা খুঁজুন';
}

function showError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
  elements.results.hidden = true;
}

function renderProviders(providers) {
  clear(elements.providerList);
  for (const provider of providers) {
    const card = document.createElement('article');
    card.className = 'provider-card';

    const name = document.createElement('h4');
    name.textContent = provider.name;
    card.appendChild(name);

    const area = document.createElement('p');
    area.className = 'area';
    area.textContent = 'অবস্থান: ' + provider.area;
    card.appendChild(area);

    const list = document.createElement('ul');
    for (const specialty of provider.specialties) {
      const item = document.createElement('li');
      item.textContent = specialty;
      list.appendChild(item);
    }
    card.appendChild(list);

    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = provider.note;
    card.appendChild(note);

    elements.providerList.appendChild(card);
  }
}

function renderDemoProviders(providers) {
  clear(elements.demoProviderList);
  for (const provider of providers) {
    const card = document.createElement('article');
    card.className = 'demo-card';

    const top = document.createElement('div');
    top.className = 'demo-card-top';

    const name = document.createElement('h3');
    name.textContent = provider.name;

    const badge = document.createElement('span');
    badge.className = 'demo-badge';
    badge.textContent = 'ডেমো';

    top.appendChild(name);
    top.appendChild(badge);
    card.appendChild(top);

    const area = document.createElement('p');
    area.className = 'area';
    area.textContent = 'অবস্থান: ' + provider.area;
    card.appendChild(area);

    const list = document.createElement('ul');
    const specialties = Array.isArray(provider.specialties) ? provider.specialties.slice(0, 2) : [];
    for (const specialty of specialties) {
      const item = document.createElement('li');
      item.textContent = specialty;
      list.appendChild(item);
    }
    card.appendChild(list);

    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = provider.note;
    card.appendChild(note);

    elements.demoProviderList.appendChild(card);
  }
}

async function loadDemoProviders() {
  try {
    const response = await fetch('/api/providers');
    if (!response.ok) throw new Error('bad status');
    const data = await response.json();
    renderDemoProviders(Array.isArray(data.providers) ? data.providers : []);
  } catch {
    clear(elements.demoProviderList);
    const message = document.createElement('p');
    message.className = 'muted';
    message.textContent = 'ডেমো প্রদানকারী লোড করা যায়নি। পরে আবার চেষ্টা করুন।';
    elements.demoProviderList.appendChild(message);
  }
}

function renderResult(data) {
  elements.formError.hidden = true;
  elements.category.textContent = data.categoryLabel || 'অন্যান্য';
  elements.summary.textContent = data.summary || '';

  elements.modeBadge.textContent = data.mode === 'ai' ? 'AI বিশ্লেষণ' : 'ডেমো মোড';
  elements.modeBadge.classList.toggle('demo', data.mode !== 'ai');

  if (data.note) {
    elements.note.textContent = data.note;
    elements.note.hidden = false;
  } else {
    elements.note.hidden = true;
  }

  clear(elements.keywords);
  for (const keyword of data.keywords || []) {
    const chip = document.createElement('span');
    chip.className = 'chip static';
    chip.textContent = keyword;
    elements.keywords.appendChild(chip);
  }
  if (!data.keywords || data.keywords.length === 0) {
    const chip = document.createElement('span');
    chip.className = 'chip static';
    chip.textContent = 'কোনো শব্দ পাওয়া যায়নি';
    elements.keywords.appendChild(chip);
  }

  const hasProviders = Array.isArray(data.providers) && data.providers.length > 0;
  elements.providersTitle.textContent = hasProviders
    ? 'মিলে যাওয়া ডেমো প্রদানকারী'
    : 'কোনো মিল পাওয়া যায়নি';
  renderProviders(hasProviders ? data.providers : []);

  if (!hasProviders) {
    elements.emptyMessage.textContent =
      data.emptyMessage || 'এই বর্ণনার সাথে মেলে এমন কোনো ডেমো প্রদানকারী নেই।';
    elements.emptyMessage.hidden = false;
  } else {
    elements.emptyMessage.hidden = true;
  }

  elements.results.hidden = false;
  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  elements.results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

async function runSearch() {
  const query = elements.query.value.trim();
  if (!query) {
    showError('অনুগ্রহ করে প্রথমে সমস্যাটি কয়েক শব্দে লিখুন।');
    elements.query.focus();
    return;
  }

  setLoading(true);
  elements.formError.hidden = true;

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (!response.ok) {
      showError(data.error || 'অনুসন্ধানে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      return;
    }
    renderResult(data);
  } catch {
    showError('সার্ভারের সাথে যোগাযোগ করা যায়নি। সার্ভার চলছে কি না দেখুন।');
  } finally {
    setLoading(false);
  }
}

elements.searchButton.addEventListener('click', runSearch);
elements.query.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    runSearch();
  }
});

renderExamples();
loadDemoProviders();
