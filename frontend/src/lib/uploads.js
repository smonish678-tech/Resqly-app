import api from './api';

async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.size <= 1800 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const maxDimension = 2000;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() });
}

export async function uploadFile(bucket, originalFile) {
  if (!originalFile) throw new Error('No file');
  if (originalFile.size > 10 * 1024 * 1024) throw new Error('File too large (max 10MB)');
  const file = await compressImage(originalFile);
  if (file.size > 8 * 1024 * 1024) throw new Error('File is still too large after compression');
  const response = await api.post('/uploads/file', file, {
    params: { bucket, filename: file.name },
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    timeout: 90000,
    transformRequest: [(body) => body],
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
  });
  return response.data.url;
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1', { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const suburb = a.suburb || a.neighbourhood || a.village || a.hamlet || a.locality || '';
    const city = a.city || a.town || a.county || a.state_district || '';
    return { label: data.display_name || '', suburb, city, state: a.state || '', country: a.country || '', short: [suburb, city].filter(Boolean).join(', ') };
  } catch {
    return null;
  }
}

export async function searchAddresses(query, country = 'in') {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&q=' + encodeURIComponent(query) + '&countrycodes=' + country + '&limit=8&addressdetails=1', { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d) => {
      const a = d.address || {};
      const suburb = a.suburb || a.neighbourhood || a.village || a.hamlet || a.locality || '';
      const city = a.city || a.town || a.county || a.state_district || '';
      return { label: d.display_name, short: [suburb, city].filter(Boolean).join(', ') || d.display_name.split(',').slice(0, 2).join(', '), lat: parseFloat(d.lat), lng: parseFloat(d.lon), city, suburb, state: a.state || '' };
    });
  } catch {
    return [];
  }
}
