import axios from "axios";

/* ================= CONFIG ================= */
const TMDB_API_KEY = '13ef7c19ea1570a748cdceff664dbf42';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const PHIMAPI_BASE = "https://phimapi.com/tmdb";
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

/* ================= UTILS ================= */

const normalize = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const isSameMovie = (tmdb, ophim) => {
  if (!tmdb || !ophim) return false;
  // Khớp ID là tin tưởng tuyệt đối
  if (ophim.tmdb?.id?.toString() === tmdb.id?.toString()) return true;

  const tmdbTitle = normalize(tmdb.title || tmdb.name);
  const tmdbOri = normalize(tmdb.original_title || "");
  const ophimTitle = normalize(ophim.name || "");
  const ophimOri = normalize(ophim.origin_name || "");

  const titleMatch = 
    [tmdbTitle, tmdbOri].some(t => t && (ophimTitle.includes(t) || ophimOri.includes(t))) ||
    [ophimTitle, ophimOri].some(o => o && (tmdbTitle.includes(o) || tmdbOri.includes(o)));

  const tmdbYear = Number((tmdb.release_date || tmdb.first_air_date || "").slice(0, 4));
  const yearMatch = !ophim.year || !tmdbYear || Math.abs(tmdbYear - Number(ophim.year)) <= 1;

  return titleMatch && yearMatch;
};

/* ================= PHIMAPI ================= */

export async function getPhimApiEpisodes(type, tmdbId) {
  try {
    const res = await axios.get(`${PHIMAPI_BASE}/${type}/${tmdbId}`);
    if (!res.data?.status) return [];
    return (res.data.episodes || []).flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name, link_m3u8: ep.link_m3u8, link_embed: ep.link_embed,
        server: server.server_name, source: "phimapi",
      }))
    );
  } catch { return []; }
}

/* ================= OPHIM ================= */

export async function getOphimEpisodes(tmdb) {
  try {
    // 1. Lấy thêm title tiếng Anh để search chính xác hơn (như bạn đề xuất)
    const enRes = await axios.get(`${TMDB_BASE_URL}/${tmdb.title ? 'movie' : 'tv'}/${tmdb.id}`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US' }
    });
    const enTitle = enRes.data.title || enRes.data.name;

    // 2. Search bằng cả 2 tên: Tiếng Anh và Tiếng Việt
    const keywords = [...new Set([enTitle, tmdb.title || tmdb.name])].filter(Boolean);
    let items = [];
    
    for (const kw of keywords) {
      const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(kw)}`);
      const found = search.data?.data?.items || [];
      items = [...items, ...found];
      if (found.some(i => i.tmdb?.id?.toString() === tmdb.id.toString())) break;
    }

    // 3. Thay vì lấy items[0], ta tìm trong list phim nào khớp ID hoặc khớp Tên nhất
    let matched = items.find(i => i.tmdb?.id?.toString() === tmdb.id.toString()) ||
                  items.find(i => isSameMovie(tmdb, i));

    if (!matched) return [];

    const detail = await axios.get(`${OPHIM_DETAIL}/${matched.slug}`);
    const ophimItem = detail.data.data.item;

    return ophimItem.episodes.flatMap(server =>
      server.server_data.map(ep => ({
        name: ep.name, link_m3u8: ep.link_m3u8, link_embed: ep.link_embed,
        server: server.server_name, source: "ophim",
      }))
    );
  } catch { return []; }
}

/* ================= COMBINED ================= */

export async function getMovieStreams({ type, tmdb }) {
  // Dùng Promise.all để chạy song song cho nhanh thay vì await tuần tự
  const [phimapi, ophim] = await Promise.all([
    getPhimApiEpisodes(type, tmdb.id),
    getOphimEpisodes(tmdb)
  ]);

  return {
    phimapi,
    ophim,
    all: [...phimapi, ...ophim],
  };
}
