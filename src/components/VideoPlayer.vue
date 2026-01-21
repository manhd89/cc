<template>
  <div class="video-player">
    <div v-if="!selectedEpisode" class="no-episode">
      <p>Chọn tập phim để xem</p>
    </div>
    <div v-else class="player-container">
      <div class="player-wrapper">
        <!-- Sử dụng iframe cho link_embed -->
        <iframe
          v-if="selectedEpisode.link_embed"
          :src="selectedEpisode.link_embed"
          frameborder="0"
          allowfullscreen
          class="video-iframe"
        ></iframe>
        <!-- Hoặc sử dụng video element cho M3U8 -->
        <video
          v-else-if="selectedEpisode.link_m3u8"
          :src="selectedEpisode.link_m3u8"
          controls
          class="video-element"
        ></video>
        <div v-else class="no-stream">
          <p>Không có nguồn phát cho tập này</p>
        </div>
      </div>
      <div class="player-info">
        <h3>{{ selectedEpisode.name }}</h3>
        <p>Server: {{ selectedEpisode.server }} ({{ selectedEpisode.source }})</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VideoPlayer',
  props: {
    selectedEpisode: {
      type: Object,
      default: null
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

.no-episode, .no-stream {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
  font-size: 1.2rem;
}

.player-container {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.video-iframe, .video-element {
  position: absolute;
  top: 0;
  left: 0;
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
  margin: 0 0 5px 0;
  color: white;
  font-size: 1.1rem;
}

.player-info p {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
}
</style>
