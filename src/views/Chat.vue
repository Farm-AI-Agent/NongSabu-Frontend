<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const draft = ref('')
const messages = ref([
  {
    mine: false,
    text: '안녕하세요, 정혜영 님! 작물닥터 AI 비서입니다. 병해충 증상이나 사진 진단 결과에 대해 무엇이든 물어보세요.',
  },
  { mine: true, text: '토마토 잎에 흰색 가루가 생겼어요.' },
  {
    mine: false,
    text: '흰가루병일 가능성이 높습니다. 통풍을 좋게 하고, 초기에는 친환경 황 제제를 사용해 보세요. 사진을 올려주시면 더 정확히 진단해 드릴게요.',
  },
])

const scrollEl = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

function send() {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push({ mine: true, text })
  draft.value = ''
  scrollToBottom()
  setTimeout(() => {
    messages.value.push({
      mine: false,
      text: '문의 주셔서 감사합니다. 증상을 분석 중이에요. 사진을 업로드하시면 더 정밀한 진단이 가능합니다.',
    })
    scrollToBottom()
  }, 700)
}
</script>

<template>
  <div class="h-screen bg-page flex flex-col">
    <div class="h-1 bg-brand flex-shrink-0"></div>

    <!-- Header -->
    <div class="bg-white border-b border-gray-200 flex-shrink-0">
      <div class="max-w-[760px] mx-auto px-5 py-3.5 flex items-center gap-3">
        <button class="text-gray-500 text-xl leading-none" @click="router.push('/')">‹</button>
        <div
          class="w-[34px] h-[34px] bg-brand rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <div class="w-4 h-4 border-2 border-white rounded-[5px]"></div>
        </div>
        <div>
          <div class="font-bold text-gray-900 text-[15px]">작물닥터 상담</div>
          <div class="text-xs text-success flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-success rounded-full inline-block"></span>
            AI 비서 · 응답 대기 중
          </div>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div ref="scrollEl" class="flex-1 overflow-y-auto">
      <div class="max-w-[760px] mx-auto px-5 py-6 flex flex-col gap-4">
        <div class="text-center text-xs text-gray-400 mb-2">오늘</div>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="flex"
          :class="msg.mine ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[75%] px-4 py-3 text-sm leading-relaxed rounded-2xl"
            :class="
              msg.mine
                ? 'bg-brand text-white rounded-br-[4px]'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-[4px]'
            "
          >
            {{ msg.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- Input bar -->
    <div class="bg-white border-t border-gray-200 flex-shrink-0">
      <div class="max-w-[760px] mx-auto px-5 py-3.5 flex gap-2.5 items-center">
        <input
          v-model="draft"
          placeholder="병해충 증상이나 궁금한 점을 입력하세요"
          class="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm outline-none focus:border-brand"
          @keydown.enter="send"
        />
        <button
          class="w-11 h-11 flex-shrink-0 bg-brand rounded-full text-white text-lg flex items-center justify-center"
          @click="send"
        >
          ↑
        </button>
      </div>
    </div>
  </div>
</template>
