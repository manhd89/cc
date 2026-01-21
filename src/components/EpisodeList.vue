<template>
  <div class="episode-list">
    <div class="server-selector" v-if="Object.keys(groupedEpisodes).length > 1">
      <button
        v-for="server in Object.keys(groupedEpisodes)"
        :key="server"
        @click="selectedServer = server"
        :class="{ active: selectedServer === server }"
        class="server-btn"
      >
        {{ server }}
      </button>
    </div>
    
    <div class="episodes-grid">
      <button
        v-for="episode in currentEpisodes"
        :key="`${episode.server}-${episode.name}`"
        @click="$emit('select-episode', episode)"
        :class="{ active: isActive(episode) }"
        class="episode-btn"
      >
        {{ episode.name }}
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  name: 'EpisodeList',
  props: {
    episodes: {
      type: Array,
      default: () => []
    },
    selectedEpisode: {
      type: Object,
      default: null
    }
  },
  emits: ['select-episode'],
  setup(props) {
    const selectedServer = ref('')
    
    const groupedEpisodes = computed(() => {
      const groups = {}
      props.episodes.forEach(ep => {
        if (!groups[ep.server]) {
          groups[ep.server] = []
        }
        groups[ep.server].push(ep)
      })
      return groups
    })
    
    const currentEpisodes = computed(() => {
      if (selectedServer.value && groupedEpisodes.value[selectedServer.value]) {
        return groupedEpisodes.value[selectedServer.value]
      }
      // Trả về tất cả tập nếu không chọn server cụ thể
      return props.episodes
    })
    
    const isActive = (episode) => {
      if (!props.selectedEpisode) return false
      return episode.name === props.selectedEpisode.name && 
             episode.server === props.selectedEpisode.server
    }
    
    // Chọn server đầu tiên nếu có
    if (Object.keys(groupedEpisodes.value).length > 0) {
      selectedServer.value = Object.keys(groupedEpisodes.value)[0]
    }
    
    return {
      selectedServer,
      groupedEpisodes,
      currentEpisodes,
      isActive
    }
  }
}
</script>

<style scoped>
.episode-list {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 20px;
}

.server-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.server-btn {
  background: #2a2a2a;
  border: none;
  color: #ccc;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.server-btn:hover {
  background: #3a3a3a;
  color: white;
}

.server-btn.active {
  background: #e50914;
  color: white;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 10px;
}

.episode-btn {
  background: #2a2a2a;
  border: none;
  color: #ccc;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.episode-btn:hover {
  background: #3a3a3a;
  color: white;
}

.episode-btn.active {
  background: #e50914;
  color: white;
  transform: scale(1.05);
}
</style>
