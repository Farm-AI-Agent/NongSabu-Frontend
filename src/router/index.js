import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import PestAnalysis from '../views/PestAnalysis.vue'
import MyPage from '../views/MyPage.vue'
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'
import SupportPrograms from '../views/SupportPrograms.vue'
import FavoritePrograms from '../views/FavoritePrograms.vue'
import DiagnosisHistory from '../views/DiagnosisHistory.vue'
import { useAuth } from '../composables/useAuth'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/pest-analysis', name: 'pest-analysis', component: PestAnalysis, meta: { requiresAuth: true } },
  { path: '/support-programs', name: 'support-programs', component: SupportPrograms, meta: { requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: FavoritePrograms, meta: { requiresAuth: true } },
  { path: '/diagnosis-history', name: 'diagnosis-history', component: DiagnosisHistory, meta: { requiresAuth: true } },
  { path: '/mypage', name: 'mypage', component: MyPage, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
  { path: '/chat', name: 'chat', component: Chat, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { loggedIn } = useAuth()

  if (to.meta.requiresAuth && !loggedIn.value) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && loggedIn.value) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
