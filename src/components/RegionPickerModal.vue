<script setup>
import { ref, watch } from 'vue'
import { citiesByProvince, provinces } from '../lib/regions'

const emit = defineEmits(['close', 'select'])

const selectedProvince = ref(null)

function selectProvince(province) {
  selectedProvince.value = province
}

function selectCity(city) {
  emit('select', `${selectedProvince.value} ${city}`)
  selectedProvince.value = null
}

function close() {
  selectedProvince.value = null
  emit('close')
}

watch(selectedProvince, (value) => {
  if (value && !citiesByProvince[value]) {
    selectedProvince.value = null
  }
})
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 overflow-hidden">
      <template v-if="!selectedProvince">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">지역 선택</h2>
        </div>
        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="province in provinces"
              :key="province"
              type="button"
              @click="selectProvince(province)"
              class="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand hover:text-white hover:border-brand transition-colors"
            >
              {{ province }}
            </button>
          </div>
        </div>
        <div class="p-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </template>

      <template v-else>
        <div class="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">{{ selectedProvince }} 선택</h2>
          <button
            type="button"
            @click="selectedProvince = null"
            class="text-2xl leading-none text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
            aria-label="이전"
          >
            ‹
          </button>
        </div>
        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="city in citiesByProvince[selectedProvince]"
              :key="city"
              type="button"
              @click="selectCity(city)"
              class="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand hover:text-white hover:border-brand transition-colors"
            >
              {{ city }}
            </button>
          </div>
        </div>
        <div class="p-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            @click="selectedProvince = null"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            이전
          </button>
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
