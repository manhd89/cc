<template>
  <div class="watch-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Đang tải phim...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="goBack" class="back-btn">Quay lại</button>
      </div>
      
      <div v-else-if="movieDetails" class="watch-content">
        <div class="player-section">
          <VideoPlayer :selectedEpisode="selectedEpisode" />
        </div>
        
        <div class="info-section">
          <div class="movie-header">
            <h1 class="movie-title">{{ movieDetails.title || movieDetails.name }}</h1>
            <div class="movie-meta">
              <span class="rating">★ {{ movieDetails.vote_average?.toFixed(1) }}</span>
              <span class="year">{{ releaseYear }}</span>
              <span class="runtime" v-if="movieDetails.runtime">
                {{ formatRuntime(movieDetails.runtime) }}
              </span>
            </div>
            <p class="movie-overview">{{ movieDetails.overview }}</p>
          </div>
          
          <div v-if="episodes.length > 0" class="episode-section">
            <h2>Chọn tập phim</h2>
            <EpisodeList 
              :episodes="episodes"
              :selectedEpisode="selectedEpisode"
              @select-episode="handleEpisodeSelect"
            />
          </div>
          
          <div v-if="selectedEpisode" class="server-info">
            <h3>Thông tin phát trực tuyến</h3>
            <div class="server-details">
              <p><strong>Server:</strong> {{ selectedEpisode.server }}</p>
              <p><strong>Nguồn:</strong> {{ selectedEpisode.source }}</p>
              <p><strong>Tập:</strong> {{ selectedEpisode.name }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="similarMovies.length > 0" class="related-section">
          <h2>Phim tương tự</h2>
          <div class="related-grid">
            <MovieCard
              v-for="movie in similarMovies"
              :key="movie.id"
              :movie="movie"
              @click="watchSimilar(movie)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tmdbAPI } from '@/api/tmdb'
import { getMovieStreams } from '@/api/streams'
import VideoPlayer from '@/components/VideoPlayer.vue'
import EpisodeList from '@/components/EpisodeList.vue'
import MovieCard from '@/components/MovieCard.vue'

export default {
  name: 'WatchMovie',
  components: {
    VideoPlayer,
    EpisodeList,
    MovieCard
  },
  props: {
    type: {
      type: String,
      required: true
    },
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    
    const loading = ref(true)
    const error = ref('')
    const movieDetails = ref(null)
    const episodes = ref([])
    const selectedEpisode = ref(null)
    const similarMovies = ref([])
    
    const releaseYear = computed(() => {
      const date = movieDetails.value?.release_date || 
                  movieDetails.value?.first_air_date
      return date ? new Date(date).getFullYear() : ''
    })

    // Hàm cập nhật URL đồng bộ với tập phim đang chọn
    const updateUrlQuery = (episode) => {
      router.push({
        query: { 
          ep: episode.name,
          sv: episode.server,
          src: episode.source
        }
      })
    }
    
    const fetchMovieData = async () => {
      try {
        loading.value = true
        error.value = ''
        
        // 1. Lấy chi tiết phim từ TMDB
        const detailsRes = await tmdbAPI.getDetails(props.type, props.id)
        movieDetails.value = detailsRes.data
        
        // 2. Lấy danh sách link stream/tập phim
        const streams = await getMovieStreams({
          type: props.type,
          tmdb: movieDetails.value
        })
        
        episodes.value = streams.all
        
        // 3. Logic chọn tập phim hiển thị
        const { ep, sv, src } = route.query
        const foundEpisode = episodes.value.find(e => 
          e.name == ep && e.server == sv && e.source == src
        )
        
        if (foundEpisode) {
          selectedEpisode.value = foundEpisode
        } else if (episodes.value.length > 0) {
          selectedEpisode.value = episodes.value[0]
          // Tự động cập nhật URL theo tập đầu tiên nếu URL query trống hoặc sai
          updateUrlQuery(selectedEpisode.value)
        }
        
        // 4. Lấy phim tương tự
        similarMovies.value = detailsRes.data.similar?.results || []
        
        // Cuộn lên đầu trang khi đổi phim
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
      } catch (err) {
        console.error('Error fetching movie data:', err)
        error.value = 'Không thể tải phim. Vui lòng thử lại.'
      } finally {
        loading.value = false
      }
    }
    
    // Xử lý khi người dùng click chọn tập phim khác
    const handleEpisodeSelect = (episode) => {
      selectedEpisode.value = episode
      updateUrlQuery(episode)
    }
    
    // Xử lý khi bấm vào phim tương tự
    const watchSimilar = (movie) => {
      const type = movie.title ? 'movie' : 'tv'
      // Đẩy route mới, watch(props.id) bên dưới sẽ kích hoạt việc tải lại data
      router.push(`/watch/${type}/${movie.id}`)
    }

    // QUAN TRỌNG: Theo dõi sự thay đổi của ID phim để tải lại dữ liệu
    watch(() => props.id, () => {
      fetchMovieData()
    })
    
    const formatRuntime = (minutes) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    
    const goBack = () => {
      router.back()
    }
    
    onMounted(fetchMovieData)
    
    return {
      loading,
      error,
      movieDetails,
      episodes,
      selectedEpisode,
      similarMovies,
      releaseYear,
      handleEpisodeSelect,
      formatRuntime,
      watchSimilar,
      goBack
    }
  }
}
</script>

<style scoped>
/* Giữ nguyên phần Style của bạn hoặc tùy chỉnh thêm */
.watch-page {
  min-height: 100vh;
  background: #0a0a0a;
  color: white;
  padding: 20px 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}
.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.watch-content {
  display: grid;
  gap: 30px;
}
.player-section { grid-column: 1 / -1; }
.movie-header, .episode-section, .server-info {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 25px;
}
.movie-title { font-size: 2rem; margin-bottom: 15px; }
.movie-meta { display: flex; gap: 20px; margin-bottom: 20px; color: #aaa; }
.rating { color: #ffd700; font-weight: bold; }
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}
@media (min-width: 1024px) {
  .watch-content { grid-template-columns: 2fr 1fr; }
  .player-section { grid-column: 1; }
  .info-section { grid-column: 2; }
  .related-section { grid-column: 1 / -1; }
}
</style>
