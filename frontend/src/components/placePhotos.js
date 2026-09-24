// Photos for places, shared by the Arrive deck and the Nearby cards. All are credited
// in the README (public/places/names/ by place type, public/places/ by category).

// Place names are "<City> <type>" ("Bengaluru Butterfly Reserve"), so the type picks the
// photo; most specific first, so "Jain Temple Complex" wins over "Temple".
const NAME_PHOTOS = [
  ['butterfly reserve', 'butterfly-reserve'], ['bird sanctuary', 'bird-sanctuary'], ['crocodile park', 'crocodile-park'],
  ['elephant camp', 'elephant-camp'], ['night food bazaar', 'night-food-bazaar'], ['street food lane', 'street-food-lane'],
  ['spice market', 'spice-market-walk'], ['coffee roastery', 'coffee-roastery-tour'], ['cooking class', 'cooking-class'],
  ['blue pottery', 'blue-pottery-workshop'], ['handloom', 'handloom-cooperative'], ['antique lane', 'antique-lane'],
  ['bazaar', 'bazaar'], ['hot springs', 'hot-springs'], ['ayurveda', 'ayurveda-centre'],
  ['riverside lounge', 'riverside-lounge'], ['jazz cellar', 'jazz-cellar'], ['rooftop live music', 'rooftop-live-music'],
  ['lighthouse beach', 'lighthouse-beach'], ["fishermen's cove", 'fishermens-cove'], ['north beach', 'north-beach'],
  ['quiet bay', 'quiet-bay'], ['ridge lookout', 'ridge-lookout'], ['watchtower', 'watchtower-terrace'],
  ['sunset point', 'sunset-point'], ['viewpoint', 'viewpoint'], ['cycling loop', 'cycling-loop'], ['kayaking', 'kayaking'],
  ['zipline', 'zipline-point'], ['rock climbing', 'rock-climbing-wall'], ['paragliding', 'paragliding-launch'],
  ['hot air balloon', 'hot-air-balloon-field'], ['rock garden', 'rock-garden'], ['cliff walk', 'cliff-walk'],
  ['backwater', 'backwater-channel'], ['botanical', 'botanical-gardens'], ['tea estate', 'tea-estate-trail'],
  ['maritime museum', 'maritime-museum'], ['puppet museum', 'puppet-museum'], ['textile museum', 'textile-museum'],
  ['museum of coins', 'museum-of-coins'], ['gallery of modern art', 'gallery-of-modern-art'], ['city museum', 'city-museum'],
  ['great mosque', 'great-mosque'], ['jain temple', 'jain-temple-complex'], ['riverside ghats', 'riverside-ghats'],
  ['hilltop shrine', 'hilltop-shrine'], ["st mary's church", 'st-marys-church'], ['stepwell', 'stepwell'],
  ['city walls', 'city-walls-walk'], ['observatory', 'observatory'], ['water palace', 'water-palace'],
  ['royal cenotaphs', 'royal-cenotaphs'], ['chhatri', 'chhatri-complex'], ['old palace', 'old-palace'],
  ['fort', 'fort'], ['temple', 'temple'], ['lake', 'lake'],
].map(([words, file]) => [new RegExp(`\\b${words}\\b`, 'i'), file])
const categoryPhoto = place => `/places/${String(place?.poi_category || '').toLowerCase()}.jpg`
export const photoFor = place => {
  const hit = NAME_PHOTOS.find(([rx]) => rx.test(place?.name || ''))
  return hit ? `/places/names/${hit[1]}.jpg` : categoryPhoto(place)
}
// Name photo -> category photo -> city photo, so a missing file never shows a broken image.
export const fallBack = (e, place) => {
  const img = e.currentTarget
  const next = img.dataset.fallback === 'category' ? '/cities/default.jpg' : categoryPhoto(place)
  if (img.dataset.fallback === 'default') return
  img.dataset.fallback = img.dataset.fallback === 'category' ? 'default' : 'category'
  img.src = next
}
