<template>
  <section class="movie-section">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <button v-if="showViewAll" @click="viewAll" class="view-all-btn">
        Xem tất cả →
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
    </div>
    
    <div v-else-if="movies.length === 0" class="no-movies">
      <p>Không có phim nào</p>
    </div>
    
    <div v-else class="movies-grid">
      <MovieCard
        v-for="movie in movies"
        :key="movie.id"
        :movie="movie"
      />
    </div>
  </section>
</template>

<script>
import { defineComponent } from 'vue'
import MovieCard from './MovieCard.vue'

export default defineComponent({
  name: 'MovieSection',
  components: {
    MovieCard
  },
  props: {
    title: {
      type: String,
      required: true
    },
    movies: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    showViewAll: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const viewAll = () => {
      emit('view-all')
    }
    
    return {
      viewAll
    }
  }
})
</script>

<style scoped>
.movie-section {
  margin-bottom: 50px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 0 10px;
}

.section-title {
  color: white;
  font-size: 1.8rem;
  margin: 0;
  position: relative;
  padding-left: 15px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #e50914;
  border-radius: 2px;
}

.view-all-btn {
  background: transparent;
  border: 1px solid #333;
  color: #aaa;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.view-all-btn:hover {
  border-color: #e50914;
  color: #e50914;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-movies {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1rem;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 25px;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
}
</style>
