import { createStore } from 'vuex'

export default createStore({
  state: {
    searchQuery: '',
    currentMovie: null,
    watchHistory: [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || []
  },
  mutations: {
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query
    },
    SET_CURRENT_MOVIE(state, movie) {
      state.currentMovie = movie
    },
    ADD_TO_HISTORY(state, item) {
      const existing = state.watchHistory.find(i => i.id === item.id)
      if (!existing) {
        state.watchHistory.unshift(item)
        if (state.watchHistory.length > 50) {
          state.watchHistory.pop()
        }
      }
    },
    TOGGLE_FAVORITE(state, movie) {
      const index = state.favorites.findIndex(f => f.id === movie.id)
      if (index === -1) {
        state.favorites.push(movie)
      } else {
        state.favorites.splice(index, 1)
      }
      localStorage.setItem('favorites', JSON.stringify(state.favorites))
    }
  },
  actions: {
    updateSearchQuery({ commit }, query) {
      commit('SET_SEARCH_QUERY', query)
    },
    addToHistory({ commit }, item) {
      commit('ADD_TO_HISTORY', item)
    },
    toggleFavorite({ commit }, movie) {
      commit('TOGGLE_FAVORITE', movie)
    }
  },
  getters: {
    isFavorite: state => movie => {
      return state.favorites.some(f => f.id === movie.id)
    }
  }
})
