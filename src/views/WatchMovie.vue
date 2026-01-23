<template>
  <div class="watch-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Đang kết nối với máy chủ phát phim...</p>
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
            <p class="movie-overview">{{ movieDetails.overview || 'Chưa có tóm tắt nội dung cho phim này.' }}</p>
          </div>
          
          <div v-if="episodes.length > 0" class="episode-section">
            <h2>Chọn tập phim / Server</h2>
            <EpisodeList 
              :episodes="episodes"
              :selectedEpisode="selectedEpisode"
              @select-episode="handleEpisodeSelect"
            />
          </div>
          <div v-else class="episode-section no-episodes">
            <p>Hiện tại chưa có link xem cho phim này. Vui lòng thử lại sau.</p>
          </div>
          
          <div v-if="selectedEpisode" class="server-info">
            <h3>Nguồn phát</h3>
            <div class="server-details">
              <p><strong>Server:</strong> {{ selectedEpisode.server }}</p>
              <p><strong>Nguồn:</strong> {{ selectedEpisode.source.toUpperCase() }}</p>
              <p><strong>Định dạng:</strong> HLS (m3u8)</p>
            </div>
          </div>
        </div>
        
        <div v-if="similarMovies.length > 0" class="related-section">
          <h2>Có thể bạn cũng thích</h2>
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
import { getMovieStreams } from '@/services/streams' 
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
    
    const fetchMovieData = async () => {
      try {
        loading.value = true
        error.value = ''
        
        // 1. Lấy chi tiết phim từ TMDB (Tiếng Việt)
        const detailsRes = await tmdbAPI.getDetails(props.type, props.id)
        movieDetails.value = detailsRes.data
        
        // 2. Lấy link stream dựa trên ID và Loại (Movie/TV)
        // Dữ liệu truyền vào đồng bộ với movieSource.js bản mới nhất
        const streams = await getMovieStreams({
          type: props.type,
          tmdbId: props.id
        })
        
        episodes.value = streams.all || []
        
        // 3. Xử lý chọn tập phim mặc định
        if (episodes.value.length > 0) {
          const queryEp = route.query.episode
          if (queryEp) {
            const found = episodes.value.find(e => e.name === queryEp)
            selectedEpisode.value = found || episodes.value[0]
          } else {
            selectedEpisode.value = episodes.value[0]
          }
        }
        
        // 4. Lấy phim tương tự
        similarMovies.value = detailsRes.data.similar?.results?.slice(0, 6) || []
        
      } catch (err) {
        console.error('WatchPage Error:', err)
        error.value = 'Hệ thống gặp sự cố khi tải phim. Vui lòng quay lại sau.'
      } finally {
        loading.value = false
        // Cuộn lên đầu trang khi load phim mới
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    
    const handleEpisodeSelect = (episode) => {
      selectedEpisode.value = episode
      // Cập nhật tập phim lên URL để khi F5 không bị mất tập đang xem
      router.replace({
        query: { ...route.query, episode: episode.name }
      })
    }
    
    const formatRuntime = (minutes) => {
      if (!minutes) return ''
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    
    const watchSimilar = (movie) => {
      const movieType = movie.title ? 'movie' : 'tv'
      router.push(`/watch/${movieType}/${movie.id}`)
    }
    
    const goBack = () => {
      router.back()
    }

    // Theo dõi sự thay đổi của ID để load lại dữ liệu khi người dùng chọn phim tương tự
    watch(() => props.id, () => {
      fetchMovieData()
    })
    
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
/* Toàn bộ phần CSS giữ nguyên như bạn đã viết, rất tốt */
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
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.watch-content {
  display: grid;
  gap: 30px;
}

.player-section {
  grid-column: 1 / -1;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.info-section {
  display: grid;
  gap: 30px;
}

.movie-header {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 25px;
}

.movie-title {
  font-size: 2rem;
  margin: 0 0 15px 0;
  background: linear-gradient(to right, #fff, #aaa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.movie-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  color: #888;
  font-size: 0.95rem;
}

.rating { color: #ffb400; font-weight: bold; }

.movie-overview {
  color: #bbb;
  line-height: 1.8;
  font-size: 1rem;
}

.episode-section, .server-info {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 25px;
}

.no-episodes {
  text-align: center;
  color: #ff4d4d;
  border: 1px dashed #ff4d4d;
}

@media (min-width: 1024px) {
  .watch-content {
    grid-template-columns: 2.5fr 1fr;
  }
}
</style>
