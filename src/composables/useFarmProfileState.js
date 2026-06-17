import { computed, ref } from 'vue'

const LOCATION_STORAGE_KEY = 'fd_location'
const DEFAULT_LOCATION = 'Location not set'

const farmLocation = ref(localStorage.getItem(LOCATION_STORAGE_KEY) || DEFAULT_LOCATION)

function setFarmLocation(location) {
  const nextLocation = location?.trim() || DEFAULT_LOCATION
  farmLocation.value = nextLocation
  localStorage.setItem(LOCATION_STORAGE_KEY, nextLocation)
}

function clearFarmLocation() {
  farmLocation.value = DEFAULT_LOCATION
  localStorage.removeItem(LOCATION_STORAGE_KEY)
}

export function useFarmProfileState() {
  return {
    farmLocation,
    hasFarmLocation: computed(() => farmLocation.value !== DEFAULT_LOCATION),
    setFarmLocation,
    clearFarmLocation,
  }
}