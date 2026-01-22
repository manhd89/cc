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

  const tmdbTitle = normalize(tmdb.title || tmdb.name);
  const ophimTitle = normalize(ophim.name || ophim.origin_name);

  const titleMatch =
    tmdbTitle.includes(ophimTitle) ||
    ophimTitle.includes(tmdbTitle);

  const tmdbYear = Number(
    (tmdb.release_date || tmdb.first_air_date || "").slice(0, 4)
  );

  const yearMatch =
    !ophim.year || Math.abs(tmdbYear - ophim.year) <= 1;

  return titleMatch && yearMatch;
};

/* ================= PHIMAPI ================= */

export async function getPhimApiEpisodes(type, tmdbId) {
  try {
    const res = await axios.get(`${PHIMAPI_BASE}/${type}/${tmdbId}`);

    if (!res.data?.status || !Array.isArray(res.data.episodes)) return [];

    return res.data.episodes.flatMap(server =>
      server.server_data
        .filter(ep => ep.link_m3u8)
        .map((ep, index) => ({
          id: `phimapi-${server.server_name}-${ep.name}-${index}`,
          name: ep.name,
          link_m3u8: ep.link_m3u8,
          server: server.server_name,
          source: "phimapi",
        }))
    );
  } catch (e) {
    console.error("PhimAPI error:", e);
    return [];
  }
}

/* ================= OPHIM ================= */

export async function getOphimEpisodes(tmdb) {
  try {
    const keyword = tmdb.title || tmdb.name;

    const search = await axios.get(
      `${OPHIM_SEARCH}?keyword=${encodeURIComponent(keyword)}`
    );

    const items = search.data?.data?.items || [];

    const matched =
      items.find(i => i.tmdb?.id?.toString() === tmdb.id.toString()) ||
      items[0];

    if (!matched) return [];

    const detail = await axios.get(`${OPHIM_DETAIL}/${matched.slug}`);
    const item = detail.data?.data?.item;

    if (!item?.episodes) return [];
    if (!isSameMovie(tmdb, item)) return [];

    return item.episodes.flatMap(server =>
      server.server_data
        .filter(ep => ep.link_m3u8)
        .map((ep, index) => ({
          id: `ophim-${server.server_name}-${ep.name}-${index}`,
          name: ep.name,
          link_m3u8: ep.link_m3u8,
          server: server.server_name,
          source: "ophim",
        }))
    );
  } catch (e) {
    console.error("Ophim error:", e);
    return [];
  }
}

/* ================= COMBINED ================= */

export async function getMovieStreams({ type, tmdb }) {
  const phimapi = await getPhimApiEpisodes(type, tmdb.id);
  const ophim = await getOphimEpisodes(tmdb);

  return {
    phimapi,
    ophim,
    all: [...phimapi, ...ophim],
  };
}
