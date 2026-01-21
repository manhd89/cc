<template>
  <div class="movie-card" @click="goToDetail">
    <div class="movie-poster">
      <img 
        v-lazy="posterUrl" 
        :alt="movie.title || movie.name"
        @error="handleImageError"
      >
      <div class="movie-rating">
        <span class="rating-star">★</span>
        {{ movie.vote_average?.toFixed(1) }}
      </div>
      <div v-if="movie.media_type" class="media-type">
        {{ movie.media_type === 'movie' ? 'Phim' : 'TV' }}
      </div>
    </div>
    <div class="movie-info">
      <h3 class="movie-title">{{ movie.title || movie.name }}</h3>
      <p class="movie-year">{{ year }}</p>
      <div class="movie-genres">
        <span v-for="genre in genres" :key="genre" class="genre-tag">
          {{ genre }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { tmdbAPI } from '@/api/tmdb'

export default {
  name: 'MovieCard',
  props: {
    movie: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()

    const posterUrl = computed(() => 
      tmdbAPI.getImageUrl(props.movie.poster_path, 'w342')
    )

    const year = computed(() => {
      const date = props.movie.release_date || props.movie.first_air_date
      return date ? new Date(date).getFullYear() : 'N/A'
    })

    const genres = computed(() => {
      return props.movie.genre_names?.slice(0, 2) || []
    })

    const goToDetail = () => {
      const type = props.movie.media_type || (props.movie.title ? 'movie' : 'tv')
      router.push(`/${type}/${props.movie.id}`)
    }

    const handleImageError = (e) => {
      e.target.src = '/placeholder.jpg'
    }

    return {
      posterUrl,
      year,
      genres,
      goToDetail,
      handleImageError
    }
  }
}
</script>

<style scoped>
.movie-card {
  background: #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  height: 100%;
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
}

.movie-poster {
  position: relative;
  padding-top: 150%;
  overflow: hidden;
}

.movie-poster img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.movie-card:hover .movie-poster img {
  transform: scale(1.05);
}

.movie-rating {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.rating-star {
  color: #ffd700;
}

.media-type {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #e50914;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.movie-info {
  padding: 15px;
}

.movie-title {
  font-size: 1rem;
  margin: 0 0 8px 0;
  color: white;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.movie-year {
  color: #aaa;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
}

.movie-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.genre-tag {
  background: #2a2a2a;
  color: #ccc;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}
</style>
