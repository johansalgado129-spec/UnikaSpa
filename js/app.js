/* Unika Spa Holístico · catálogo público */
(() => {
  'use strict';

  const WHATSAPP = '19393979462';
  const CATEGORIES = [
    { id: 'all', es: 'Todos', en: 'All' },
    { id: 'facial', es: 'Faciales', en: 'Facials' },
    { id: 'masajes', es: 'Masajes', en: 'Massage' },
    { id: 'pestanas', es: 'Pestañas y cejas', en: 'Lashes & brows' },
    { id: 'unas', es: 'Uñas', en: 'Nails' },
    { id: 'cabello', es: 'Cabello', en: 'Hair' },
    { id: 'depilacion', es: 'Depilación', en: 'Waxing' }
  ];
  const IMAGE_BY_CATEGORY = {
    facial: 'assets/images/facial.webp',
    masajes: 'assets/images/masajes.webp',
    pestanas: 'assets/images/pestanas.webp',
    unas: 'assets/images/unas.webp',
    cabello: 'assets/images/cabello.webp',
    depilacion: 'assets/images/depilacion.webp'
  };

  let items = [];
  let language = 'es';
  let activeCategory = 'all';
  let searchText = '';
  const selectedIds = new Set();
  let previousFocus = null;
  let toastTimeout;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const t = (es, en) => language === 'es' ? es : en;
  const categoryName = (id) => {
    const category = CATEGORIES.find((entry) => entry.id === id);
    return category ? category[language] : id;
  };
  const priceText = (item) => {
    if (item.priceType === 'consult' || item.price === null || item.price === '') return t('Consultar', 'Ask us');
    const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(item.price));
    return item.priceType === 'from' ? `${t('Desde', 'From')} ${price}` : price;
  };
  const displayName = (item) => language === 'en' && item.nameEn ? item.nameEn : item.name;
  const displayDescription = (item) => language === 'en' && item.descriptionEn ? item.descriptionEn : item.description;
  const normalized = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

  function localizePage() {
    document.documentElement.lang = language;
    $$('[data-es][data-en]').forEach((element) => {
      const value = element.dataset[language];
      if (value.includes('<em>')) element.innerHTML = value;
      else element.textContent = value;
    });
    const switchButton = $('#language-switch');
    switchButton.textContent = language === 'es' ? 'EN' : 'ES';
    switchButton.setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
    $('#search-input').placeholder = t('Buscar servicio...', 'Search service...');
    $('#menu-toggle').setAttribute('aria-label', t('Abrir menú', 'Open menu'));
    $('#close-selection').setAttribute('aria-label', t('Cerrar selección', 'Close selection'));
    renderFilters();
    renderServices();
    renderSelection();
  }

  function renderFilters() {
    const container = $('#category-filters');
    container.replaceChildren();
    CATEGORIES.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-chip' + (activeCategory === category.id ? ' active' : '');
      button.textContent = category[language];
      button.setAttribute('aria-pressed', String(activeCategory === category.id));
      button.addEventListener('click', () => {
        activeCategory = category.id;
        renderFilters();
        renderServices();
      });
      container.append(button);
    });
  }

  function renderServices() {
    const grid = $('#service-grid');
    grid.replaceChildren();
    const query = normalized(searchText);
    const matching = items.filter((item) => {
      if (item.visible === false) return false;
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      return !query || normalized([item.name, item.nameEn, item.description, item.descriptionEn, categoryName(item.category)].join(' ')).includes(query);
    });
    matching.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'service-card';
      const media = document.createElement('div');
      media.className = 'service-card-media';
      const img = document.createElement('img');
      img.src = IMAGE_BY_CATEGORY[item.category] || IMAGE_BY_CATEGORY.facial;
      img.alt = '';
      img.loading = 'lazy';
      media.append(img);
      const body = document.createElement('div');
      body.className = 'service-card-body';
      const category = document.createElement('span');
      category.className = 'service-category';
      category.textContent = categoryName(item.category);
      const name = document.createElement('h3');
      name.textContent = displayName(item);
      const description = document.createElement('p');
      description.textContent = displayDescription(item);
      const foot = document.createElement('div');
      foot.className = 'service-card-foot';
      const price = document.createElement('strong');
      price.className = 'service-price';
      price.textContent = priceText(item);
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'add-service' + (selectedIds.has(item.id) ? ' is-selected' : '');
      action.textContent = selectedIds.has(item.id) ? t('✓ Seleccionado', '✓ Selected') : t('+ Elegir', '+ Select');
      action.setAttribute('aria-pressed', String(selectedIds.has(item.id)));
      action.setAttribute('aria-label', selectedIds.has(item.id) ? t(`Quitar ${item.name}`, `Remove ${displayName(item)}`) : t(`Elegir ${item.name}`, `Select ${displayName(item)}`));
      action.addEventListener('click', () => toggleItem(item.id));
      foot.append(price, action);
      body.append(category, name, description, foot);
      card.append(media, body);
      grid.append(card);
    });
    $('#results-count').textContent = t(`${matching.length} servicios`, `${matching.length} services`);
    $('#empty-results').hidden = matching.length > 0;
  }

  function toggleItem(id) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
      showToast(t('Servicio retirado de tu selección', 'Service removed from your selection'));
    } else {
      selectedIds.add(id);
      showToast(t('Añadido a tu selección', 'Added to your selection'));
    }
    renderServices();
    renderSelection();
  }

  function renderSelection() {
    const chosen = items.filter((item) => item.visible !== false && selectedIds.has(item.id));
    const selected = $('#selected-items');
    selected.replaceChildren();
    if (!chosen.length) {
      const empty = document.createElement('div');
      empty.className = 'selection-empty';
      empty.innerHTML = '<span aria-hidden="true">✳</span>';
      const message = document.createElement('p');
      message.textContent = t('Todavía no has elegido servicios. Explora el catálogo y añade tus favoritos.', 'You haven’t selected any services yet. Browse the catalog and add your favorites.');
      empty.append(message);
      selected.append(empty);
    }
    chosen.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'selected-row';
      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = displayName(item);
      const price = document.createElement('span');
      price.textContent = priceText(item);
      info.append(title, price);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.className = 'remove-selected';
      remove.setAttribute('aria-label', t(`Quitar ${item.name}`, `Remove ${displayName(item)}`));
      remove.addEventListener('click', () => toggleItem(item.id));
      row.append(info, remove);
      selected.append(row);
    });
    const total = chosen.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(total);
    const hasVariable = chosen.some((item) => item.priceType !== 'fixed');
    $('#selection-total').textContent = hasVariable ? `${money} +` : money;
    $('#selection-count-top').textContent = chosen.length;
    $('#floating-count').textContent = chosen.length;
    $('#floating-selection').hidden = chosen.length === 0;
    const link = $('#checkout-whatsapp');
    link.classList.toggle('disabled', !chosen.length);
    link.setAttribute('aria-disabled', String(!chosen.length));
    link.tabIndex = chosen.length ? 0 : -1;
    if (!chosen.length) { link.href = '#'; return; }
    const lines = chosen.map((item) => `• ${displayName(item)} — ${priceText(item)}`).join('\n');
    const message = language === 'es'
      ? `Hola, Unika Spa Holístico. Me gustaría consultar disponibilidad para los siguientes servicios:\n\n${lines}\n\nTotal de referencia: ${money}${hasVariable ? ' (puede variar)' : ''}.\n¿Podrían indicarme horarios disponibles y la ubicación exacta? Entiendo que la cita y el precio final deben confirmarse.`
      : `Hello, Unika Spa Holístico. I'd like to ask about availability for these services:\n\n${lines}\n\nReference total: ${money}${hasVariable ? ' (may vary)' : ''}.\nCould you share available appointment times and your exact location? I understand the booking and final price must be confirmed.`;
    link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  function openDrawer() {
    previousFocus = document.activeElement;
    $('#drawer-backdrop').hidden = false;
    $('#selection-drawer').classList.add('open');
    $('#selection-drawer').setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    $('#close-selection').focus();
  }

  function closeDrawer() {
    $('#selection-drawer').classList.remove('open');
    $('#selection-drawer').setAttribute('aria-hidden', 'true');
    $('#drawer-backdrop').hidden = true;
    document.body.classList.remove('drawer-open');
    previousFocus?.focus();
  }

  function initializeEvents() {
    $('#language-switch').addEventListener('click', () => { language = language === 'es' ? 'en' : 'es'; localizePage(); });
    $('#search-input').addEventListener('input', (event) => { searchText = event.target.value; renderServices(); });
    $('#clear-filters').addEventListener('click', () => { activeCategory = 'all'; searchText = ''; $('#search-input').value = ''; renderFilters(); renderServices(); });
    $$('.category-tile').forEach((tile) => tile.addEventListener('click', () => { activeCategory = tile.dataset.category; searchText = ''; $('#search-input').value = ''; renderFilters(); renderServices(); $('#servicios').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }));
    $('#open-selection-top').addEventListener('click', openDrawer);
    $('#floating-selection').addEventListener('click', openDrawer);
    $('#close-selection').addEventListener('click', closeDrawer);
    $('#drawer-backdrop').addEventListener('click', closeDrawer);
    $('#clear-selection').addEventListener('click', () => { selectedIds.clear(); renderServices(); renderSelection(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && $('#selection-drawer').classList.contains('open')) closeDrawer();
      if (event.key === 'Tab' && $('#selection-drawer').classList.contains('open')) {
        const focusables = Array.from($('#selection-drawer').querySelectorAll('button:not(:disabled),a[href]:not([tabindex="-1"])'));
        if (!focusables.length) return;
        if (event.shiftKey && document.activeElement === focusables[0]) { event.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === focusables[focusables.length - 1]) { event.preventDefault(); focusables[0].focus(); }
      }
    });
    const menuButton = $('#menu-toggle');
    const nav = $('#primary-nav');
    const closeMenu = () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); };
    menuButton.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('click', (event) => { if (!nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu(); });
  }

  async function init() {
    $('#year').textContent = new Date().getFullYear();
    initializeEvents();
    try {
      const response = await fetch('data/catalogo.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.items)) throw new Error('Formato de catálogo inválido');
      items = data.items;
      localizePage();
    } catch (error) {
      console.error('No se pudo cargar el catálogo:', error);
      const grid = $('#service-grid');
      const info = document.createElement('div');
      info.className = 'loading-error';
      info.textContent = 'No se pudo cargar el catálogo. Abre el sitio desde un servidor web o inténtalo más tarde.';
      grid.replaceChildren(info);
      $('#results-count').textContent = '';
      renderFilters();
      renderSelection();
    }
  }

  init();
})();
