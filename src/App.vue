<script setup>
import Footer from './components/Footer.vue'
import AppHeader from './components/AppHeader.vue'
import TopHeader from './components/TopHeader.vue'
</script>

<template>
  <div>
    <AppHeader />
    <TopHeader />
    <div class="pt-14"> <!-- ensure content not behind top header -->
      <router-view />
    </div>
    <Footer />
  </div>
</template>
