<template>
  <div class="search-results">
    <div class="container">
      <!-- Search Header -->
      <div class="search-header">
        <h1 v-if="searchQuery" class="search-title">
          Kết quả tìm kiếm: "{{ searchQuery }}"
        </h1>
        <h1 v-else-if="genreName" class="search-title">
          Thể loại: {{ genreName }}
        </h1>
        <h1 v-else class="search-title">
          Tìm kiếm
        </h1>
        <p v-if="totalResults > 0" class="result-count">
          {{ totalResults }} kết quả
        </p>
      </div>
      
      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      
      <!-- No Results -->
      <div v-else-if="!loading && results.length === 0" class="no-results">
        <div class="no-results-content">
          <p v-if="searchQuery">Không tìm thấy kết quả cho "{{ searchQuery }}"</p>
          <p v-else>Không có kết quả nào</p>
          <router-link to="/" class="home-link">
            ← Quay về trang chủ
          </router-link>
        </div>
      </div>
      
      <!-- Results -->
      <div v-else class="results-content">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-group">
            <label class="filter-label">Loại:</label>
            <select v-model="selectedType" class="filter-select">
              <option value="">Tất cả</option>
              <option value="movie">Phim</option>
              <option value="tv">TV Shows</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Sắp xếp:</label>
            <select v-model="selectedSort" class="filter-select">
              <option value="popularity.desc">Phổ biến</option>
              <option value="vote_average.desc">Đánh giá cao</option>
              <option value="release_date.desc">Mới nhất</option>
              <option value="release_date.asc">Cũ nhất</option>
            </select>
          </div>
        </div>
        
        <!-- Results Grid -->
        <div class="results-grid">
          <MovieCard
            v-for="item in filteredResults"
            :key="item.id"
            :movie="item"
          />
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn prev"
          >
            ← Trước
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="{ active: page === currentPage }"
              class="page-btn"
            >
              {{ page }}
            </button>
            
            <span v-if="showEllipsis" class="ellipsis">...</span>
          </div>
          
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn next"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tmdbAPI } from '@/api/tmdb'
import MovieCard from '@/components/MovieCard.vue'

export default {
  name: 'SearchResults',
  components: {
    MovieCard
  },
  props: {
    type: {
      type: String,
      default: ''
    },
    id: {
      type: [String, Number],
      default: ''
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    
    const loading = ref(true)
    const results = ref([])
    const totalResults = ref(0)
    const totalPages = ref(0)
    const currentPage = ref(1)
    const genreName = ref('')
    const searchQuery = ref(route.query.q || '')
    
    // Filters
    const selectedType = ref('')
    const selectedSort = ref('popularity.desc')
    
    const fetchSearchResults = async () => {
      try {
        loading.value = true
        
        if (props.id) {
          // Fetch by genre
          const genreResponse = await tmdbAPI.getMoviesByGenre(props.id, currentPage.value)
          results.value = genreResponse.data.results
          totalResults.value = genreResponse.data.total_results
          totalPages.value = genreResponse.data.total_pages
          
          // Get genre name
          const genresResponse = await tmdbAPI.getGenres('movie')
          const genre = genresResponse.data.genres.find(g => g.id === Number(props.id))
          genreName.value = genre?.name || ''
        } else if (searchQuery.value) {
          // Search by query
          const searchResponse = await tmdbAPI.searchMulti(searchQuery.value, currentPage.value)
          results.value = searchResponse.data.results.filter(item => 
            item.media_type === 'movie' || item.media_type === 'tv'
          )
          totalResults.value = searchResponse.data.total_results
          totalPages.value = searchResponse.data.total_pages
        }
        
      } catch (error) {
        console.error('Error fetching search results:', error)
        results.value = []
      } finally {
        loading.value = false
      }
    }
    
    const filteredResults = computed(() => {
      if (!selectedType.value) return results.value
      return results.value.filter(item => 
        item.media_type === selectedType.value || 
        (selectedType.value === 'movie' && item.title) ||
        (selectedType.value === 'tv' && item.name)
      )
    })
    
    const visiblePages = computed(() => {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
      let end = Math.min(totalPages.value, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })
    
    const showEllipsis = computed(() => {
      return totalPages.value > 5 && currentPage.value < totalPages.value - 2
    })
    
    const goToPage = (page) => {
      if (page < 1 || page > totalPages.value) return
      
      currentPage.value = page
      
      // Update URL
      const query = { ...route.query }
      if (page > 1) {
        query.page = page.toString()
      } else {
        delete query.page
      }
      
      router.replace({ query })
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      fetchSearchResults()
    }
    
    watch(() => route.query.q, (newQuery) => {
      searchQuery.value = newQuery || ''
      currentPage.value = 1
      fetchSearchResults()
    })
    
    watch(() => route.query.page, (newPage) => {
      if (newPage) {
        currentPage.value = parseInt(newPage)
      }
    })
    
    onMounted(() => {
      if (route.query.page) {
        currentPage.value = parseInt(route.query.page)
      }
      fetchSearchResults()
    })
    
    return {
      loading,
      results,
      totalResults,
      totalPages,
      currentPage,
      genreName,
      searchQuery,
      selectedType,
      selectedSort,
      filteredResults,
      visiblePages,
      showEllipsis,
      goToPage
    }
  }
}
</script>

<style scoped>
.search-results {
  min-height: 100vh;
  background: #0a0a0a;
  padding: 30px 0 60px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-header {
  margin-bottom: 40px;
  padding: 0 10px;
}

.search-title {
  color: white;
  font-size: 2rem;
  margin: 0 0 10px 0;
}

.result-count {
  color: #aaa;
  margin: 0;
  font-size: 1.1rem;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s linear infinite;
}

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
}

.no-results-content {
  max-width: 500px;
}

.no-results p {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.home-link {
  color: #e50914;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;
}

.home-link:hover {
  color: #f40612;
  text-decoration: underline;
}

.filter-bar {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: #1a1a1a;
  border-radius: 10px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  color: #ccc;
  font-size: 0.95rem;
  white-space: nowrap;
}

.filter-select {
  background: #2a2a2a;
  color: white;
  border: 1px solid #333;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.95rem;
  min-width: 150px;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #e50914;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.pagination-btn {
  background: #2a2a2a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  min-width: 100px;
}

.pagination-btn:hover:not(:disabled) {
  background: #e50914;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
  align-items: center;
}

.page-btn {
  background: #2a2a2a;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.page-btn:hover {
  background: #3a3a3a;
}

.page-btn.active {
  background: #e50914;
  color: white;
}

.ellipsis {
  color: #666;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .search-title {
    font-size: 1.7rem;
  }
  
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .pagination {
    gap: 10px;
  }
  
  .pagination-btn {
    min-width: 80px;
    padding: 8px 15px;
  }
}

@media (max-width: 480px) {
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
}
</style>
