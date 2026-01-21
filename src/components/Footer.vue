<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>MovieHub</h3>
          <p>Website xem phim trực tuyến chất lượng cao với nội dung phong phú và cập nhật mới nhất.</p>
        </div>
        
        <div class="footer-section">
          <h4>Thể loại</h4>
          <router-link to="/genre/movie/28" class="footer-link">Hành động</router-link>
          <router-link to="/genre/movie/35" class="footer-link">Hài</router-link>
          <router-link to="/genre/movie/18" class="footer-link">Drama</router-link>
          <router-link to="/genre/movie/27" class="footer-link">Kinh dị</router-link>
          <router-link to="/genre/movie/878" class="footer-link">Khoa học viễn tưởng</router-link>
        </div>
        
        <div class="footer-section">
          <h4>Điều hướng</h4>
          <router-link to="/" class="footer-link">Trang chủ</router-link>
          <router-link to="/genre/movie/28" class="footer-link">Phim mới</router-link>
          <router-link to="/genre/tv/10765" class="footer-link">TV Shows</router-link>
          <router-link to="/search" class="footer-link">Tìm kiếm</router-link>
        </div>
        
        <div class="footer-section">
          <h4>Thông tin</h4>
          <p class="footer-text">Dữ liệu phim được cung cấp bởi TMDB API</p>
          <p class="footer-text">Streaming từ PhimAPI và OPhim</p>
          <p class="footer-text">Website chỉ với mục đích học tập</p>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>© 2024 MovieHub. All rights reserved.</p>
        <div class="footer-links">
          <a href="#" class="footer-bottom-link">Điều khoản</a>
          <a href="#" class="footer-bottom-link">Chính sách</a>
          <a href="#" class="footer-bottom-link">Liên hệ</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background: #0a0a0a;
  border-top: 1px solid #333;
  margin-top: auto;
  padding: 40px 0 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h3 {
  color: #e50914;
  font-size: 1.5rem;
  margin: 0 0 20px 0;
}

.footer-section h4 {
  color: white;
  font-size: 1.2rem;
  margin: 0 0 15px 0;
}

.footer-section p {
  color: #aaa;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.footer-link {
  display: block;
  color: #aaa;
  text-decoration: none;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #e50914;
}

.footer-text {
  color: #777;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.footer-bottom {
  border-top: 1px solid #333;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-bottom p {
  color: #777;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-bottom-link {
  color: #aaa;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.footer-bottom-link:hover {
  color: #e50914;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
