import { createStore } from 'vuex'

declare let SessionStorage: any;
const USER = "USER";

const store =  createStore({
  state: {
    user: SessionStorage.get(USER) || {}
  },
  mutations: {
    setUser (state,user) {
      state.user = user;
      // 将用户信息存储进缓存中
      SessionStorage.set(USER,user);
    }
  },
  actions: {
  },
  modules: {
  }
})

export default store;