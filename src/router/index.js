import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import PestAnalysis from '../views/PestAnalysis.vue'
import MyPage from '../views/MyPage.vue'
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'
import SupportPrograms from '../views/SupportPrograms.vue'
import FavoritePrograms from '../views/FavoritePrograms.vue'
import DiagnosisHistory from '../views/DiagnosisHistory.vue'
import CustomerSupport from '../views/CustomerSupport.vue'
import Terms from '../views/Terms.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/pest-analysis', name: 'pest-analysis', component: PestAnalysis },
  { path: '/support-programs', name: 'support-programs', component: SupportPrograms },
  { path: '/favorites', name: 'favorites', component: FavoritePrograms },
  { path: '/diagnosis-history', name: 'diagnosis-history', component: DiagnosisHistory },
  { path: '/mypage', name: 'mypage', component: MyPage },
  { path: '/support/contact', name: 'support-contact', component: CustomerSupport },
  { path: '/support/terms', name: 'support-terms', component: Terms },
  { path: '/login', name: 'login', component: Login },
  { path: '/chat', name: 'chat', component: Chat },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
