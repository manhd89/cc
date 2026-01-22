<template>
  <div class="video-player">
    <div v-if="!selectedEpisode" class="no-episode">
      <p>Chọn tập phim để xem</p>
    </div>

    <div v-else class="player-container">
      <div class="player-wrapper">
        <video
          ref="videoRef"
          controls
          autoplay
          playsinline
          class="video-element"
        ></video>
      </div>

      <div class="player-info">
        <h3>{{ selectedEpisode.name }}</h3>
        <p>Server: {{ selectedEpisode.server }} ({{ selectedEpisode.source }})</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import Hls from 'hls.js'

const props = defineProps({
  selectedEpisode: {
    type: Object,
    default: null
  }
})

const videoRef = ref(null)
let hls = null

// Hủy hls instance và dọn dẹp khi cần
const destroyHls = () => {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

const initPlayer = async (episode) => {
  if (!episode?.link_m3u8) return

  await nextTick() // Đảm bảo video element đã render

  const video = videoRef.value
  if (!video) return

  // Dọn dẹp instance cũ nếu có
  destroyHls()

  // Load trực tiếp link m3u8 gốc (không xử lý manifest)
  const m3u8Url = episode.link_m3u8

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferLength: 120,
      maxMaxBufferLength: 180,
      xhrSetup: (xhr) => {
        xhr.withCredentials = false // Nếu server không yêu cầu cookie thì để false
      }
    })

    hls.loadSource(m3u8Url)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(e => {
        console.warn('Auto-play bị chặn:', e)
      })
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error:', data.type, data.details)
        // Có thể thêm logic fallback nếu cần
      }
    })
  } 
  // Native HLS cho Safari/iOS
  else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = m3u8Url
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(e => console.warn('Auto-play bị chặn:', e))
    })
  } else {
    console.error('Trình duyệt không hỗ trợ HLS')
  }
}

// Theo dõi thay đổi selectedEpisode
watch(
  () => props.selectedEpisode,
  (newEpisode) => {
    if (newEpisode) {
      initPlayer(newEpisode)
    } else {
      destroyHls()
    }
  },
  { immediate: true }
)

// Cleanup khi component bị hủy
onBeforeUnmount(() => {
  destroyHls()
})
</script>

<style scoped>
.video-player {
  background: #000;
  border-radius: 10px;
  overflow: hidden;
}

.player-container {
  position: relative;
  padding-top: 56.25%; /* Tỷ lệ 16:9 */
}

.player-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-info {
  padding: 15px;
  background: #1a1a1a;
  color: #fff;
}

.no-episode {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1.2rem;
}
</style>
