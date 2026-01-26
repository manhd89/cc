<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <span class="logo-icon">🎬</span>
          <span class="logo-text">MovieHub</span>
        </router-link>

        <!-- Navigation -->
        <nav class="nav">
          <router-link to="/" class="nav-link">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Trang chủ</span>
          </router-link>
          
          <router-link to="/search" class="nav-link">
            <span class="nav-icon">🔍</span>
            <span class="nav-text">Tìm kiếm</span>
          </router-link>
          
          <router-link to="/favorites" class="nav-link" v-if="favorites.length > 0">
            <span class="nav-icon">❤️</span>
            <span class="nav-text">Yêu thích ({{ favorites.length }})</span>
          </router-link>
          
          <router-link to="/history" class="nav-link" v-if="watchHistory.length > 0">
            <span class="nav-icon">🕒</span>
            <span class="nav-text">Đã xem ({{ watchHistory.length }})</span>
          </router-link>
        </nav>

        <!-- Search Bar -->
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            placeholder="Tìm phim, TV shows..."
            class="search-input"
          />
          <button @click="handleSearch" class="search-btn">
            <span class="search-icon">🔍</span>
          </button>
        </div>

        <!-- Mobile Menu -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <span class="menu-icon">☰</span>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
          <span class="nav-icon">🏠</span> Trang chủ
        </router-link>
        
        <router-link to="/search" class="mobile-nav-link" @click="closeMobileMenu">
          <span class="nav-icon">🔍</span> Tìm kiếm
        </router-link>
        
        <router-link v-if="favorites.length > 0" to="/favorites" 
          class="mobile-nav-link" @click="closeMobileMenu">
          <span class="nav-icon">❤️</span> Yêu thích ({{ favorites.length }})
        </router-link>
        
        <router-link v-if="watchHistory.length > 0" to="/history" 
          class="mobile-nav-link" @click="closeMobileMenu">
          <span class="nav-icon">🕒</span> Đã xem ({{ watchHistory.length }})
        </router-link>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'Header',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const searchQuery = ref('')
    const mobileMenuOpen = ref(false)

    const favorites = computed(() => store.state.favorites)
    const watchHistory = computed(() => store.state.watchHistory)

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        store.dispatch('updateSearchQuery', searchQuery.value.trim())
        router.push({
          path: '/search',
          query: { q: searchQuery.value.trim() }
        })
        searchQuery.value = ''
        closeMobileMenu()
      }
    }

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }

    const closeMobileMenu = () => {
      mobileMenuOpen.value = false
    }

    return {
      searchQuery,
      mobileMenuOpen,
      favorites,
      watchHistory,
      handleSearch,
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
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #e50914;
  font-size: 1.5rem;
  font-weight: bold;
}

.logo-icon {
  font-size: 1.8rem;
}

.nav {
  display: flex;
  gap: 20px;
  margin-left: 40px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.router-link-active {
  background: #e50914;
  color: white;
}

.nav-text {
  font-size: 0.9rem;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  max-width: 400px;
  margin-left: auto;
}

.search-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px 15px;
  color: white;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #e50914;
  background: rgba(255, 255, 255, 0.15);
}

.search-btn {
  background: #e50914;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: #f40612;
  transform: scale(1.05);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(10, 10, 10, 0.98);
  border-top: 1px solid #333;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 10px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ccc;
  text-decoration: none;
  padding: 12px 15px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.mobile-nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

@media (max-width: 1024px) {
  .nav {
    display: none;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .search-container {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .search-container {
    display: none;
  }
  
  .logo-text {
    display: none;
  }
}
</style>
