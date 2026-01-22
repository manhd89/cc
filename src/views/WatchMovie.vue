<template>
  <div class="watch-page">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Đang tải phim...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="goBack" class="back-btn">Quay lại</button>
      </div>
      
      <!-- Content -->
      <div v-else-if="movieDetails" class="watch-content">
        <!-- Video Player -->
        <div class="player-section">
          <VideoPlayer :selectedEpisode="selectedEpisode" />
        </div>
        
        <!-- Movie Info -->
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
          
          <!-- Episode Selector -->
          <div v-if="episodes.length > 0" class="episode-section">
            <h2>Chọn tập phim</h2>
            <EpisodeList 
              :episodes="episodes"
              :selectedEpisode="selectedEpisode"
              @select-episode="handleEpisodeSelect"
            />
          </div>
          
          <!-- Server Info -->
          <div v-if="selectedEpisode" class="server-info">
            <h3>Thông tin phát trực tuyến</h3>
            <div class="server-details">
              <p><strong>Server:</strong> {{ selectedEpisode.server }}</p>
              <p><strong>Nguồn:</strong> {{ selectedEpisode.source }}</p>
              <p><strong>Tập:</strong> {{ selectedEpisode.name }}</p>
            </div>
          </div>
        </div>
        
        <!-- Related Movies -->
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
import { ref, onMounted, computed } from 'vue'
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
    },
    episode: {
      type: String,
      default: ''
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

    const log = (...args) => console.debug('[WATCH]', ...args)

    const releaseYear = computed(() => {
      const date =
        movieDetails.value?.release_date ||
        movieDetails.value?.first_air_date
      return date ? new Date(date).getFullYear() : ''
    })

    const fetchMovieData = async () => {
      try {
        loading.value = true
        log('Fetching movie:', props.type, props.id)

        /* ================= TMDB ================= */
        const detailsRes = await tmdbAPI.getDetails(props.type, props.id)
        movieDetails.value = detailsRes.data

        log('TMDB details:', movieDetails.value)

        /* ================= STREAMS ================= */
        const streams = await getMovieStreams({
          type: props.type,
          tmdb: movieDetails.value
        })

        log('Streams raw:', streams)

        streams.all.forEach((ep, i) => {
          if (!ep.link_m3u8) {
            console.warn(
              `[NO STREAM] #${i}`,
              ep.name,
              ep.server,
              ep.source,
              ep
            )
          } else {
            log(
              `[HAS STREAM]`,
              ep.name,
              ep.server,
              ep.source,
              ep.link_m3u8
            )
          }
        })

        episodes.value = streams.all

        /* ================= AUTO SELECT ================= */
        const firstPlayable = episodes.value.find(
          ep => typeof ep.link_m3u8 === 'string' && ep.link_m3u8.includes('.m3u8')
        )

        if (firstPlayable) {
          selectedEpisode.value = firstPlayable
          log('Auto selected episode:', firstPlayable)
        } else {
          console.error('❌ NO PLAYABLE EPISODE FOUND')
          selectedEpisode.value = null
        }

        /* ================= SIMILAR ================= */
        similarMovies.value =
          detailsRes.data?.similar?.results || []

      } catch (err) {
        console.error('Error fetching movie data:', err)
        error.value = 'Không thể tải phim. Vui lòng thử lại.'
      } finally {
        loading.value = false
      }
    }

    const handleEpisodeSelect = (episode) => {
      log('Episode selected:', episode)

      if (!episode?.link_m3u8) {
        console.warn('⚠️ Episode has no stream URL:', episode)
      }

      selectedEpisode.value = episode

      router.push({
        query: { ...route.query, episode: episode.name }
      })
    }

    const formatRuntime = (minutes) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }

    const watchSimilar = (movie) => {
      const type = movie.title ? 'movie' : 'tv'
      router.push(`/watch/${type}/${movie.id}`)
    }

    const goBack = () => router.back()

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
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error p {
  font-size: 1.2rem;
  color: #e50914;
  margin-bottom: 20px;
}

.back-btn {
  background: #e50914;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.watch-content {
  display: grid;
  gap: 30px;
}

.player-section {
  grid-column: 1 / -1;
}

.info-section {
  display: grid;
  gap: 30px;
}

.movie-header {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 25px;
}

.movie-title {
  font-size: 2rem;
  margin: 0 0 15px 0;
  color: white;
}

.movie-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  color: #aaa;
}

.movie-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rating {
  color: #ffd700;
  font-weight: bold;
}

.movie-overview {
  color: #ccc;
  line-height: 1.6;
  font-size: 1.1rem;
}

.episode-section, .server-info {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 25px;
}

.episode-section h2, .server-info h3 {
  margin: 0 0 20px 0;
  color: white;
  font-size: 1.5rem;
}

.server-details {
  display: grid;
  gap: 10px;
}

.server-details p {
  margin: 0;
  color: #ccc;
}

.related-section {
  grid-column: 1 / -1;
}

.related-section h2 {
  margin: 0 0 20px 20px;
  color: white;
  font-size: 1.8rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

@media (min-width: 1024px) {
  .watch-content {
    grid-template-columns: 2fr 1fr;
  }
  
  .player-section {
    grid-column: 1;
    grid-row: 1;
  }
  
  .info-section {
    grid-column: 2;
    grid-row: 1;
  }
  
  .related-section {
    grid-column: 1 / -1;
  }
}
</style>
