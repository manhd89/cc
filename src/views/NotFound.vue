<template>
  <div class="not-found">
    <div class="container">
      <div class="error-content">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Trang không tìm thấy</h2>
        <p class="error-message">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
        </p>
        <div class="action-buttons">
          <router-link to="/" class="home-btn">
            ← Quay về trang chủ
          </router-link>
          <button @click="goBack" class="back-btn">
            Quay lại
          </button>
        </div>
        <div class="search-suggest">
          <p>Hoặc tìm kiếm phim:</p>
          <div class="search-box">
            <input
              v-model="searchTerm"
              @keyup.enter="searchMovies"
              type="text"
              placeholder="Nhập tên phim..."
              class="search-input"
            />
            <button @click="searchMovies" class="search-btn">
              🔍
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()
    const searchTerm = ref('')
    
    const goBack = () => {
      router.back()
    }
    
    const searchMovies = () => {
      if (searchTerm.value.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchTerm.value)}`)
      }
    }
    
    return {
      searchTerm,
      goBack,
      searchMovies
    }
  }
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.error-content {
  text-align: center;
  padding: 40px;
  background: #1a1a1a;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.error-code {
  font-size: 8rem;
  color: #e50914;
  margin: 0;
  line-height: 1;
  text-shadow: 3px 3px 0 rgba(229, 9, 20, 0.3);
}

.error-title {
  color: white;
  font-size: 2.5rem;
  margin: 20px 0;
}

.error-message {
  color: #aaa;
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto 40px;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.home-btn, .back-btn {
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.home-btn {
  background: #e50914;
  color: white;
  border: none;
}

.home-btn:hover {
  background: #f40612;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(229, 9, 20, 0.4);
}

.back-btn {
  background: transparent;
  color: white;
  border: 2px solid #333;
}

.back-btn:hover {
  border-color: #e50914;
  color: #e50914;
  transform: translateY(-2px);
}

.search-suggest {
  background: #2a2a2a;
  padding: 30px;
  border-radius: 10px;
  text-align: left;
}

.search-suggest p {
  color: #ccc;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.search-box {
  display: flex;
  gap: 10px;
}

.search-input {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid #333;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #e50914;
}

.search-btn {
  background: #e50914;
  color: white;
  border: none;
  padding: 0 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background 0.3s ease;
}

.search-btn:hover {
  background: #f40612;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 2rem;
  }
  
  .error-message {
    font-size: 1.1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .home-btn, .back-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .search-btn {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .error-code {
    font-size: 4rem;
  }
  
  .error-title {
    font-size: 1.7rem;
  }
  
  .error-content {
    padding: 30px 20px;
  }
}
</style>
