import axios from "axios";

/* ================= CONFIG ================= */
const TMDB_API_KEY = '13ef7c19ea1570a748cdceff664dbf42';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const PHIMAPI_BASE = "https://phimapi.com/tmdb";
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

/* ================= HELPERS ================= */

const fetchTmdbDetails = async (type, id, lang = 'en-US') => {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
      params: { api_key: TMDB_API_KEY, language: lang }
    });
    return res.data;
  } catch (error) {
    console.error("TMDB Fetch Error:", error.message);
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
    // 1. Lấy chi tiết bằng tiếng Anh
    const movieEN = await fetchTmdbDetails(tmdbType, tmdbId, 'en-US');
    if (!movieEN) return [];

    const keyword = movieEN.title || movieEN.name;

    // 2. Tìm kiếm trên Ophim
    const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(keyword)}`, { timeout: 5000 });
    const items = search.data?.data?.items || [];

    // 3. Khớp phim chính xác (Dùng toString() để tránh lệch kiểu dữ liệu string/number)
    const matchedItem = items.find(i => 
      i.tmdb?.id?.toString() === tmdbId.toString()
    );

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
  // Fix lỗi không lấy được ID: Chấp nhận cả params.tmdbId hoặc params.tmdb.id
  const tmdbId = params.tmdbId || params.tmdb?.id || params.id;
  const type = params.type || (params.tmdb?.release_date ? 'movie' : 'tv');
  
  if (!tmdbId) {
    console.error("movieSource: Missing tmdbId!");
    return { phimapi: [], ophim: [], all: [] };
  }

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
