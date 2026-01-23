import axios from "axios";

/* ================= CONFIG ================= */
const TMDB_API_KEY = '13ef7c19ea1570a748cdceff664dbf42';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const PHIMAPI_BASE = "https://phimapi.com/tmdb";
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

/* ================= UTILS ================= */

// Chuẩn hóa tên để so sánh (xóa dấu, xóa ký tự đặc biệt, viết thường)
const normalizeString = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/* ================= HELPERS ================= */

const fetchTmdbDetails = async (type, id, lang = 'en-US') => {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
      params: { api_key: TMDB_API_KEY, language: lang }
    });
    return res.data;
  } catch {
    return null;
  }
};

/* ================= PHIMAPI SOURCE ================= */

export async function getPhimApiEpisodes(type, tmdbId) {
  try {
    const res = await axios.get(`${PHIMAPI_BASE}/${type}/${tmdbId}`, { timeout: 5000 });
    if (!res.data?.status) return [];

    return (res.data.episodes || []).flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name,
        link_m3u8: ep.link_m3u8,
        link_embed: ep.link_embed,
        server: server.server_name,
        source: "phimapi",
      }))
    );
  } catch {
    return [];
  }
}

/* ================= OPHIM SOURCE ================= */

export async function getOphimEpisodes(tmdbId, tmdbType) {
  try {
    // 1. Lấy chi tiết tiếng Anh từ TMDB
    const movieEN = await fetchTmdbDetails(tmdbType, tmdbId, 'en-US');
    if (!movieEN) return [];

    const keyword = movieEN.title || movieEN.name;
    const releaseYear = (movieEN.release_date || movieEN.first_air_date || "").slice(0, 4);

    // 2. Tìm kiếm trên Ophim
    const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(keyword)}`, { timeout: 5000 });
    const items = search.data?.data?.items || [];

    // 3. LOGIC KHỚP PHIM ĐA TẦNG
    let matchedItem = items.find(i => {
      // Tầng 1: Khớp bằng TMDB ID (Nếu Ophim có dữ liệu)
      const isIdMatch = i.tmdb?.id?.toString() === tmdbId.toString();
      if (isIdMatch) return true;

      // Tầng 2: So sánh Tên và Năm (Dùng cho trường hợp ID bị rỗng như Túy Quyền II)
      const normOphimName = normalizeString(i.name || "");
      const normOphimOri = normalizeString(i.origin_name || "");
      const normTmdbName = normalizeString(keyword);
      
      const isNameMatch = normOphimName === normTmdbName || normOphimOri === normTmdbName;
      const isYearMatch = !i.year || !releaseYear || Math.abs(Number(i.year) - Number(releaseYear)) <= 1;

      return isNameMatch && isYearMatch;
    });

    if (!matchedItem) return [];

    // 4. Lấy chi tiết tập phim
    const detail = await axios.get(`${OPHIM_DETAIL}/${matchedItem.slug}`);
    const item = detail.data?.data?.item;

    if (!item || !item.episodes) return [];

    return item.episodes.flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name,
        link_m3u8: ep.link_m3u8,
        link_embed: ep.link_embed,
        server: server.server_name,
        source: "ophim",
      }))
    );
  } catch (error) {
    return [];
  }
}

/* ================= COMBINED MAIN FUNCTION ================= */

export async function getMovieStreams(params) {
  const tmdbId = params.tmdbId || params.tmdb?.id || params.id;
  const type = params.type || (params.tmdb?.release_date ? 'movie' : 'tv');
  
  if (!tmdbId) return { phimapi: [], ophim: [], all: [] };

  const sourceType = type === 'movie' ? 'movie' : 'tv';

  try {
    const [phimapi, ophim] = await Promise.all([
      getPhimApiEpisodes(sourceType, tmdbId),
      getOphimEpisodes(tmdbId, sourceType)
    ]);

    return {
      phimapi,
      ophim,
      all: [...phimapi, ...ophim],
    };
  } catch (err) {
    return { phimapi: [], ophim: [], all: [] };
  }
}
