<template>
  <header class="header">
    <div class="container">
      <div class="logo" @click="$router.push('/')">
        <h1>🎬 MovieHub</h1>
      </div>
      
      <nav class="nav">
        <router-link to="/" class="nav-link">Trang chủ</router-link>
        <router-link to="/genre/movie/28" class="nav-link">Hành động</router-link>
        <router-link to="/genre/movie/35" class="nav-link">Hài</router-link>
        <router-link to="/genre/movie/18" class="nav-link">Drama</router-link>
        <router-link to="/genre/tv/10765" class="nav-link">TV Shows</router-link>
      </nav>
      
      <div class="search-container">
        <input
          v-model="searchQuery"
          @input="onSearch"
          @keyup.enter="performSearch"
          type="text"
          placeholder="Tìm phim, TV shows..."
          class="search-input"
        />
        <button @click="performSearch" class="search-btn">
          🔍
        </button>
      </div>
      
      <div class="mobile-menu-btn" @click="toggleMobileMenu">
        ☰
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <div v-if="showMobileMenu" class="mobile-menu">
      <div class="mobile-search">
        <input
          v-model="searchQuery"
          @keyup.enter="performSearch"
          type="text"
          placeholder="Tìm phim..."
          class="mobile-search-input"
        />
        <button @click="performSearch" class="mobile-search-btn">
          🔍
        </button>
      </div>
      <router-link to="/" @click="closeMobileMenu" class="mobile-nav-link">
        Trang chủ
      </router-link>
      <router-link to="/genre/movie/28" @click="closeMobileMenu" class="mobile-nav-link">
        Hành động
      </router-link>
      <router-link to="/genre/movie/35" @click="closeMobileMenu" class="mobile-nav-link">
        Hài
      </router-link>
      <router-link to="/genre/movie/18" @click="closeMobileMenu" class="mobile-nav-link">
        Drama
      </router-link>
      <router-link to="/genre/tv/10765" @click="closeMobileMenu" class="mobile-nav-link">
        TV Shows
      </router-link>
    </div>
  </header>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'Header',
  setup() {
    const router = useRouter()
    const store = useStore()
    const searchQuery = ref('')
    const showMobileMenu = ref(false)
    
    const onSearch = () => {
      store.dispatch('updateSearchQuery', searchQuery.value)
    }
    
    const performSearch = () => {
      if (searchQuery.value.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
        closeMobileMenu()
      }
    }
    
    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }
    
    const closeMobileMenu = () => {
      showMobileMenu.value = false
    }
    
    return {
      searchQuery,
      showMobileMenu,
      onSearch,
      performSearch,
      toggleMobileMenu,
      closeMobileMenu
    }
  }
}
</script>

<style scoped>
.header {
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #333;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo {
  cursor: pointer;
  user-select: none;
}

.logo h1 {
  color: #e50914;
  font-size: 1.8rem;
  margin: 0;
}

.nav {
  display: flex;
  gap: 25px;
  margin-left: 40px;
}

.nav-link {
  color: #ccc;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  padding: 5px 0;
  position: relative;
}

.nav-link:hover {
  color: white;
}

.nav-link.router-link-active {
  color: #e50914;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e50914;
  border-radius: 1px;
}

.search-container {
  display: flex;
  align-items: center;
  background: #2a2a2a;
  border-radius: 25px;
  padding: 5px 15px;
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}

.search-input {
  background: none;
  border: none;
  color: white;
  padding: 8px;
  flex: 1;
  font-size: 0.95rem;
  outline: none;
}

.search-input::placeholder {
  color: #888;
}

.search-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 5px;
  transition: color 0.3s ease;
}

.search-btn:hover {
  color: #e50914;
}

.mobile-menu-btn {
  display: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  padding: 10px;
}

.mobile-menu {
  display: none;
  background: #1a1a1a;
  border-top: 1px solid #333;
  padding: 20px;
}

.mobile-search {
  display: flex;
  margin-bottom: 20px;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
}

.mobile-search-input {
  flex: 1;
  background: none;
  border: none;
  color: white;
  padding: 12px 15px;
  outline: none;
}

.mobile-search-btn {
  background: #333;
  border: none;
  color: white;
  padding: 0 20px;
  cursor: pointer;
}

.mobile-nav-link {
  display: block;
  color: #ccc;
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 1px solid #333;
  font-size: 1.1rem;
}

.mobile-nav-link:hover {
  color: white;
}

.mobile-nav-link.router-link-active {
  color: #e50914;
}

@media (max-width: 768px) {
  .nav, .search-container {
    display: none;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .mobile-menu {
    display: block;
  }
}

@media (max-width: 480px) {
  .logo h1 {
    font-size: 1.5rem;
  }
  
  .container {
    padding: 0 15px;
  }
}
</style>
