const analysisTextMap = {
  healthy: '정상',
  normal: '정상',
  completed: '분석이 완료되었습니다.',
  success: '분석이 완료되었습니다.',
  unsupported: '현재 모델에서 지원 준비 중인 작물입니다.',
  failed: '분석에 실패했습니다.',
  processing: '분석 중입니다.',
  pending: '분석 대기 중입니다.',
  dummy: '분석 결과를 확인했습니다.',
  mock: '분석 결과를 확인했습니다.',
  powdery_mildew: '흰가루병',
  downy_mildew: '노균병',
  leaf_spot: '잎반점병',
  black_rot: '검은썩음병',
  anthracnose: '탄저병',
  rust: '녹병',
  blight: '마름병',
  disease_detected: '병해 의심',
  no_disease_detected: '감지된 병해가 없습니다.',
}

function normalizeAnalysisKey(value) {
  return String(value)
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

export function formatAnalysisText(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const text = String(value).trim()

  if (/[가-힣]/.test(text)) {
    return text
  }

  const key = normalizeAnalysisKey(text)

  if (analysisTextMap[key]) {
    return analysisTextMap[key]
  }

  if (key.includes('dummy') || key.includes('mock')) {
    return '분석 결과를 확인했습니다.'
  }

  if (key.includes('complete') || key.includes('success')) {
    return '분석이 완료되었습니다.'
  }

  if (key.includes('unsupported')) {
    return '현재 모델에서 지원 준비 중인 작물입니다.'
  }

  if (key.includes('no_disease') || key.includes('healthy')) {
    return '감지된 병해가 없습니다.'
  }

  return fallback
}
