<template>
  <div class="video-player">
    <div v-if="!selectedEpisode" class="no-episode">
      <p>Chọn tập phim để xem</p>
    </div>

    <div v-else class="player-container">
      <div class="player-wrapper">
        <!-- Video element dùng cho HLS -->
        <video
          v-if="selectedEpisode.link_m3u8"
          ref="videoRef"
          controls
          autoplay
          playsinline
          class="video-element"
        ></video>

        <div v-else class="no-stream">
          <p>Không có nguồn phát cho tập này</p>
        </div>
      </div>

      <div class="player-info">
        <h3>{{ selectedEpisode.name }}</h3>
        <p>
          Server: {{ selectedEpisode.server }}
          <span v-if="selectedEpisode.source">
            ({{ selectedEpisode.source }})
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onBeforeUnmount } from 'vue'
import Hls from 'hls.js'

export default {
  name: 'VideoPlayer',
  props: {
    selectedEpisode: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const videoRef = ref(null)
    let hls = null

    const destroyHls = () => {
      if (hls) {
        hls.destroy()
        hls = null
      }
    }

    const initPlayer = (m3u8Url) => {
      const video = videoRef.value
      if (!video || !m3u8Url) return

      destroyHls()

      // iOS Safari (native HLS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = m3u8Url
        video.load()
        video.play().catch(() => {})
        return
      }

      // Chrome / Android / Desktop
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })

        hls.loadSource(m3u8Url)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data)
        })
      } else {
        console.error('Trình duyệt không hỗ trợ HLS')
      }
    }

    // Khi đổi tập phim
    watch(
      () => props.selectedEpisode,
      (episode) => {
        if (episode?.link_m3u8) {
          initPlayer(episode.link_m3u8)
        } else {
          destroyHls()
        }
      },
      { immediate: true }
    )

    onBeforeUnmount(() => {
      destroyHls()
    })

    return {
      videoRef
    }
  }
}
</script>

<style scoped>
.video-player {
  background: #000;
  border-radius: 10px;
  overflow: hidden;
}

.no-episode,
.no-stream {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
  font-size: 1.2rem;
}

.player-container {
  position: relative;
  padding-top: 56.25%;
}

.video-element {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000;
}

.player-info {
  padding: 15px;
  background: #1a1a1a;
  border-top: 1px solid #333;
}

.player-info h3 {
  margin: 0 0 5px;
  color: #fff;
  font-size: 1.1rem;
}

.player-info p {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
}
</style>
