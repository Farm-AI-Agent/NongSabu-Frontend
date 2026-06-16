import { ref } from 'vue'

/**
 * 로그인 상태를 localStorage에 보존하는 간단한 전역 인증 스토어.
 * (실제 서비스에서는 Pinia + 백엔드 세션으로 교체하세요.)
 */
const loggedIn = ref(localStorage.getItem('fd_loggedIn') !== 'false')
const userName = ref(localStorage.getItem('fd_userName') || '정혜영')

export function useAuth() {
  function login(name) {
    if (name) {
      userName.value = name
      localStorage.setItem('fd_userName', name)
    }
    loggedIn.value = true
    localStorage.setItem('fd_loggedIn', 'true')
  }

  function logout() {
    loggedIn.value = false
    localStorage.setItem('fd_loggedIn', 'false')
  }

  return { loggedIn, userName, login, logout }
}
