import axios from "axios";

/* ================= CONFIG ================= */
const TMDB_API_KEY = '13ef7c19ea1570a748cdceff664dbf42';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";
const PHIMAPI_BASE = "https://phimapi.com/tmdb";

/* ================= UTILS ================= */
const normalize = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/* ================= OPHIM SOURCE ================= */

export async function getOphimEpisodes(tmdbId, tmdbType) {
  try {
    // 1. Lấy dữ liệu tiếng Anh và tiếng Việt từ TMDB
    const [enRes, viRes] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/${tmdbType}/${tmdbId}`, { params: { api_key: TMDB_API_KEY, language: 'en-US' } }),
      axios.get(`${TMDB_BASE_URL}/${tmdbType}/${tmdbId}`, { params: { api_key: TMDB_API_KEY, language: 'vi-VN' } })
    ]);

    const mEN = enRes.data;
    const mVI = viRes.data;
    const releaseYear = (mEN.release_date || mEN.first_air_date || "").slice(0, 4);

    // 2. Danh sách từ khóa tìm kiếm: Tiếng Anh và Tiếng Việt
    const keywords = [...new Set([mEN.title || mEN.name, mVI.title || mVI.name])].filter(Boolean);

    let items = [];
    for (const kw of keywords) {
      const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(kw)}`, { timeout: 4000 });
      const found = search.data?.data?.items || [];
      if (found.length > 0) {
        items = [...items, ...found];
        // Nếu tìm thấy phim khớp ID ngay trong lần search này thì dừng lại
        if (found.some(i => i.tmdb?.id?.toString() === tmdbId.toString())) break;
      }
    }

    if (items.length === 0) return [];

    // 3. Tìm phim khớp nhất (Ưu tiên ID, sau đó tới Tên + Năm)
    const matchedItem = items.find(i => i.tmdb?.id?.toString() === tmdbId.toString()) || 
      items.find(i => {
        const normOphim = normalize(i.origin_name || i.name);
        const normTmdbEn = normalize(mEN.title || mEN.name);
        const normTmdbVi = normalize(mVI.title || mVI.name);
        
        const isNameMatch = normOphim.includes(normTmdbEn) || normOphim.includes(normTmdbVi) || 
                          normTmdbEn.includes(normOphim) || normTmdbVi.includes(normOphim);
        const isYearMatch = !i.year || !releaseYear || Math.abs(Number(i.year) - Number(releaseYear)) <= 1;
        
        return isNameMatch && isYearMatch;
      });

    if (!matchedItem) return [];

    const detail = await axios.get(`${OPHIM_DETAIL}/${matchedItem.slug}`);
    const episodes = detail.data?.data?.item?.episodes || [];

    return episodes.flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name,
        link_m3u8: ep.link_m3u8,
        link_embed: ep.link_embed,
        server: server.server_name,
        source: "ophim",
      }))
    );
  } catch (error) {
    console.error("Ophim Error:", error.message);
    return [];
  }
}

/* ================= PHIMAPI SOURCE ================= */

export async function getPhimApiEpisodes(type, tmdbId) {
  try {
    const res = await axios.get(`${PHIMAPI_BASE}/${type}/${tmdbId}`);
    return (res.data?.episodes || []).flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name,
        link_m3u8: ep.link_m3u8,
        link_embed: ep.link_embed,
        server: server.server_name,
        source: "phimapi",
      }))
    );
  } catch { return []; }
}

/* ================= MAIN FUNCTION ================= */

export async function getMovieStreams({ type, tmdbId }) {
  const sourceType = type === 'movie' ? 'movie' : 'tv';
  
  // Chạy song song 2 nguồn
  const [phimapi, ophim] = await Promise.all([
    getPhimApiEpisodes(sourceType, tmdbId),
    getOphimEpisodes(tmdbId, sourceType)
  ]);

  return { 
    phimapi, 
    ophim, 
    all: [...phimapi, ...ophim] 
  };
}
