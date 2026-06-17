<script setup>
defineProps({
  active: { type: String, default: '' },
})

const tabs = [
  { label: '대시보드', to: '/' },
  { label: '병해충 분석', to: '/pest-analysis' },
  { label: '지원사업', to: '/support-programs' },
]
</script>

<template>
  <nav class="bg-white border-b border-gray-200">
    <div class="max-w-shell mx-auto px-5 flex gap-1 overflow-x-auto">
      <router-link
        v-for="tab in tabs"
        :key="tab.label"
        :to="tab.to"
        class="px-[1.1rem] py-3.5 text-sm whitespace-nowrap border-b-2 no-underline"
        :class="
          active === tab.label
            ? 'text-brand font-bold border-brand'
            : 'text-gray-500 font-normal border-transparent'
        "
      >
        {{ tab.label }}
      </router-link>
    </div>
  </nav>
</template>
