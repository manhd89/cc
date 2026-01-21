import axios from 'axios'

const TMDB_API_KEY = '13ef7c19ea1570a748cdceff664dbf42'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'vi-VN'
  }
})

export const tmdbAPI = {
  // Lấy phim phổ biến
  getPopularMovies: (page = 1) => 
    tmdb.get('/movie/popular', { params: { page } }),
  
  // Lấy phim đang chiếu
  getNowPlayingMovies: (page = 1) => 
    tmdb.get('/movie/now_playing', { params: { page } }),
  
  // Lấy phim sắp chiếu
  getUpcomingMovies: (page = 1) => 
    tmdb.get('/movie/upcoming', { params: { page } }),
  
  // Lấy TV shows phổ biến
  getPopularTVShows: (page = 1) => 
    tmdb.get('/tv/popular', { params: { page } }),
  
  // Tìm kiếm đa phương tiện
  searchMulti: (query, page = 1) => 
    tmdb.get('/search/multi', { params: { query, page } }),
  
  // Lấy chi tiết phim/TV
  getDetails: (type, id) => 
    tmdb.get(`/${type}/${id}`, { 
      params: { 
        append_to_response: 'videos,credits,similar' 
      } 
    }),
  
  // Lấy danh mục
  getGenres: (type) => 
    tmdb.get(`/genre/${type}/list`),
  
  // Lấy phim theo danh mục
  getMoviesByGenre: (genreId, page = 1) => 
    tmdb.get('/discover/movie', { 
      params: { 
        with_genres: genreId,
        page 
      } 
    }),
  
  // Helper để lấy ảnh
  getImageUrl: (path, size = 'w500') => 
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null
}
