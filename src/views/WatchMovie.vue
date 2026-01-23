<template>
  <div class="watch-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu phim...</p>
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
            <p class="movie-overview">{{ movieDetails.overview || 'Chưa có mô tả cho phim này.' }}</p>
          </div>
          
          <div v-if="episodes.length > 0" class="episode-section">
            <div class="section-title-row">
              <h2>Chọn tập phim</h2>
              <span class="total-ep">Tổng: {{ episodes.length }} link</span>
            </div>
            <EpisodeList 
              :episodes="episodes"
              :selectedEpisode="selectedEpisode"
              @select-episode="handleEpisodeSelect"
            />
          </div>
          
          <div v-if="selectedEpisode" class="server-info">
            <h3>Thông tin phát trực tuyến</h3>
            <div class="server-badge-group">
              <div class="badge-item">
                <span class="label">Nguồn:</span>
                <span class="value uppercase">{{ selectedEpisode.source }}</span>
              </div>
              <div class="badge-item">
                <span class="label">Server:</span>
                <span class="value">{{ selectedEpisode.server }}</span>
              </div>
              <div class="badge-item">
                <span class="label">Tập:</span>
                <span class="value">{{ selectedEpisode.name }}</span>
              </div>
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
      const date = movieDetails.value?.release_date || movieDetails.value?.first_air_date
      return date ? new Date(date).getFullYear() : ''
    })

    // Cập nhật URL phản ánh Source, Server, Episode
    const updateUrlParams = (ep) => {
      router.replace({
        query: { 
          ...route.query, 
          source: ep.source,
          server: ep.server,
          episode: ep.name 
        }
      })
    }

    // Tìm tập phim dựa trên các tham số URL
    const findEpisodeFromQuery = (epList) => {
      const { source, server, episode } = route.query
      if (!source || !server || !episode) return null
      
      return epList.find(e => 
        e.source === source && 
        e.server === server && 
        e.name.toString() === episode.toString()
      )
    }
    
    const fetchMovieData = async () => {
      try {
        loading.value = true
        error.value = ''
        
        // 1. Lấy chi tiết từ TMDB
        const detailsRes = await tmdbAPI.getDetails(props.type, props.id)
        movieDetails.value = detailsRes.data
        
        // 2. Lấy link stream
        const streams = await getMovieStreams({
          type: props.type,
          tmdbId: props.id
        })
        
        episodes.value = streams.all || []
        
        // 3. Chọn tập phim
        if (episodes.value.length > 0) {
          const matched = findEpisodeFromQuery(episodes.value)
          if (matched) {
            selectedEpisode.value = matched
          } else {
            selectedEpisode.value = episodes.value[0]
            updateUrlParams(episodes.value[0])
          }
        }
        
        similarMovies.value = detailsRes.data.similar?.results?.slice(0, 6) || []
        
      } catch (err) {
        console.error('Error:', err)
        error.value = 'Không thể tải phim. Vui lòng thử lại sau.'
      } finally {
        loading.value = false
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    
    const handleEpisodeSelect = (episode) => {
      selectedEpisode.value = episode
      updateUrlParams(episode)
    }
    
    const formatRuntime = (minutes) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    
    const watchSimilar = (movie) => {
      const type = movie.title ? 'movie' : 'tv'
      router.push(`/watch/${type}/${movie.id}`)
    }
    
    const goBack = () => router.back()

    // Watcher: Tải lại khi đổi ID phim (Phim tương tự)
    watch(() => props.id, fetchMovieData)
    
    onMounted(fetchMovieData)
    
    return {
      loading, error, movieDetails, episodes,
      selectedEpisode, similarMovies, releaseYear,
      handleEpisodeSelect, formatRuntime, watchSimilar, goBack
    }
  }
}
</script>

<style scoped>
.watch-page {
  min-height: 100vh;
  background: #0f0f0f;
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
  width: 40px;
  height: 40px;
  border: 3px solid rgba(229, 9, 20, 0.2);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 0.8s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.watch-content {
  display: grid;
  gap: 30px;
}

.player-section {
  grid-column: 1 / -1;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
}

.info-section { display: grid; gap: 20px; }

.movie-header, .episode-section, .server-info {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
}

.movie-title { font-size: 1.8rem; margin-bottom: 10px; }

.movie-meta { display: flex; gap: 15px; color: #aaa; margin-bottom: 15px; font-size: 0.9rem; }

.rating { color: #ffd700; font-weight: bold; }

.movie-overview { color: #ccc; line-height: 1.6; font-size: 1rem; }

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.total-ep { font-size: 0.8rem; color: #888; }

.server-badge-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.badge-item {
  background: #2a2a2a;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.badge-item .label { color: #888; margin-right: 8px; }

.badge-item .value { color: #e50914; font-weight: bold; }

.uppercase { text-transform: uppercase; }

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

@media (min-width: 1024px) {
  .watch-content { grid-template-columns: 2.5fr 1fr; }
}
</style>
