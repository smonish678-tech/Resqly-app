import api from './api';

/**
 * Uploads a File to backend which forwards to Supabase Storage.
 * @param {string} bucket - one of 'prescriptions','lab-reports','provider-documents','profile-images'
 * @param {File} file
 * @returns {Promise<string>} url of uploaded file
 */
export async function uploadFile(bucket, file) {
  if (!file) throw new Error('No file');
  if (file.size > 6 * 1024 * 1024) throw new Error('File too large (max 6MB)');
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const { data } = await api.post('/uploads/base64', {
    bucket,
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    data_base64: base64,
  });
  return data.url;
}

/**
 * Reverse geocode coordinates to a human-readable address using OpenStreetMap Nominatim.
 * Returns an object {label, suburb, city, state, country} or null on failure.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const suburb = a.suburb || a.neighbourhood || a.village || a.hamlet || a.locality || '';
    const city = a.city || a.town || a.county || a.state_district || '';
    return {
      label: data.display_name || '',
      suburb,
      city,
      state: a.state || '',
      country: a.country || '',
      short: [suburb, city].filter(Boolean).join(', '),
    };
  } catch {
    return null;
  }
}

/**
 * Search addresses by query using OpenStreetMap Nominatim.
 * Returns an array of {label, lat, lng, city, suburb}.
 */
export async function searchAddresses(query, country = 'in') {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=${country}&limit=8&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d) => {
      const a = d.address || {};
      const suburb = a.suburb || a.neighbourhood || a.village || a.hamlet || a.locality || '';
      const city = a.city || a.town || a.county || a.state_district || '';
      return {
        label: d.display_name,
        short: [suburb, city].filter(Boolean).join(', ') || d.display_name.split(',').slice(0, 2).join(', '),
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        city,
        suburb,
        state: a.state || '',
      };
    });
  } catch {
    return [];
  }
}
