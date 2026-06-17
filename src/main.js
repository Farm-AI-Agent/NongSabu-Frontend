import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'
import './style.css'

async function bootstrap() {
  const { initializeAuth } = useAuth()

  await initializeAuth().catch(() => null)

  createApp(App).use(router).mount('#app')
}

bootstrap()
