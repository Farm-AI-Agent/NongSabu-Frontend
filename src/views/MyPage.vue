<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner farmer' },
  { value: 'INTERMEDIATE', label: 'Experienced farmer' },
  { value: 'ADVANCED', label: 'Advanced farmer' },
]

const router = useRouter()
const { accessToken, fetchMyProfile, logout } = useAuth()
const { setFarmLocation, clearFarmLocation } = useFarmProfileState()

const isEditMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const crops = ref([])
const persistedUserCrops = ref([])

const profile = reactive({
  name: '',
  email: '',
  region: '',
  farmName: '',
  farmSize: '',
  experienceLevel: 'BEGINNER',
  selectedCropIds: [],
  mainCropId: null,
  joinDate: '',
})

const selectedCropNames = computed(() => {
  if (!profile.selectedCropIds.length) {
    return 'No crops selected'
  }

  return profile.selectedCropIds
    .map((cropId) => crops.value.find((item) => item.id === cropId)?.name)
    .filter(Boolean)
    .join(', ')
})

const experienceLabel = computed(
  () => EXPERIENCE_OPTIONS.find((option) => option.value === profile.experienceLevel)?.label || 'Not set',
)

const farmInfo = computed(() => [
  { label: 'Farm name', value: profile.farmName || 'Not set' },
  { label: 'Region', value: profile.region || 'Not set' },
  { label: 'Main crops', value: selectedCropNames.value },
  { label: 'Experience', value: experienceLabel.value },
  { label: 'Farm size', value: profile.farmSize || 'Not set' },
  { label: 'Joined', value: profile.joinDate || 'Not set' },
])

function getToken() {
  if (!accessToken.value) {
    throw new ApiError('Authentication token is missing.')
  }
  return accessToken.value
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

async function requestOrNull(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

function applyLoadedData({ member, farm, farmProfile, userCrops: userCropList, cropList }) {
  crops.value = cropList
  persistedUserCrops.value = userCropList

  const selectedCropIds = userCropList.length
    ? userCropList.map((item) => item.cropId)
    : farmProfile?.mainCropId
      ? [farmProfile.mainCropId]
      : []

  profile.name = member.name
  profile.email = member.email
  profile.region = farmProfile?.region || farm?.location || ''
  profile.farmName = farm?.name || ''
  profile.farmSize = farmProfile?.farmSize || farm?.cultivationArea || ''
  profile.experienceLevel = farmProfile?.experienceLevel || 'BEGINNER'
  profile.selectedCropIds = selectedCropIds
  profile.mainCropId = farmProfile?.mainCropId || selectedCropIds[0] || null
  profile.joinDate = formatDate(member.createdAt)

  setFarmLocation(profile.region)
}

async function loadProfile() {
  resetMessages()
  isLoading.value = true

  try {
    const token = getToken()
    const member = await fetchMyProfile(token)
    const [farm, farmProfile, userCropList, cropList] = await Promise.all([
      requestOrNull('/api/v1/farms/me', { token }),
      requestOrNull('/api/v1/farm-profiles/me', { token }),
      apiRequest('/api/v1/user-crops/me', { token }),
      apiRequest('/api/v1/crops', { token }),
    ])

    applyLoadedData({ member, farm, farmProfile, userCrops: userCropList, cropList })
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load farm profile.'
  } finally {
    isLoading.value = false
  }
}

function startEdit() {
  resetMessages()
  isEditMode.value = true
}

async function syncUserCrops(token) {
  const currentByCropId = new Map(persistedUserCrops.value.map((item) => [item.cropId, item]))
  const selectedCropSet = new Set(profile.selectedCropIds)

  const deleteTargets = persistedUserCrops.value.filter((item) => !selectedCropSet.has(item.cropId))
  const createTargets = profile.selectedCropIds.filter((cropId) => !currentByCropId.has(cropId))

  await Promise.all(
    deleteTargets.map((item) =>
      apiRequest(`/api/v1/user-crops/${item.id}`, {
        method: 'DELETE',
        token,
      }),
    ),
  )

  for (const cropId of createTargets) {
    await apiRequest('/api/v1/user-crops', {
      method: 'POST',
      token,
      body: {
        cropId,
        cultivationArea: profile.farmSize,
        memo: '',
      },
    })
  }
}

async function saveProfile() {
  resetMessages()

  if (!profile.region.trim()) {
    errorMessage.value = 'Enter a region.'
    return
  }

  if (!profile.farmName.trim()) {
    errorMessage.value = 'Enter a farm name.'
    return
  }

  if (!profile.farmSize.trim()) {
    errorMessage.value = 'Enter a farm size.'
    return
  }

  if (!profile.selectedCropIds.length) {
    errorMessage.value = 'Select at least one crop.'
    return
  }

  if (!profile.mainCropId || !profile.selectedCropIds.includes(profile.mainCropId)) {
    profile.mainCropId = profile.selectedCropIds[0]
  }

  isSaving.value = true

  try {
    const token = getToken()

    await apiRequest('/api/v1/farms/me', {
      method: 'PUT',
      token,
      body: {
        name: profile.farmName,
        location: profile.region,
        cultivationArea: profile.farmSize,
        notes: '',
      },
    })

    const farmProfilePayload = {
      region: profile.region,
      experienceLevel: profile.experienceLevel,
      farmSize: profile.farmSize,
      mainCropId: profile.mainCropId,
    }

    try {
      await apiRequest('/api/v1/farm-profiles/me', {
        method: 'PUT',
        token,
        body: farmProfilePayload,
      })
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error
      }

      await apiRequest('/api/v1/farm-profiles/me', {
        method: 'POST',
        token,
        body: farmProfilePayload,
      })
    }

    await syncUserCrops(token)
    await loadProfile()

    isEditMode.value = false
    successMessage.value = 'Farm profile saved.'
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to save farm profile.'
  } finally {
    isSaving.value = false
  }
}

function cancelEdit() {
  isEditMode.value = false
  loadProfile()
}

function toggleCrop(cropId) {
  if (profile.selectedCropIds.includes(cropId)) {
    profile.selectedCropIds = profile.selectedCropIds.filter((id) => id !== cropId)
    if (profile.mainCropId === cropId) {
      profile.mainCropId = profile.selectedCropIds[0] || null
    }
    return
  }

  profile.selectedCropIds = [...profile.selectedCropIds, cropId]
  if (!profile.mainCropId) {
    profile.mainCropId = cropId
  }
}

function onLogout() {
  clearFarmLocation()
  logout()
  router.push('/')
}

function handleMenuClick(item) {
  if (item === 'Favorite programs') {
    router.push('/favorites')
    return
  }

  if (item === 'Diagnosis history') {
    router.push('/diagnosis-history')
  }
}

const menuItems = ['Notification settings', 'Diagnosis history', 'Favorite programs', 'Support and contact', 'Terms and policies']

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />

    <div class="px-5 py-7 max-w-shell mx-auto" style="max-width: 760px">
      <div v-if="isLoading" class="bg-white border border-gray-200 rounded-xl p-7 text-sm text-gray-500">
        Loading farm profile...
      </div>

      <template v-else>
        <div class="mb-6">
          <div class="text-[26px] font-bold text-gray-900 tracking-tight">
            {{ isEditMode ? 'Edit farm profile' : 'My page' }}
          </div>
        </div>

        <div v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ successMessage }}
        </div>

        <template v-if="!isEditMode">
          <div class="bg-white border border-gray-200 rounded-xl p-7 mb-5 flex items-center gap-5 flex-wrap">
            <div class="w-[72px] h-[72px] bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-bold text-[28px] flex-shrink-0">
              {{ profile.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-[180px]">
              <div class="text-xl font-bold text-gray-900 mb-1">{{ profile.name }}</div>
              <div class="text-[13px] text-gray-400">{{ profile.email }} · {{ profile.region || 'Region not set' }}</div>
            </div>
            <button
              @click="startEdit"
              class="px-[1.1rem] py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Edit profile
            </button>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-[1.25rem_1.5rem] mb-5">
            <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center gap-2">
              <div class="w-1 h-4 bg-brand rounded-sm"></div>
              Farm information
            </div>
            <div
              v-for="(row, i) in farmInfo"
              :key="row.label"
              class="flex justify-between py-3 gap-6"
              :class="i > 0 ? 'border-t border-gray-100' : ''"
            >
              <div class="text-sm text-gray-500">{{ row.label }}</div>
              <div class="text-sm text-gray-900 font-medium text-right">{{ row.value }}</div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="bg-white border border-gray-200 rounded-xl p-7 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">Name</label>
              <input
                :value="profile.name"
                type="text"
                disabled
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">Email</label>
              <input
                :value="profile.email"
                type="email"
                disabled
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">Farm name</label>
              <input
                v-model="profile.farmName"
                type="text"
                placeholder="Enter farm name"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">Region</label>
              <input
                v-model="profile.region"
                type="text"
                placeholder="Example: Jeonbuk Gimje"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">Experience</label>
              <select
                v-model="profile.experienceLevel"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option v-for="option in EXPERIENCE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">Farm size</label>
              <input
                v-model="profile.farmSize"
                type="text"
                placeholder="Example: 660 sqm"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <div class="flex items-center justify-between gap-3 mb-3">
                <label class="block text-sm font-medium text-gray-900">Cultivated crops</label>
                <span class="text-xs text-gray-400">The selected main crop is also used for the farm profile.</span>
              </div>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <button
                  v-for="crop in crops"
                  :key="crop.id"
                  type="button"
                  @click="toggleCrop(crop.id)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border-2"
                  :class="profile.selectedCropIds.includes(crop.id) ? 'bg-brand/10 border-brand' : 'border-gray-200 hover:border-gray-300'"
                >
                  <div class="text-sm font-semibold text-gray-700 text-center leading-tight">{{ crop.name }}</div>
                  <div
                    v-if="profile.mainCropId === crop.id"
                    class="text-[11px] px-2 py-1 rounded-full bg-brand text-white"
                  >
                    Main crop
                  </div>
                </button>
              </div>
            </div>

            <div v-if="profile.selectedCropIds.length">
              <label class="block text-sm font-medium text-gray-900 mb-2">Primary crop</label>
              <select
                v-model.number="profile.mainCropId"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option v-for="cropId in profile.selectedCropIds" :key="cropId" :value="cropId">
                  {{ crops.find((item) => item.id === cropId)?.name || cropId }}
                </option>
              </select>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                @click="cancelEdit"
                class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="saveProfile"
                class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-60"
                :disabled="isSaving"
              >
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </template>

        <template v-if="!isEditMode">
          <div class="bg-white border border-gray-200 rounded-xl py-2 mb-5">
            <div
              v-for="(item, i) in menuItems"
              :key="item"
              class="flex justify-between items-center px-6 py-4 cursor-pointer"
              :class="i > 0 ? 'border-t border-gray-100' : ''"
              @click="handleMenuClick(item)"
            >
              <div class="text-sm text-gray-900">{{ item }}</div>
              <div class="text-base text-slate-300">></div>
            </div>
          </div>

          <button
            class="w-full py-3.5 bg-white border border-gray-200 rounded-[10px] text-sm text-red-600 font-medium"
            @click="onLogout"
          >
            Logout
          </button>
        </template>
      </template>
    </div>
  </div>
</template>