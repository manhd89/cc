import axios from "axios";

/* ================= CONFIG ================= */
const PHIMAPI_BASE = "https://phimapi.com/tmdb";
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

/* ================= UTILS ================= */
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const isSameMovie = (tmdb, ophim) => {
  if (!tmdb || !ophim) return false;

  // 1. Ưu tiên tuyệt đối nếu khớp TMDB ID
  if (ophim.tmdb?.id?.toString() === tmdb.id?.toString()) return true;

  // 2. Kiểm tra năm phát hành (sai số tối đa 1 năm)
  const tmdbYear = Number((tmdb.release_date || tmdb.first_air_date || "").slice(0, 4));
  const ophimYear = Number(ophim.year);
  const yearMatch = !ophimYear || !tmdbYear || Math.abs(tmdbYear - ophimYear) <= 1;

  if (!yearMatch) return false;

  // 3. So sánh tên (Gộp tất cả tên có thể có để kiểm tra)
  const tmdbNames = [tmdb.title, tmdb.name, tmdb.original_title, tmdb.original_name]
    .filter(Boolean)
    .map(normalize);
    
  const ophimNames = [ophim.name, ophim.origin_name, ...(ophim.alternative_names || [])]
    .filter(Boolean)
    .map(normalize);

  return tmdbNames.some(tn => ophimNames.some(on => on.includes(tn) || tn.includes(on)));
};

/* ================= PHIMAPI ================= */
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

/* ================= OPHIM ================= */
export async function getOphimEpisodes(tmdb) {
  try {
    // ƯU TIÊN: Tìm bằng tên gốc (tiếng Anh) trước, sau đó mới đến tên đã dịch
    const searchKeywords = [
      tmdb.original_title || tmdb.original_name,
      tmdb.title || tmdb.name
    ].filter(Boolean);

    let items = [];
    for (const kw of searchKeywords) {
      const search = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(kw)}`, { timeout: 5000 });
      const found = search.data?.data?.items || [];
      if (found.length > 0) {
        items = found;
        // Nếu tìm thấy item khớp ID ngay lập tức thì dừng tìm kiếm bằng keyword tiếp theo
        if (items.some(i => i.tmdb?.id?.toString() === tmdb.id.toString())) break;
      }
    }

    if (items.length === 0) return [];

    // Tìm trong danh sách kết quả: Ưu tiên ID, sau đó mới đến so sánh tên
    const matchedItem = items.find(i => i.tmdb?.id?.toString() === tmdb.id.toString()) ||
                        items.find(i => isSameMovie(tmdb, i));

    if (!matchedItem) return [];

    // Lấy chi tiết phim từ slug
    const detail = await axios.get(`${OPHIM_DETAIL}/${matchedItem.slug}`);
    const item = detail.data?.data?.item;

    if (!item) return [];

    return (item.episodes || []).flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name,
        link_m3u8: ep.link_m3u8,
        link_embed: ep.link_embed,
        server: server.server_name,
        source: "ophim",
      }))
    );
  } catch {
    return [];
  }
}

/* ================= COMBINED ================= */
export async function getMovieStreams({ type, tmdb }) {
  const [phimapi, ophim] = await Promise.all([
    getPhimApiEpisodes(type === 'movie' ? 'movie' : 'tv', tmdb.id),
    getOphimEpisodes(tmdb)
  ]);

  return {
    phimapi,
    ophim,
    all: [...phimapi, ...ophim]
  };
}
