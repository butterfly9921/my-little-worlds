'use strict';

const gallery = document.getElementById('gallery');
const status = document.getElementById('status');
const detail = document.getElementById('record-detail');

function element(tag, name, text) {
  const node = document.createElement(tag);
  if (name) node.className = name;
  if (text) node.textContent = text;
  return node;
}

function galleryImage(origin, path) {
  if (typeof path !== 'string' || !/^\/media\/[A-Za-z0-9._-]+\/[0-9a-f-]{36}$/.test(path)) return null;
  const photo = element('img');
  photo.alt = '';
  photo.loading = 'lazy';
  photo.src = new URL(path, origin).href;
  return photo;
}

function openRecord(origin, record) {
  document.getElementById('record-title').textContent = record.title;
  const body = document.getElementById('record-body');
  body.replaceChildren(element('p', 'detail-date', record.date));
  if (record.note) body.append(element('p', 'detail-note', record.note));
  const photos = element('div', 'detail-photos');
  for (const path of record.photos) {
    const image = galleryImage(origin, path);
    if (image) photos.append(image);
  }
  if (photos.childElementCount) body.append(photos);
  if (record.music && ['song','playlist'].includes(record.music.kind) && /^\d{1,24}$/.test(record.music.id)) {
    const link = element('a', '', '在网易云音乐打开');
    link.href = 'https://music.163.com/' + record.music.kind + '?id=' + record.music.id;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const row = element('p');
    row.append(link);
    body.append(row);
  }
  detail.showModal();
}

async function loadGallery() {
  if (!window.galleryApi) {
    status.textContent = '展页正在准备中。';
    return;
  }
  try {
    const origin = new URL(window.galleryApi);
    if (origin.protocol !== 'https:') throw new Error('Invalid gallery origin');
    const response = await fetch(new URL('/gallery', origin), { credentials: 'omit' });
    if (!response.ok) throw new Error('Gallery unavailable');
    const { records } = await response.json();
    if (!Array.isArray(records)) throw new Error('Invalid gallery');
    const cards = document.createDocumentFragment();
    for (const record of records) {
      if (typeof record.title !== 'string' || !Array.isArray(record.photos)) continue;
      const card = element('button', 'record');
      card.type = 'button';
      const photo = galleryImage(origin, record.photos[0]);
      if (photo) card.append(photo);
      card.append(element('span', 'date', record.date), element('span', 'title', record.title));
      card.addEventListener('click', () => openRecord(origin, record));
      cards.append(card);
    }
    gallery.replaceChildren(cards);
    status.hidden = gallery.childElementCount > 0;
    if (!status.hidden) status.textContent = '这里还没有公开的照片。';
  } catch {
    status.textContent = '暂时无法加载照片，请稍后刷新。';
  }
}

loadGallery();
