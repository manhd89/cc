import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/movie/:id',
    name: 'MovieDetail',
    component: () => import('../views/MovieDetailPage.vue'),
    props: true
  },
  {
    path: '/tv/:id',
    name: 'TVDetail',
    component: () => import('../views/MovieDetailPage.vue'),
    props: true
  },
  {
    path: '/watch/:type/:id',
    name: 'Watch',
    component: () => import('../views/WatchMovie.vue'),
    props: true
  },
  {
    path: '/watch/:type/:id/:episode',
    name: 'WatchEpisode',
    component: () => import('../views/WatchMovie.vue'),
    props: true
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchResults.vue')
  },
  {
    path: '/genre/:type/:id',
    name: 'Genre',
    component: () => import('../views/SearchResults.vue'),
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

export default router
