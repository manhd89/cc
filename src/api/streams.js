import axios from "axios";
import { tmdbAPI } from "./tmdb";

/* ================= CONFIG ================= */
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

const PHIMAPI_TMDB = "https://phimapi.com/tmdb";
const PHIMAPI_SEARCH = "https://phimapi.com/v1/api/tim-kiem";
const PHIMAPI_DETAIL = "https://phimapi.com/phim";

/* ================= UTILS ================= */
const normalize = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const isSameMovie = (tmdb, remote) => {
  if (!tmdb || !remote) return false;
  if (remote.tmdb?.id?.toString() === tmdb.id?.toString()) return true;

  const tmdbYear = Number((tmdb.release_date || tmdb.first_air_date || "").slice(0, 4));
  const remoteYear = Number(remote.year);
  if (remoteYear && tmdbYear && Math.abs(tmdbYear - remoteYear) > 1) return false;

  const tEn = normalize(tmdb.title || tmdb.name);
  const tOri = normalize(tmdb.original_title || tmdb.original_name);
  const rName = normalize(remote.name || "");
  const rOri = normalize(remote.origin_name || "");

  return [tEn, tOri].some(t => t && (rName.includes(t) || rOri.includes(t))) ||
         [rName, rOri].some(r => r && (tEn.includes(r) || tOri.includes(r)));
};

/* ================= SOURCES ================= */

// 1. XỬ LÝ PHIMAPI (Cấu trúc: res.data.episodes)
async function getPhimApiEpisodes(tmdb, type, enTitle) {
  try {
    // Thử TMDB ID trước
    const directRes = await axios.get(`${PHIMAPI_TMDB}/${type}/${tmdb.id}`);
    if (directRes.data?.status && directRes.data.episodes?.length > 0) {
      return directRes.data.episodes.flatMap(server =>
        (server.server_data || []).map(ep => ({
          name: ep.name, link_m3u8: ep.link_m3u8, link_embed: ep.link_embed,
          server: server.server_name, source: "phimapi"
        }))
      );
    }

    // Fallback: Tìm kiếm
    const keywords = [...new Set([enTitle, tmdb.title || tmdb.name])].filter(Boolean);
    let searchItems = [];
    for (const kw of keywords) {
      const res = await axios.get(`${PHIMAPI_SEARCH}?keyword=${encodeURIComponent(kw)}`);
      searchItems = [...searchItems, ...(res.data?.data?.items || [])];
    }

    const matched = searchItems.find(i => isSameMovie(tmdb, i));
    if (!matched) return [];

    // Chi tiết PhimAPI: res.data.episodes
    const detailRes = await axios.get(`${PHIMAPI_DETAIL}/${matched.slug}`);
    return (detailRes.data?.episodes || []).flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name, link_m3u8: ep.link_m3u8, link_embed: ep.link_embed,
        server: server.server_name, source: "phimapi"
      }))
    );
  } catch { return []; }
}

// 2. XỬ LÝ OPHIM (Cấu trúc: res.data.data.item.episodes)
async function getOphimEpisodes(tmdb, type, enTitle) {
  try {
    const keywords = [...new Set([enTitle, tmdb.title || tmdb.name])].filter(Boolean);
    let searchItems = [];
    for (const kw of keywords) {
      const res = await axios.get(`${OPHIM_SEARCH}?keyword=${encodeURIComponent(kw)}`);
      searchItems = [...searchItems, ...(res.data?.data?.items || [])];
    }

    const matched = searchItems.find(i => isSameMovie(tmdb, i));
    if (!matched) return [];

    // Chi tiết Ophim: res.data.data.item.episodes
    const detailRes = await axios.get(`${OPHIM_DETAIL}/${matched.slug}`);
    const episodes = detailRes.data?.data?.item?.episodes || [];
    
    return episodes.flatMap(server =>
      (server.server_data || []).map(ep => ({
        name: ep.name, link_m3u8: ep.link_m3u8, link_embed: ep.link_embed,
        server: server.server_name, source: "ophim"
      }))
    );
  } catch { return []; }
}

/* ================= MAIN EXPORT ================= */

export async function getMovieStreams({ type, tmdb }) {
  const sourceType = type === 'movie' ? 'movie' : 'tv';
  
  try {
    // Lấy tên tiếng Anh từ TMDB API của bạn
    const enDetails = await tmdbAPI.getDetails(sourceType, tmdb.id, 'en-US');
    const enTitle = enDetails.data?.title || enDetails.data?.name;

    const [phimapi, ophim] = await Promise.all([
      getPhimApiEpisodes(tmdb, sourceType, enTitle),
      getOphimEpisodes(tmdb, sourceType, enTitle)
    ]);

    return {
      phimapi,
      ophim,
      all: [...phimapi, ...ophim]
    };
  } catch (err) {
    return { phimapi: [], ophim: [], all: [] };
  }
}
