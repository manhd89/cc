<template>
  <div class="video-player">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải video...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button v-if="selectedEpisode?.link_embed" @click="useEmbed" class="fallback-btn">
        Thử phát qua iframe
      </button>
    </div>
    
    <!-- No Episode Selected -->
    <div v-else-if="!selectedEpisode" class="no-episode">
      <div class="no-episode-icon">▶</div>
      <p>Chọn tập phim để xem</p>
    </div>
    
    <!-- Video Content -->
    <div v-else class="player-container">
      <div class="player-wrapper">
        <!-- HLS Video Player -->
        <div v-if="!useEmbedFallback" class="hls-player">
          <video
            ref="videoRef"
            class="video-element"
            controls
            preload="metadata"
            crossorigin="anonymous"
          ></video>
          
          <!-- Custom Controls Overlay (optional) -->
          <div v-if="showControls" class="custom-controls">
            <button @click="togglePlay" class="control-btn play-btn">
              {{ isPlaying ? '❚❚' : '▶' }}
            </button>
            <div class="time-display">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>
            <input
              v-model="volume"
              @input="updateVolume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="volume-slider"
            />
            <button @click="toggleFullscreen" class="control-btn fullscreen-btn">
              ⛶
            </button>
          </div>
        </div>
        
        <!-- Embed Fallback -->
        <iframe
          v-else
          :src="embedUrl"
          frameborder="0"
          allowfullscreen
          class="embed-iframe"
          @load="onIframeLoad"
        ></iframe>
      </div>
      
      <!-- Player Info -->
      <div class="player-info">
        <div class="info-header">
          <h3>{{ selectedEpisode.name }}</h3>
          <div class="quality-badge" v-if="currentQuality">
            {{ currentQuality }}
          </div>
        </div>
        
        <div class="info-details">
          <div class="detail-item">
            <span class="detail-label">Server:</span>
            <span class="detail-value">{{ selectedEpisode.server }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Nguồn:</span>
            <span class="detail-value">{{ selectedEpisode.source }}</span>
          </div>
          <div class="detail-item" v-if="hlsInstance">
            <span class="detail-label">Trạng thái:</span>
            <span class="status-badge" :class="statusClass">
              {{ playerStatus }}
            </span>
          </div>
        </div>
        
        <!-- Quality Selector -->
        <div v-if="availableQualities.length > 1" class="quality-selector">
          <label class="quality-label">Chất lượng:</label>
          <select v-model="selectedQuality" @change="changeQuality" class="quality-select">
            <option v-for="quality in availableQualities" :key="quality" :value="quality">
              {{ quality }}
            </option>
          </select>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button
            v-if="selectedEpisode.link_embed && !useEmbedFallback"
            @click="useEmbed"
            class="action-btn embed-btn"
          >
            ↗ Phát qua iframe
          </button>
          <button
            v-if="useEmbedFallback"
            @click="useHLS"
            class="action-btn hls-btn"
          >
            ⚡ Phát trực tiếp
          </button>
          <button
            @click="copyStreamUrl"
            class="action-btn copy-btn"
            :title="selectedEpisode.link_m3u8 || selectedEpisode.link_embed"
          >
            📋 Copy link
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Hls from 'hls.js'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

export default {
  name: 'VideoPlayer',
  props: {
    selectedEpisode: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // Refs
    const videoRef = ref(null)
    const hlsInstance = ref(null)
    const loading = ref(false)
    const error = ref('')
    const useEmbedFallback = ref(false)
    const isPlaying = ref(false)
    const currentTime = ref(0)
    const duration = ref(0)
    const volume = ref(1)
    const showControls = ref(false)
    const availableQualities = ref([])
    const selectedQuality = ref('auto')
    const currentQuality = ref('')
    
    // Computed
    const embedUrl = computed(() => {
      if (!props.selectedEpisode?.link_embed) return ''
      // Add referrer policy to embed URL
      const url = new URL(props.selectedEpisode.link_embed)
      url.searchParams.set('referrer', window.location.origin)
      return url.toString()
    })
    
    const playerStatus = computed(() => {
      if (loading.value) return 'Đang tải...'
      if (error.value) return 'Lỗi'
      if (isPlaying.value) return 'Đang phát'
      return 'Tạm dừng'
    })
    
    const statusClass = computed(() => {
      if (error.value) return 'status-error'
      if (isPlaying.value) return 'status-playing'
      return 'status-paused'
    })
    
    // Methods
    const initHLS = () => {
      if (!props.selectedEpisode?.link_m3u8) {
        error.value = 'Không có link M3U8'
        return
      }
      
      if (!Hls.isSupported()) {
        console.log('HLS not supported, falling back to embed')
        useEmbedFallback.value = true
        return
      }
      
      destroyHLS()
      loading.value = true
      error.value = ''
      useEmbedFallback.value = false
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        maxSeekHole: 2,
        maxFragLookUpTolerance: 0.2,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false
          // Add CORS headers if needed
          xhr.setRequestHeader('Origin', window.location.origin)
        }
      })
      
      hls.loadSource(props.selectedEpisode.link_m3u8)
      hls.attachMedia(videoRef.value)
      
      // Event listeners
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('Manifest parsed, video loaded')
        loading.value = false
        
        // Get available quality levels
        if (hls.levels && hls.levels.length > 0) {
          availableQualities.value = [
            'auto',
            ...hls.levels.map(level => `${level.height}p`)
          ]
        }
        
        // Auto play if possible
        videoRef.value?.play()?.catch(e => {
          console.log('Autoplay prevented:', e)
        })
      })
      
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level]
        if (level) {
          currentQuality.value = `${level.height}p`
        }
      })
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data)
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.log('Fatal error, destroying HLS...')
              destroyHLS()
              error.value = 'Lỗi phát video'
              if (props.selectedEpisode?.link_embed) {
                useEmbedFallback.value = true
              }
              break
          }
        }
        
        loading.value = false
      })
      
      hlsInstance.value = hls
    }
    
    const destroyHLS = () => {
      if (hlsInstance.value) {
        hlsInstance.value.destroy()
        hlsInstance.value = null
      }
    }
    
    const useEmbed = () => {
      destroyHLS()
      useEmbedFallback.value = true
      error.value = ''
    }
    
    const useHLS = () => {
      if (Hls.isSupported() && props.selectedEpisode?.link_m3u8) {
        useEmbedFallback.value = false
        initHLS()
      }
    }
    
    const togglePlay = () => {
      if (!videoRef.value) return
      
      if (videoRef.value.paused) {
        videoRef.value.play()
      } else {
        videoRef.value.pause()
      }
    }
    
    const updateVolume = () => {
      if (videoRef.value) {
        videoRef.value.volume = volume.value
      }
    }
    
    const toggleFullscreen = () => {
      const player = videoRef.value?.parentElement
      if (!player) return
      
      if (!document.fullscreenElement) {
        player.requestFullscreen?.() || 
        player.webkitRequestFullscreen?.() ||
        player.msRequestFullscreen?.()
      } else {
        document.exitFullscreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.msExitFullscreen?.()
      }
    }
    
    const changeQuality = () => {
      if (!hlsInstance.value || selectedQuality.value === 'auto') {
        hlsInstance.value?.currentLevel = -1
        return
      }
      
      const levelIndex = hlsInstance.value.levels.findIndex(
        level => `${level.height}p` === selectedQuality.value
      )
      
      if (levelIndex !== -1) {
        hlsInstance.value.currentLevel = levelIndex
      }
    }
    
    const copyStreamUrl = async () => {
      const url = props.selectedEpisode?.link_m3u8 || props.selectedEpisode?.link_embed
      if (!url) return
      
      try {
        await navigator.clipboard.writeText(url)
        alert('Đã copy link vào clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Đã copy link vào clipboard!')
      }
    }
    
    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '00:00'
      
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      
      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    const onIframeLoad = () => {
      loading.value = false
    }
    
    const setupVideoListeners = () => {
      if (!videoRef.value) return
      
      videoRef.value.addEventListener('play', () => {
        isPlaying.value = true
      })
      
      videoRef.value.addEventListener('pause', () => {
        isPlaying.value = false
      })
      
      videoRef.value.addEventListener('timeupdate', () => {
        currentTime.value = videoRef.value.currentTime
        duration.value = videoRef.value.duration || 0
      })
      
      videoRef.value.addEventListener('volumechange', () => {
        volume.value = videoRef.value.volume
      })
      
      videoRef.value.addEventListener('mouseenter', () => {
        showControls.value = true
      })
      
      videoRef.value.addEventListener('mouseleave', () => {
        showControls.value = false
      })
    }
    
    // Watchers
    watch(() => props.selectedEpisode, (newEpisode) => {
      if (!newEpisode) return
      
      loading.value = true
      error.value = ''
      useEmbedFallback.value = false
      availableQualities.value = []
      selectedQuality.value = 'auto'
      currentQuality.value = ''
      
      // Destroy previous instance
      destroyHLS()
      
      // Check which source to use
      if (newEpisode.link_m3u8 && Hls.isSupported()) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initHLS()
          setupVideoListeners()
        }, 100)
      } else if (newEpisode.link_embed) {
        useEmbedFallback.value = true
        loading.value = true
      } else {
        error.value = 'Không có nguồn phát hợp lệ'
        loading.value = false
      }
    }, { immediate: true })
    
    // Lifecycle
    onMounted(() => {
      if (videoRef.value) {
        setupVideoListeners()
      }
    })
    
    onUnmounted(() => {
      destroyHLS()
      
      if (videoRef.value) {
        videoRef.value.pause()
        videoRef.value.src = ''
        videoRef.value.load()
      }
    })
    
    return {
      // Refs
      videoRef,
      hlsInstance,
      loading,
      error,
      useEmbedFallback,
      isPlaying,
      currentTime,
      duration,
      volume,
      showControls,
      availableQualities,
      selectedQuality,
      currentQuality,
      
      // Computed
      embedUrl,
      playerStatus,
      statusClass,
      
      // Methods
      initHLS,
      destroyHLS,
      useEmbed,
      useHLS,
      togglePlay,
      updateVolume,
      toggleFullscreen,
      changeQuality,
      copyStreamUrl,
      formatTime,
      onIframeLoad
    }
  }
}
</script>

<style scoped>
.video-player {
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #e50914;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
  text-align: center;
  color: #e50914;
}

.error-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e50914;
  color: white;
  font-size: 30px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.fallback-btn {
  background: #e50914;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.fallback-btn:hover {
  background: #f40612;
}

/* No Episode */
.no-episode {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
  font-size: 1.2rem;
}

.no-episode-icon {
  font-size: 60px;
  margin-bottom: 15px;
  opacity: 0.5;
}

/* Player Container */
.player-container {
  position: relative;
}

.player-wrapper {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background: #000;
}

/* HLS Player */
.hls-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-element {
  width: 100%;
  height: 100%;
  background: #000;
  outline: none;
}

/* Custom Controls */
.custom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.hls-player:hover .custom-controls {
  opacity: 1;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.time-display {
  color: white;
  font-size: 14px;
  font-family: monospace;
  margin: 0 10px;
}

.volume-slider {
  flex: 1;
  max-width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e50914;
  cursor: pointer;
}

/* Embed Iframe */
.embed-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Player Info */
.player-info {
  padding: 20px;
  background: #1a1a1a;
  border-top: 1px solid #333;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.info-header h3 {
  margin: 0;
  color: white;
  font-size: 1.2rem;
  flex: 1;
}

.quality-badge {
  background: #e50914;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.info-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.detail-label {
  color: #888;
  font-size: 0.9rem;
}

.detail-value {
  color: #ccc;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-playing {
  background: #2ecc71;
  color: white;
}

.status-paused {
  background: #f39c12;
  color: white;
}

.status-error {
  background: #e74c3c;
  color: white;
}

/* Quality Selector */
.quality-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background: #2a2a2a;
  border-radius: 6px;
}

.quality-label {
  color: #ccc;
  font-size: 0.9rem;
}

.quality-select {
  background: #1a1a1a;
  color: white;
  border: 1px solid #333;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 100px;
  outline: none;
  cursor: pointer;
}

.quality-select:focus {
  border-color: #e50914;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.embed-btn {
  background: #3498db;
  color: white;
}

.embed-btn:hover {
  background: #2980b9;
}

.hls-btn {
  background: #2ecc71;
  color: white;
}

.hls-btn:hover {
  background: #27ae60;
}

.copy-btn {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #333;
}

.copy-btn:hover {
  background: #3a3a3a;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .info-details {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .custom-controls {
    padding: 10px;
  }
  
  .time-display {
    font-size: 12px;
  }
}
</style>
