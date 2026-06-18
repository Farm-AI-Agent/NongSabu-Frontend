import {
  detailedFallbackCoordinates,
  findFallbackCoordinates,
  normalizeKoreanLocation,
  regionFallbackCoordinates,
} from './regions'

const conditionMap = {
  0: { text: '맑음', icon: 'sun' },
  1: { text: '구름 조금', icon: 'sun-cloud' },
  2: { text: '구름 많음', icon: 'cloud' },
  3: { text: '흐림', icon: 'cloud' },
  45: { text: '안개', icon: 'fog' },
  48: { text: '안개', icon: 'fog' },
  51: { text: '가벼운 비', icon: 'rain' },
  53: { text: '중간 비', icon: 'rain' },
  55: { text: '강한 비', icon: 'rain' },
  61: { text: '약한 비', icon: 'rain' },
  63: { text: '중간 비', icon: 'rain' },
  65: { text: '강한 비', icon: 'storm' },
  71: { text: '약한 눈', icon: 'snow' },
  73: { text: '중간 눈', icon: 'snow' },
  75: { text: '강한 눈', icon: 'snow' },
  80: { text: '소나기', icon: 'rain' },
  81: { text: '강한 소나기', icon: 'storm' },
  82: { text: '폭우', icon: 'storm' },
  85: { text: '눈 소나기', icon: 'snow' },
  86: { text: '강한 눈 소나기', icon: 'snow' },
  95: { text: '천둥폭우', icon: 'storm' },
}

export function getWeatherCondition(weatherCode) {
  return conditionMap[weatherCode] || { text: '알 수 없음', icon: 'cloud' }
}

async function searchOpenMeteoLocation(query, originalLocation) {
  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'ko',
    format: 'json',
  })
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const results = (data.results || []).filter((place) => place.country_code === 'KR')

  if (!results.length) {
    return null
  }

  const detailToken = normalizeKoreanLocation(originalLocation).split(' ').at(-1)?.replace(/(시|군|구)$/, '')
  const matched = results.find((place) => {
    const haystack = [place.name, place.admin1, place.admin2, place.admin3].filter(Boolean).join(' ')
    return detailToken && haystack.includes(detailToken)
  })

  const place = matched || results[0]
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: [place.admin1, place.admin2 || place.name].filter(Boolean).join(' '),
  }
}

export async function resolveLocationCoordinates(location) {
  const detailedFallback = findFallbackCoordinates(location, detailedFallbackCoordinates)

  if (detailedFallback) {
    return detailedFallback
  }

  const normalizedLocation = normalizeKoreanLocation(location)
  const detailQuery = normalizedLocation.split(' ').at(-1) || normalizedLocation
  const suffixTrimmedLocation = normalizedLocation.replace(/(특별시|광역시|특별자치시|특별자치도|자치도|도)/g, '').trim()
  const suffixTrimmedDetail = detailQuery.replace(/(시|군|구)$/, '')
  const queries = [
    normalizedLocation,
    suffixTrimmedLocation,
    detailQuery,
    suffixTrimmedDetail,
  ].filter(Boolean)

  for (const query of [...new Set(queries)]) {
    const result = await searchOpenMeteoLocation(query, location)

    if (result) {
      return result
    }
  }

  const regionFallback = findFallbackCoordinates(location, regionFallbackCoordinates)

  if (regionFallback) {
    return regionFallback
  }

  throw new Error('지역 좌표를 찾지 못했습니다.')
}

export async function fetchCurrentWeather(location) {
  const coordinates = await resolveLocationCoordinates(location)
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m',
    timezone: 'Asia/Seoul',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

  if (!response.ok) {
    throw new Error('날씨 정보를 불러오지 못했습니다.')
  }

  const data = await response.json()

  if (!data.current) {
    throw new Error('현재 날씨 데이터가 없습니다.')
  }

  const current = data.current
  const condition = getWeatherCondition(current.weather_code)

  return {
    locationName: coordinates.name || location,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    observedAt: current.time,
    temperature: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    rain: current.rain,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    condition: condition.text,
    icon: condition.icon,
  }
}
