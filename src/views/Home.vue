<template>
  <div class="home">
    <!-- Hero Banner -->
    <div class="hero-banner" v-if="featuredMovie">
      <img 
        :src="bannerUrl" 
        :alt="featuredMovie.title || featuredMovie.name"
        class="hero-background"
      >
      <div class="hero-content">
        <h1 class="hero-title">{{ featuredMovie.title || featuredMovie.name }}</h1>
        <p class="hero-overview">{{ featuredMovie.overview }}</p>
        <div class="hero-actions">
          <button @click="playMovie" class="play-btn">
            ▶ Phát ngay
          </button>
          <button @click="goToDetail" class="detail-btn">
            ℹ Chi tiết
          </button>
        </div>
      </div>
    </div>

    <!-- Movie Sections -->
    <div class="container">
      <MovieSection 
        title="Phim Phổ Biến"
        :movies="popularMovies"
        @load-more="loadMorePopular"
      />
      
      <MovieSection 
        title="Phim Đang Chiếu"
        :movies="nowPlayingMovies"
        @load-more="loadMoreNowPlaying"
      />
      
      <MovieSection 
        title="TV Shows Phổ Biến"
        :movies="popularTVShows"
        @load-more="loadMoreTVShows"
      />
      
      <MovieSection 
        title="Phim Sắp Chiếu"
        :movies="upcomingMovies"
        @load-more="loadMoreUpcoming"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tmdbAPI } from '@/api/tmdb'
import MovieSection from '@/components/MovieSection.vue'

export default {
  name: 'Home',
  components: {
    MovieSection
  },
  setup() {
    const router = useRouter()
    
    const popularMovies = ref([])
    const nowPlayingMovies = ref([])
    const popularTVShows = ref([])
    const upcomingMovies = ref([])
    const featuredMovie = ref(null)
    
    const bannerUrl = computed(() => 
      tmdbAPI.getImageUrl(featuredMovie.value?.backdrop_path, 'original')
    )
    
    const fetchMovies = async () => {
      try {
        const [
          popularRes,
          nowPlayingRes,
          tvRes,
          upcomingRes
        ] = await Promise.all([
          tmdbAPI.getPopularMovies(),
          tmdbAPI.getNowPlayingMovies(),
          tmdbAPI.getPopularTVShows(),
          tmdbAPI.getUpcomingMovies()
        ])
        
        popularMovies.value = popularRes.data.results
        nowPlayingMovies.value = nowPlayingRes.data.results
        popularTVShows.value = tvRes.data.results
        upcomingMovies.value = upcomingRes.data.results
        
        // Chọn phim cho banner
        featuredMovie.value = popularMovies.value[0] || nowPlayingMovies.value[0]
      } catch (error) {
        console.error('Error fetching movies:', error)
      }
    }
    
    const playMovie = () => {
      if (featuredMovie.value) {
        const type = featuredMovie.value.title ? 'movie' : 'tv'
        router.push(`/watch/${type}/${featuredMovie.value.id}`)
      }
    }
    
    const goToDetail = () => {
      if (featuredMovie.value) {
        const type = featuredMovie.value.title ? 'movie' : 'tv'
        router.push(`/${type}/${featuredMovie.value.id}`)
      }
    }
    
    const loadMorePopular = () => {
      // Implement load more logic
    }
    
    onMounted(fetchMovies)
    
    return {
      popularMovies,
      nowPlayingMovies,
      popularTVShows,
      upcomingMovies,
      featuredMovie,
      bannerUrl,
      playMovie,
      goToDetail,
      loadMorePopular,
      loadMoreNowPlaying: loadMorePopular,
      loadMoreTVShows: loadMorePopular,
      loadMoreUpcoming: loadMorePopular
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #0a0a0a;
}

.hero-banner {
  position: relative;
  height: 70vh;
  min-height: 500px;
  overflow: hidden;
  margin-bottom: 40px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
}

.hero-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 5%;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  max-width: 600px;
}

.hero-title {
  font-size: 3rem;
  color: white;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-overview {
  color: #ccc;
  font-size: 1.1rem;
  line-height: 1.5;
  margin: 0 0 30px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  gap: 15px;
}

.play-btn, .detail-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-btn {
  background: #e50914;
  color: white;
}

.play-btn:hover {
  background: #f40612;
  transform: scale(1.05);
}

.detail-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.detail-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
