import axios from "axios";

/* ================= CONFIG ================= */
const TMDB_API_KEY = '13ef7c19ea1570a748cdceff664dbf42';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const PHIMAPI_BASE = "https://phimapi.com/tmdb";
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

/* ================= HELPERS ================= */

// Lấy thông tin phim từ TMDB với ngôn ngữ tùy chọn (en-US để lấy tên gốc chuẩn)
const fetchTmdbDetails = async (type, id, lang = 'en-US') => {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
      params: { api_key: TMDB_API_KEY, language: lang }
    });
    return res.data;
  } catch (error) {
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
    // 1. Lấy chi tiết phim bằng tiếng Anh để lấy Title chuẩn (Ví dụ: Drunken Master)
    const movieEN = await fetchTmdbDetails(tmdbType, tmdbId, 'en-US');
    if (!movieEN) return [];

    const keyword = movieEN.title || movieEN.name;

    // 2. Tìm kiếm trên Ophim bằng tên tiếng Anh
    const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(keyword)}`, { timeout: 5000 });
    const items = search.data?.data?.items || [];

    // 3. Khớp phim dựa trên TMDB ID trả về trong kết quả tìm kiếm
    const matched = items.find(i => i.tmdb?.id?.toString() === tmdbId.toString());

    if (!matched) {
      // Nếu không khớp ID, thử tìm item đầu tiên có cùng năm phát hành (phòng trường hợp Ophim thiếu ID)
      const releaseYear = (movieEN.release_date || movieEN.first_air_date || "").slice(0, 4);
      const fallback = items.find(i => i.year?.toString() === releaseYear);
      if (!fallback) return [];
      matched.slug = fallback.slug;
    }

    // 4. Lấy chi tiết tập phim
    const detail = await axios.get(`${OPHIM_DETAIL}/${matched.slug}`);
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
    console.error("Ophim Source Error:", error.message);
    return [];
  }
}

/* ================= COMBINED MAIN FUNCTION ================= */

/**
 * Hàm chính để lấy link stream từ tất cả các nguồn
 * @param {string} type - 'movie' hoặc 'tv'
 * @param {string|number} tmdbId - ID của phim trên TMDB
 */
export async function getMovieStreams({ type, tmdbId }) {
  const sourceType = type === 'movie' ? 'movie' : 'tv';

  // Chạy song song cả 2 nguồn để tối ưu tốc độ build trang
  const [phimapi, ophim] = await Promise.all([
    getPhimApiEpisodes(sourceType, tmdbId),
    getOphimEpisodes(tmdbId, sourceType)
  ]);

  return {
    phimapi,
    ophim,
    all: [...phimapi, ...ophim],
  };
}
