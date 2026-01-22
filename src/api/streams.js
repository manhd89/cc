import axios from "axios";

/* ================= CONFIG ================= */

const PHIMAPI_BASE = "https://phimapi.com/tmdb";
const OPHIM_SEARCH = "https://ophim1.com/v1/api/tim-kiem";
const OPHIM_DETAIL = "https://ophim1.com/v1/api/phim";

/* ================= LOGGER ================= */

const debug = (...args) => {
  console.debug("[STREAMS]", ...args);
};

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

  const tmdbYear = Number(
    (tmdb.release_date || tmdb.first_air_date || "").slice(0, 4)
  );

  const titleMatch =
    tmdbTitle.includes(ophimTitle) ||
    ophimTitle.includes(tmdbTitle);

  const yearMatch =
    !ophim.year || Math.abs(tmdbYear - ophim.year) <= 1;

  return titleMatch && yearMatch;
};

/* ================= PHIMAPI ================= */

export async function getPhimApiEpisodes(type, tmdbId) {
  try {
    debug("Fetching PhimAPI:", type, tmdbId);

    const res = await axios.get(`${PHIMAPI_BASE}/${type}/${tmdbId}`);

    debug("PhimAPI raw response:", res.data);

    if (!res.data?.status || !Array.isArray(res.data.episodes)) {
      debug("PhimAPI: no episodes");
      return [];
    }

    const episodes = res.data.episodes.flatMap(server => {
      debug("PhimAPI server:", server.server_name, server.server_data);

      return server.server_data.map((ep, index) => {
        debug("PhimAPI episode raw:", ep);

        return {
          id: `phimapi-${server.server_name}-${ep.name}-${index}`,
          name: ep.name,
          link_m3u8: ep.link_m3u8 || null,
          server: server.server_name,
          source: "phimapi",
        };
      });
    });

    debug("PhimAPI parsed episodes:", episodes);

    return episodes;
  } catch (e) {
    console.error("PhimAPI error:", e);
    return [];
  }
}

/* ================= OPHIM ================= */

export async function getOphimEpisodes(tmdb) {
  try {
    debug("Searching Ophim:", tmdb.title || tmdb.name);

    const search = await axios.get(
      `${OPHIM_SEARCH}?keyword=${encodeURIComponent(
        tmdb.title || tmdb.name
      )}`
    );

    debug("Ophim search response:", search.data);

    const items = search.data?.data?.items || [];
    if (!items.length) {
      debug("Ophim: no search result");
      return [];
    }

    const matched =
      items.find(i => i.tmdb?.id?.toString() === tmdb.id.toString()) ||
      items[0];

    debug("Ophim matched item:", matched);

    const detail = await axios.get(`${OPHIM_DETAIL}/${matched.slug}`);
    debug("Ophim detail raw:", detail.data);

    const item = detail.data?.data?.item;
    if (!item?.episodes) {
      debug("Ophim: no episodes in detail");
      return [];
    }

    if (!isSameMovie(tmdb, item)) {
      debug("Ophim mismatch:", item);
      return [];
    }

    const episodes = item.episodes.flatMap(server => {
      debug("Ophim server:", server.server_name, server.server_data);

      return server.server_data.map((ep, index) => {
        debug("Ophim episode raw:", ep);

        return {
          id: `ophim-${server.server_name}-${ep.name}-${index}`,
          name: ep.name,
          link_m3u8: ep.link_m3u8 || null,
          server: server.server_name,
          source: "ophim",
        };
      });
    });

    debug("Ophim parsed episodes:", episodes);

    return episodes;
  } catch (e) {
    console.error("Ophim error:", e);
    return [];
  }
}

/* ================= COMBINED ================= */

export async function getMovieStreams({ type, tmdb }) {
  debug("getMovieStreams:", type, tmdb.id);

  const phimapi = await getPhimApiEpisodes(type, tmdb.id);
  const ophim = await getOphimEpisodes(tmdb);

  const all = [...phimapi, ...ophim];

  debug("FINAL STREAMS:", all);

  return {
    phimapi,
    ophim,
    all,
  };
}
