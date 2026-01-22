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

    /* ================= LOGIC XỬ LÝ QUẢNG CÁO ================= */
    
    const cleanManifest = (manifest) => {
      const rules = [
        [/\n#EXT-X-DISCONTINUITY\n#EXT-X-KEY:METHOD=NONE[\s\S]*?#EXT-X-DISCONTINUITY\n/g, "\n"],
        [/\n#EXT-X-DISCONTINUITY(?:\n#EXTINF:[\d.]+,\n.*?){10,18}\n#EXT-X-DISCONTINUITY/g, "\n"],
        [/#EXT-X-DISCONTINUITY\n/g, ""],
        [/\/convertv7\//g, "/"],
        [/\n{2,}/g, "\n"],
      ];
      return rules.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), manifest).trim();
    }

    const fetchAndProcessPlaylist = async (playlistUrl) => {
      let req;
      try {
        // Lưu ý: Nếu vẫn bị lỗi CORS, bạn có thể cần thêm một Proxy URL ở phía trước playlistUrl
        req = await fetch(playlistUrl);
        if (!req.ok) throw new Error(`Failed to fetch playlist: ${req.statusText}`);
      } catch (error) {
        console.error('Failed to fetch playlist:', error);
        return playlistUrl;
      }

      let playlistText = await req.text();

      // Fix đường dẫn tương đối thành tuyệt đối
      playlistText = playlistText.replace(/^[^#].*$/gm, (line) => {
        try {
          const parsedUrl = new URL(line, playlistUrl);
          return parsedUrl.toString();
        } catch {
          return line;
        }
      });

      // Nếu là Master Playlist (chứa nhiều chất lượng 720p, 1080p)
      if (playlistText.includes('#EXT-X-STREAM-INF')) {
        const lines = playlistText.trim().split('\n');
        const subPlaylistUrl = lines.slice(-1)[0];
        return fetchAndProcessPlaylist(subPlaylistUrl);
      }

      // Lọc quảng cáo
      const processedPlaylist = cleanManifest(playlistText);

      // Tạo Blob
      currentBlobUrl = URL.createObjectURL(
        new Blob([processedPlaylist], { type: req.headers.get('Content-Type') ?? 'text/plain' })
      );

      return currentBlobUrl;
    }

    /* ================= KHỞI TẠO PLAYER ================= */

    const initPlayer = async (episode) => {
      await nextTick();
      const video = videoRef.value;
      if (!video || !episode.link_m3u8) return;

      destroyHls();

      // Xử lý playlist trước khi phát
      const finalUrl = await fetchAndProcessPlaylist(episode.link_m3u8);

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(finalUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Error:', data);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = finalUrl;
      }
    }

    watch(() => props.selectedEpisode, (newEpisode) => {
      if (newEpisode) initPlayer(newEpisode);
      else destroyHls();
    }, { immediate: true });

    onBeforeUnmount(() => destroyHls());

    return { videoRef }
  }
}
</script>

<style scoped>
/* Giữ nguyên style cũ của bạn */
.video-player { background: #000; border-radius: 10px; overflow: hidden; }
.player-container { position: relative; padding-top: 56.25%; }
.video-element { position: absolute; inset: 0; width: 100%; height: 100%; background: #000; }
.player-info { padding: 15px; background: #1a1a1a; border-top: 1px solid #333; }
.no-episode { display: flex; align-items: center; justify-content: center; min-height: 400px; color: #666; }
</style>
