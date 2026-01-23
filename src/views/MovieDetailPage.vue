<template>
  <div class="movie-detail-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="$router.back()" class="back-btn">Quay lại</button>
    </div>
    
    <div v-else-if="movie" class="movie-detail">
      <div class="backdrop-section">
        <img 
          v-lazy="backdropUrl" 
          :alt="movie.title || movie.name"
          class="backdrop-image"
        />
        <div class="backdrop-overlay"></div>
        <div class="backdrop-content">
          <button @click="$router.back()" class="back-btn">
            ← Quay lại
          </button>
        </div>
      </div>
      
      <div class="container">
        <div class="movie-main">
          <div class="movie-poster-section">
            <img 
              v-lazy="posterUrl" 
              :alt="movie.title || movie.name"
              class="movie-poster"
            />
            <div class="watch-action">
              <button @click="watchMovie" class="watch-btn">
                ▶ Xem ngay
              </button>
              <button @click="toggleFavorite" class="favorite-btn">
                {{ isFavorite ? '★ Bỏ yêu thích' : '☆ Yêu thích' }}
              </button>
            </div>
          </div>
          
          <div class="movie-info-section">
            <h1 class="movie-title">{{ movie.title || movie.name }}</h1>
            <div class="movie-meta">
              <span class="rating">★ {{ movie.vote_average?.toFixed(1) }}</span>
              <span class="year">{{ releaseYear }}</span>
              <span v-if="movie.runtime" class="runtime">
                {{ formatRuntime(movie.runtime) }}
              </span>
              <span v-if="movie.number_of_seasons" class="seasons">
                {{ movie.number_of_seasons }} mùa
              </span>
            </div>
            
            <div class="genres">
              <span 
                v-for="genre in movie.genres" 
                :key="genre.id"
                class="genre"
              >
                {{ genre.name }}
              </span>
            </div>
            
            <h3 class="section-title">Tóm tắt</h3>
            <p class="overview">{{ movie.overview || 'Không có mô tả.' }}</p>
            
            <div v-if="movie.credits?.cast?.length" class="credits">
              <h3 class="section-title">Diễn viên</h3>
              <div class="cast-grid">
                <div 
                  v-for="person in movie.credits.cast.slice(0, 8)"
                  :key="person.id"
                  class="cast-item"
                >
                  <img 
                    v-lazy="getProfileImage(person.profile_path)"
                    :alt="person.name"
                    class="cast-image"
                  />
                  <div class="cast-info">
                    <p class="cast-name">{{ person.name }}</p>
                    <p class="cast-character">{{ person.character }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="similarMovies.length" class="similar-section">
          <h2 class="section-title-large">Phim tương tự</h2>
          <div class="similar-grid">
            <MovieCard
              v-for="similar in similarMovies"
              :key="similar.id"
              :movie="similar"
              @click="goToMovie(similar)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { tmdbAPI } from '@/api/tmdb'
import MovieCard from '@/components/MovieCard.vue'

export default {
  name: 'MovieDetailPage',
  components: {
    MovieCard
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    const loading = ref(true)
    const error = ref('')
    const movie = ref(null)
    const similarMovies = ref([])
    
    // Xác định phim lẻ hay TV show dựa trên URL hoặc dữ liệu trả về
    const currentType = computed(() => {
      return route.path.includes('/movie/') ? 'movie' : 'tv'
    })

    const isFavorite = computed(() => {
      return movie.value ? store.getters.isFavorite(movie.value) : false
    })
    
    const backdropUrl = computed(() => 
      tmdbAPI.getImageUrl(movie.value?.backdrop_path, 'original')
    )
    
    const posterUrl = computed(() => 
      tmdbAPI.getImageUrl(movie.value?.poster_path, 'w500')
    )
    
    const releaseYear = computed(() => {
      const date = movie.value?.release_date || movie.value?.first_air_date
      return date ? new Date(date).getFullYear() : ''
    })
    
    const fetchMovieDetails = async () => {
      try {
        loading.value = true
        error.value = '' // Reset lỗi khi chuyển trang
        
        const response = await tmdbAPI.getDetails(currentType.value, props.id)
        
        movie.value = response.data
        similarMovies.value = response.data.similar?.results || []
        
        // Cập nhật Vuex
        store.commit('SET_CURRENT_MOVIE', movie.value)
        
        // Cuộn lên đầu trang khi đổi phim
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
      } catch (err) {
        console.error('Error fetching movie details:', err)
        error.value = 'Không thể tải thông tin phim. Vui lòng thử lại.'
      } finally {
        loading.value = false
      }
    }
    
    // Theo dõi sự thay đổi của ID để load lại trang
    watch(() => props.id, () => {
      fetchMovieDetails()
    })

    const watchMovie = () => {
      router.push(`/watch/${currentType.value}/${props.id}`)
    }
    
    const toggleFavorite = () => {
      if (movie.value) {
        store.dispatch('toggleFavorite', movie.value)
      }
    }
    
    const formatRuntime = (minutes) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    
    const getProfileImage = (path) => {
      return path ? tmdbAPI.getImageUrl(path, 'w185') : '/placeholder-avatar.jpg'
    }
    
    const goToMovie = (similar) => {
      const type = similar.title ? 'movie' : 'tv'
      // Router push sẽ làm thay đổi URL -> kích hoạt watch(props.id) ở trên
      router.push(`/${type}/${similar.id}`)
    }
    
    onMounted(fetchMovieDetails)
    
    return {
      loading,
      error,
      movie,
      similarMovies,
      isFavorite,
      backdropUrl,
      posterUrl,
      releaseYear,
      watchMovie,
      toggleFavorite,
      formatRuntime,
      getProfileImage,
      goToMovie
    }
  }
}
</script>

<style scoped>
.movie-detail-page {
  min-height: 100vh;
  background: #0a0a0a;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.error {
  text-align: center;
}

.error p {
  color: #e50914;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.back-btn {
  background: #e50914;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.back-btn:hover {
  background: #f40612;
}

.backdrop-section {
  position: relative;
  height: 60vh;
  min-height: 400px;
  overflow: hidden;
}

.backdrop-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}

.backdrop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, #0a0a0a 100%);
}

.backdrop-content {
  position: relative;
  height: 100%;
  display: flex;
  align-items: flex-start;
  padding: 30px;
}

.container {
  max-width: 1400px;
  margin: -100px auto 0;
  padding: 0 20px;
  position: relative;
}

.movie-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 40px;
  margin-bottom: 60px;
}

.movie-poster-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.movie-poster {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.watch-action {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.watch-btn, .favorite-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.watch-btn {
  background: #e50914;
  color: white;
}

.watch-btn:hover {
  background: #f40612;
  transform: translateY(-2px);
}

.favorite-btn {
  background: #2a2a2a;
  color: white;
}

.favorite-btn:hover {
  background: #3a3a3a;
  transform: translateY(-2px);
}

.movie-info-section {
  color: white;
}

.movie-title {
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  line-height: 1.2;
}

.movie-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  color: #aaa;
  align-items: center;
}

.movie-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rating {
  color: #ffd700;
  font-weight: bold;
  font-size: 1.1rem;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.genre {
  background: #2a2a2a;
  color: #ccc;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.section-title {
  color: white;
  font-size: 1.3rem;
  margin: 0 0 15px 0;
}

.overview {
  color: #ccc;
  line-height: 1.7;
  font-size: 1.1rem;
  margin-bottom: 40px;
}

.cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.cast-item {
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cast-item:hover {
  transform: translateY(-5px);
}

.cast-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.cast-info {
  padding: 15px;
}

.cast-name {
  color: white;
  font-weight: bold;
  margin: 0 0 5px 0;
  font-size: 0.95rem;
}

.cast-character {
  color: #aaa;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.similar-section {
  margin-top: 60px;
}

.section-title-large {
  color: white;
  font-size: 1.8rem;
  margin: 0 0 25px 0;
  padding-left: 15px;
  position: relative;
}

.section-title-large::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #e50914;
  border-radius: 2px;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 25px;
}

@media (max-width: 1024px) {
  .movie-main {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .movie-poster-section {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .backdrop-section {
    height: 50vh;
  }
  
  .container {
    margin-top: -50px;
  }
}

@media (max-width: 768px) {
  .movie-title {
    font-size: 2rem;
  }
  
  .movie-meta {
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .cast-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }
  
  .similar-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .backdrop-section {
    height: 40vh;
  }
  
  .movie-title {
    font-size: 1.7rem;
  }
  
  .similar-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
}
</style>
