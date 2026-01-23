import axios from "axios";
import { tmdbAPI } from "./tmdb"; // Import chính cái tmdbAPI bạn đã định nghĩa

/* ================= CONFIG ================= */
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";
const PHIMAPI_BASE = "https://phimapi.com/tmdb";

/* ================= UTILS ================= */
const normalize = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const isSameMovie = (tmdb, ophim) => {
  if (!tmdb || !ophim) return false;
  
  // Ưu tiên khớp ID tuyệt đối
  if (ophim.tmdb?.id?.toString() === tmdb.id?.toString()) return true;

  const tmdbYear = Number((tmdb.release_date || tmdb.first_air_date || "").slice(0, 4));
  const ophimYear = Number(ophim.year);
  const yearMatch = !ophimYear || !tmdbYear || Math.abs(tmdbYear - ophimYear) <= 1;

  if (!yearMatch) return false;

  const tmdbTitle = normalize(tmdb.title || tmdb.name);
  const tmdbOri = normalize(tmdb.original_title || tmdb.original_name);
  const ophimTitle = normalize(ophim.name || "");
  const ophimOri = normalize(ophim.origin_name || "");

  return [tmdbTitle, tmdbOri].some(t => t && (ophimTitle.includes(t) || ophimOri.includes(t))) ||
         [ophimTitle, ophimOri].some(o => o && (tmdbTitle.includes(o) || tmdbOri.includes(o)));
};

/* ================= SOURCES ================= */

async function getPhimApiEpisodes(type, tmdbId) {
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

async function getOphimEpisodes(tmdb, type) {
  try {
    // 1. Lấy thêm tên tiếng Anh từ TMDB để tìm kiếm (vì Ophim khớp tên tiếng Anh tốt hơn)
    const enRes = await tmdbAPI.getDetails(type, tmdb.id, 'en-US');
    const enTitle = enRes.data?.title || enRes.data?.name;

    // 2. Gom các từ khóa tìm kiếm (Tiếng Việt từ tmdb truyền vào + Tiếng Anh vừa lấy)
    const keywords = [...new Set([enTitle, tmdb.title || tmdb.name])].filter(Boolean);
    
    let items = [];
    for (const kw of keywords) {
      const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(kw)}`);
      const found = search.data?.data?.items || [];
      if (found.length > 0) {
        items = [...items, ...found];
        if (found.some(i => i.tmdb?.id?.toString() === tmdb.id.toString())) break;
      }
    }

    if (items.length === 0) return [];

    // 3. Khớp phim chính xác
    const matched = items.find(i => i.tmdb?.id?.toString() === tmdb.id.toString()) ||
                    items.find(i => isSameMovie(tmdb, i));

    if (!matched) return [];

    const detail = await axios.get(`${OPHIM_DETAIL}/${matched.slug}`);
    const item = detail.data?.data?.item;

    return (item?.episodes || []).flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name,
        link_m3u8: ep.link_m3u8,
        link_embed: ep.link_embed,
        server: server.server_name,
        source: "ophim",
      }))
    );
  } catch { return []; }
}

/* ================= MAIN EXPORT ================= */

export async function getMovieStreams({ type, tmdb }) {
  const sourceType = type === 'movie' ? 'movie' : 'tv';

  // Chạy song song cả 2 nguồn để tối ưu tốc độ load cho WatchMovie.vue
  const [phimapi, ophim] = await Promise.all([
    getPhimApiEpisodes(sourceType, tmdb.id),
    getOphimEpisodes(tmdb, sourceType)
  ]);

  return {
    phimapi,
    ophim,
    all: [...phimapi, ...ophim]
  };
}
