import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LobbyView from '@/views/LobbyView.vue'
import FillCardView from '@/views/FillCardView.vue'
import GameBoardView from '@/views/GameBoardView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/test',
    name: 'home-test',
    component: HomeView,
    meta: { isTestMode: true }
  },
  {
    path: '/lobby/:roomId',
    name: 'lobby',
    component: LobbyView
  },
  {
    path: '/fill/:roomId',
    name: 'fill',
    component: FillCardView
  },
  {
    path: '/game/:roomId',
    name: 'game',
    component: GameBoardView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
