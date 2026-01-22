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

<script>
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
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
    let currentBlobUrl = null

    const destroyHls = () => {
      if (hls) {
        hls.destroy()
        hls = null
      }
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
        currentBlobUrl = null
      }
    }

    // --- HÀM CAN THIỆP M3U8 CỦA BẠN ---
    const processM3U8 = async (url) => {
      try {
        const response = await fetch(url)
        let text = await response.text()

        // Ví dụ logic loại bỏ quảng cáo: 
        // Tìm và xóa các đoạn nằm giữa #EXT-X-DISCONTINUITY hoặc link quảng cáo
        // text = text.replace(/#EXT-X-DISCONTINUITY[\s\S]*?#EXT-X-DISCONTINUITY/g, ''); 
        
        // Ghi đè logic lọc của bạn vào đây:
        const cleanM3U8 = text; 

        // Tạo Blob URL để truyền trực tiếp vào Player
        const blob = new Blob([cleanM3U8], { type: 'application/x-mpegURL' });
        currentBlobUrl = URL.createObjectURL(blob);
        return currentBlobUrl;
      } catch (error) {
        console.error("Lỗi khi xử lý m3u8:", error);
        return url; // Trả về url gốc nếu lỗi
      }
    }

    const initPlayer = async (episode) => {
      await nextTick() // Đợi DOM render xong thẻ <video>
      const video = videoRef.value
      if (!video || !episode.link_m3u8) return

      destroyHls()

      // Xử lý link trước khi đưa vào player
      const finalUrl = await processM3U8(episode.link_m3u8);

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          // Cấu hình để hỗ trợ load từ Blob
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        })

        hls.loadSource(finalUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.warn("Auto-play blocked:", e))
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Fatal Error:', data.type)
          }
        })
      } 
      // Hỗ trợ Safari/iOS chạy trực tiếp
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = finalUrl
        video.addEventListener('loadedmetadata', () => {
          video.play()
        })
      }
    }

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

    onBeforeUnmount(() => {
      destroyHls()
    })

    return { videoRef }
  }
}
</script>

<style scoped>
.video-player {
  background: #000;
  border-radius: 10px;
  overflow: hidden;
}
.player-container {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}
.video-element {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
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
  color: #666;
}
</style>
