/* Unika Spa Holístico · administrador sin persistencia de credenciales */
(() => {
  'use strict';
  const CATEGORIES = { facial: 'Faciales', masajes: 'Masajes', pestanas: 'Pestañas y cejas', unas: 'Uñas', cabello: 'Cabello', depilacion: 'Depilación' };
  const GITHUB_FILE = 'data/catalogo.json';
  const $ = (selector) => document.querySelector(selector);
  let catalog = { version: 1, currency: 'USD', updatedAt: '', items: [] };
  let editingId = null;
  let dirty = false;
  let tokenInMemory = '';
  let repository = null;
  let currentSha = null;

  const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const money = (item) => item.priceType === 'consult' || item.price === null
    ? 'Consultar'
    : `${item.priceType === 'from' ? 'Desde ' : ''}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(item.price)}`;
  const jsonString = () => JSON.stringify(catalog, null, 2) + '\n';

  function setStatus(message, type = 'info') {
    const element = $('#status-message');
    element.textContent = message;
    element.dataset.type = type;
  }

  function updateDirty() {
    dirty = true;
    $('#save-github').disabled = !repository;
    setStatus(repository ? 'Tienes cambios sin publicar en GitHub.' : 'Tienes cambios locales. Descarga el JSON para conservarlos.', 'warning');
    render();
  }

  function validateCatalog(data) {
    if (!data || !Array.isArray(data.items)) throw new Error('El archivo debe contener un arreglo «items».');
    const ids = new Set();
    for (const item of data.items) {
      if (!item || typeof item.id !== 'string' || !item.id.trim()) throw new Error('Un servicio no tiene identificador válido.');
      if (ids.has(item.id)) throw new Error(`El identificador ${item.id} está duplicado.`);
      ids.add(item.id);
      if (typeof item.name !== 'string' || !item.name.trim()) throw new Error(`El servicio ${item.id} necesita un nombre.`);
      if (!Object.hasOwn(CATEGORIES, item.category)) throw new Error(`Categoría desconocida en ${item.id}.`);
      if (!['fixed', 'from', 'consult'].includes(item.priceType)) throw new Error(`Tipo de precio desconocido en ${item.id}.`);
      if (item.priceType !== 'consult' && (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) throw new Error(`Precio inválido en ${item.id}.`);
      if (typeof item.visible !== 'boolean') throw new Error(`Visibilidad inválida en ${item.id}.`);
    }
    return { version: Number(data.version) || 1, currency: 'USD', updatedAt: data.updatedAt || '', items: data.items.map((item) => ({
      id: item.id, category: item.category, name: item.name, nameEn: String(item.nameEn || ''),
      description: String(item.description || ''), descriptionEn: String(item.descriptionEn || ''),
      price: item.priceType === 'consult' ? null : Number(item.price), priceType: item.priceType, visible: item.visible
    })) };
  }

  function render() {
    const items = catalog.items;
    $('#stat-total').textContent = items.length;
    $('#stat-visible').textContent = items.filter((item) => item.visible).length;
    $('#stat-hidden').textContent = items.filter((item) => !item.visible).length;
    $('#stat-categories').textContent = new Set(items.map((item) => item.category)).size;
    const search = normalize($('#admin-search').value);
    const category = $('#admin-category').value;
    const visibility = $('#admin-visibility').value;
    const filtered = items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (visibility === 'visible' && !item.visible) return false;
      if (visibility === 'hidden' && item.visible) return false;
      return !search || normalize([item.name, item.nameEn, item.description, item.descriptionEn].join(' ')).includes(search);
    });
    const body = $('#admin-tbody');
    body.replaceChildren();
    filtered.forEach((item) => {
      const row = document.createElement('tr');
      if (!item.visible) row.className = 'row-hidden';
      const main = document.createElement('td');
      const title = document.createElement('strong'); title.textContent = item.name;
      const desc = document.createElement('small'); desc.textContent = item.description || item.nameEn || 'Sin descripción';
      main.append(title, desc);
      const categoryCell = document.createElement('td'); categoryCell.textContent = CATEGORIES[item.category];
      const priceCell = document.createElement('td'); priceCell.className = 'price-cell'; priceCell.textContent = money(item);
      const stateCell = document.createElement('td');
      const badge = document.createElement('span'); badge.className = 'visibility-badge ' + (item.visible ? 'is-visible' : 'is-hidden'); badge.textContent = item.visible ? 'Visible' : 'Oculto';
      stateCell.append(badge);
      const actions = document.createElement('td'); actions.className = 'row-actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Editar'; edit.addEventListener('click', () => openForm(item.id));
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.textContent = item.visible ? 'Ocultar' : 'Mostrar'; toggle.addEventListener('click', () => { item.visible = !item.visible; updateDirty(); });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-action'; remove.textContent = 'Eliminar'; remove.addEventListener('click', () => {
        if (!window.confirm(`¿Eliminar «${item.name}» del catálogo? Podrás recuperar el archivo anterior si aún no publicas.`)) return;
        catalog.items = catalog.items.filter((candidate) => candidate.id !== item.id);
        updateDirty();
      });
      actions.append(edit, toggle, remove);
      row.append(main, categoryCell, priceCell, stateCell, actions);
      body.append(row);
    });
    if (!filtered.length) {
      const row = document.createElement('tr'); const cell = document.createElement('td');
      cell.colSpan = 5; cell.className = 'table-empty'; cell.textContent = 'No hay servicios que coincidan con estos filtros.';
      row.append(cell); body.append(row);
    }
    $('#admin-results').textContent = `Mostrando ${filtered.length} de ${items.length} servicios.`;
  }

  function openForm(id = null) {
    editingId = id;
    const item = catalog.items.find((candidate) => candidate.id === id);
    $('#product-dialog-title').textContent = item ? 'Editar servicio' : 'Nuevo servicio';
    $('#field-name').value = item?.name || '';
    $('#field-name-en').value = item?.nameEn || '';
    $('#field-category').value = item?.category || 'facial';
    $('#field-price-type').value = item?.priceType || 'fixed';
    $('#field-price').value = item?.price ?? '';
    $('#field-description').value = item?.description || '';
    $('#field-description-en').value = item?.descriptionEn || '';
    $('#field-visible').checked = item ? item.visible : true;
    $('#form-error').hidden = true;
    togglePriceField();
    $('#product-dialog').showModal();
    $('#field-name').focus();
  }

  function togglePriceField() {
    const consult = $('#field-price-type').value === 'consult';
    $('#field-price').disabled = consult;
    $('#field-price').required = !consult;
    if (consult) $('#field-price').value = '';
  }

  function saveForm(event) {
    event.preventDefault();
    const name = $('#field-name').value.trim();
    const nameEn = $('#field-name-en').value.trim();
    const category = $('#field-category').value;
    const priceType = $('#field-price-type').value;
    const rawPrice = $('#field-price').value;
    const price = priceType === 'consult' ? null : Number(rawPrice);
    const invalid = !name || name.length > 130 || !Object.hasOwn(CATEGORIES, category) || !['fixed', 'from', 'consult'].includes(priceType)
      || (priceType !== 'consult' && (rawPrice === '' || !Number.isFinite(price) || price < 0 || price > 100000 || Math.abs(Math.round(price * 100) - price * 100) > 0.000001));
    if (invalid) {
      $('#form-error').textContent = 'Revisa el nombre, la categoría y el precio. El precio debe ser un número válido en USD.';
      $('#form-error').hidden = false;
      return;
    }
    const record = {
      id: editingId || `servicio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      category, name, nameEn, description: $('#field-description').value.trim(),
      descriptionEn: $('#field-description-en').value.trim(), price, priceType,
      visible: $('#field-visible').checked
    };
    if (editingId) {
      const index = catalog.items.findIndex((item) => item.id === editingId);
      if (index < 0) return;
      catalog.items[index] = record;
    } else {
      catalog.items.push(record);
    }
    $('#product-dialog').close();
    updateDirty();
  }

  function exportJson() {
    catalog.updatedAt = new Date().toISOString().slice(0, 10);
    const blob = new Blob([jsonString()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'catalogo.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setStatus('JSON descargado. Reemplaza data/catalogo.json en tu repositorio para actualizar la web.', 'success');
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (dirty && !confirm('Tienes cambios locales. ¿Reemplazar el catálogo actual con este JSON?')) return;
    try {
      if (file.size > 1000000) throw new Error('El archivo supera el tamaño máximo de 1 MB.');
      catalog = validateCatalog(JSON.parse(await file.text()));
      updateDirty();
      setStatus(`Catálogo importado: ${catalog.items.length} servicios. Aún no está publicado.`, 'success');
    } catch (error) { setStatus(`No se pudo importar: ${error.message}`, 'error'); }
  }

  function decodeBase64Utf8(encoded) {
    const binary = atob(encoded.replace(/\s/g, ''));
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  }
  function encodeBase64Utf8(string) {
    const bytes = new TextEncoder().encode(string);
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
  }
  function apiUrl(repo) {
    return `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/contents/${GITHUB_FILE}`;
  }
  function apiHeaders() {
    return { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${tokenInMemory}`, 'X-GitHub-Api-Version': '2022-11-28', 'Cache-Control': 'no-store' };
  }
  async function errorFromResponse(response) {
    if (response.status === 401) return 'Token incorrecto o vencido (401).';
    if (response.status === 403) return 'Acceso denegado (403). Verifica el permiso Contents: Read and write y el repositorio autorizado.';
    if (response.status === 404) return 'Repositorio, rama o archivo no encontrado (404). Verifica los campos y la existencia de data/catalogo.json.';
    if (response.status === 409 || response.status === 422) return 'Conflicto de versión. Otra persona pudo modificar el archivo. Desconecta y vuelve a cargar antes de publicar.';
    return `GitHub respondió con el código ${response.status}.`;
  }

  async function connectGitHub() {
    if (dirty && !confirm('Se reemplazarán los cambios locales con los datos actuales de GitHub. ¿Continuar?')) return;
    const owner = $('#github-owner').value.trim();
    const name = $('#github-repo').value.trim();
    const branch = $('#github-branch').value.trim();
    const inputToken = $('#github-token');
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(name) || !branch || !inputToken.value.trim()) {
      setStatus('Completa usuario, repositorio, rama y token fine-grained para conectar.', 'error'); return;
    }
    const proposedRepo = { owner, name, branch };
    tokenInMemory = inputToken.value.trim();
    inputToken.value = '';
    $('#connect-github').disabled = true;
    setStatus('Consultando el archivo del repositorio...', 'info');
    try {
      const response = await fetch(`${apiUrl(proposedRepo)}?ref=${encodeURIComponent(branch)}`, { headers: apiHeaders(), cache: 'no-store' });
      if (!response.ok) throw new Error(await errorFromResponse(response));
      const result = await response.json();
      if (!result.content || !result.sha) throw new Error('La API no devolvió el contenido y SHA del archivo.');
      catalog = validateCatalog(JSON.parse(decodeBase64Utf8(result.content)));
      repository = proposedRepo;
      currentSha = result.sha;
      dirty = false;
      $('#connection-badge').textContent = `${owner}/${name} · ${branch}`;
      $('#connection-badge').classList.add('connected');
      $('#save-github').disabled = true;
      $('#disconnect-github').disabled = false;
      render();
      setStatus(`Conectado a ${owner}/${name}. Puedes editar y publicar los cambios cuando estés listo.`, 'success');
    } catch (error) {
      tokenInMemory = '';
      repository = null;
      currentSha = null;
      $('#save-github').disabled = true;
      $('#disconnect-github').disabled = true;
      $('#connection-badge').textContent = 'Modo local';
      $('#connection-badge').classList.remove('connected');
      setStatus(`No se pudo conectar. ${error.message}`, 'error');
    } finally { $('#connect-github').disabled = false; }
  }

  async function saveGitHub() {
    if (!repository || !currentSha || !tokenInMemory || !dirty) return;
    $('#save-github').disabled = true;
    setStatus('Publicando cambios en el repositorio...', 'info');
    try {
      catalog.updatedAt = new Date().toISOString().slice(0, 10);
      const response = await fetch(apiUrl(repository), {
        method: 'PUT',
        headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Actualiza servicios y precios de Unika Spa', content: encodeBase64Utf8(jsonString()), sha: currentSha, branch: repository.branch })
      });
      if (!response.ok) throw new Error(await errorFromResponse(response));
      const result = await response.json();
      if (!result.content?.sha) throw new Error('GitHub no confirmó la nueva versión del archivo.');
      currentSha = result.content.sha;
      dirty = false;
      setStatus('Cambios guardados en GitHub. GitHub Pages puede tardar unos minutos en mostrarlos.', 'success');
    } catch (error) {
      setStatus(`No se pudieron publicar los cambios. ${error.message}`, 'error');
      $('#save-github').disabled = false;
    }
  }

  function disconnectGitHub() {
    tokenInMemory = '';
    repository = null;
    currentSha = null;
    $('#github-token').value = '';
    $('#connection-badge').textContent = 'Modo local';
    $('#connection-badge').classList.remove('connected');
    $('#save-github').disabled = true;
    $('#disconnect-github').disabled = true;
    setStatus(dirty ? 'Desconectado. Descarga el JSON si quieres conservar los cambios locales.' : 'Desconectado de GitHub. El token fue descartado de la memoria.', 'info');
  }

  function initializeEvents() {
    $('#add-product').addEventListener('click', () => openForm());
    $('#close-dialog').addEventListener('click', () => $('#product-dialog').close());
    $('#cancel-dialog').addEventListener('click', () => $('#product-dialog').close());
    $('#product-form').addEventListener('submit', saveForm);
    $('#field-price-type').addEventListener('change', togglePriceField);
    $('#product-dialog').addEventListener('click', (event) => { if (event.target === $('#product-dialog')) $('#product-dialog').close(); });
    $('#export-json').addEventListener('click', exportJson);
    $('#import-json').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', importJson);
    $('#admin-search').addEventListener('input', render);
    $('#admin-category').addEventListener('change', render);
    $('#admin-visibility').addEventListener('change', render);
    $('#connect-github').addEventListener('click', connectGitHub);
    $('#save-github').addEventListener('click', saveGitHub);
    $('#disconnect-github').addEventListener('click', disconnectGitHub);
    window.addEventListener('beforeunload', (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  }

  async function init() {
    initializeEvents();
    try {
      const response = await fetch('data/catalogo.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      catalog = validateCatalog(await response.json());
      setStatus(`Catálogo local cargado: ${catalog.items.length} servicios.`, 'success');
      render();
    } catch (error) { setStatus(`No se pudo cargar data/catalogo.json. Abre el administrador desde un servidor web. ${error.message}`, 'error'); }
  }
  init();
})();
