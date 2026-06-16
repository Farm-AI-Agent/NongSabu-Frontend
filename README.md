# 작물닥터 농사부 🌿

농업 병해충 진단 AI 비서 — **Vue 3 + Tailwind CSS** 프론트엔드 애플리케이션.

## 소개

스마트팜 시대에 농사를 돕는 AI 기반 병해충 진단 서비스입니다. 사진 업로드로 즉시 병해충을 진단하고, 농장 정보를 관리하며, AI와 상담할 수 있습니다.

## 주요 기능

### 🔍 병해충 진단 (`/pest-analysis`)
- **드래그 앤 드롭 업로드**: 파일 입력 또는 사진을 드래그해서 업로드
- **AI 진단 결과 분석**: 예상 병명, 발병 확률 표시
- **탭 인터페이스**:
  - 첫 번째 행: 진단된 병명 탭 (흰가루병, 갈색무늬병 등)
  - 두 번째 행: 정보 탭 (발병원인, 발병 정보, 방제 정보)
  - 선택한 병명과 정보 타입에 따른 동적 콘텐츠 표시

### 👨‍🌾 프로필 관리 (`/mypage`)
- **프로필 수정** (페이지 기반, 모달 없음):
  - 이름: 읽기 전용 필드
  - 이메일: 편집 가능
  - 지역: 도/시 dropdown 선택 (앱헤더와 동일한 UX)
  - 농장명: 자유 입력
  - 재배작물: 다중선택 그리드 (15개 작물)
  - 농장규모: 숫자 입력 후 자동 포맷 ("660" → "시설 660㎡ (200평)")
- **localStorage 자동 저장**: 새로고침해도 데이터 유지
- **대시보드 반영**: 선택한 작물이 대시보드 "재배 작물" 카드에 실시간 반영

### 📊 대시보드 (`/`)
- **농장 현황 카드**:
  - 재배 작물: 선택 개수 + 작물명 목록 (MyPage에서 선택한 데이터 반영)
  - 시세 동향: 상승/하락 추세
- **할 일 관리**: 오늘의 농장 작업 체크리스트
- **지원사업 추천**: 지역별 농업 지원 정보
- **모바일 반응형**: 자동 레이아웃 조정

### 💬 AI 상담 (`/chat`)
- 실시간 채팅 인터페이스
- 농사 관련 질문에 대한 AI 답변

### 🌍 지역 설정
- **AppHeader**의 위치 선택 모달
- 17개 도 + 각 시/군 정보
- 선택 후 자동 저장 (localStorage)
- 앱 전역에서 사용 가능

### 📋 할 일 관리
- 제목 + 설명으로 할 일 추가
- 체크박스로 완료/미완료 토글
- 수정/삭제 기능
- localStorage 자동 저장

## 빠른 시작

### 설치
```bash
cd vue-export
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:5173 에서 앱 실행

### 프로덕션 빌드
```bash
npm run build      # dist/ 폴더에 빌드
npm run preview    # 빌드된 앱 미리보기
```

> Node 18+ 권장.

## 프로젝트 구조

```
src/
├── main.js                     # 앱 진입점
├── App.vue                     # <router-view> 루트
├── style.css                   # Tailwind + 전역 스타일
├── router/
│   └── index.js               # vue-router 설정
├── composables/
│   └── useAuth.js             # 로그인 상태 관리 (localStorage)
├── components/
│   ├── AppHeader.vue          # 상단 네비게이션 바
│   │   ├── 지역 선택 modal
│   │   ├── 로그인 여부 표시
│   │   └── 유저 메뉴
│   ├── NavTabs.vue            # 가로 네비게이션 탭 (대시보드/진단/채팅)
│   ├── FloatingChatButton.vue # 우하단 채팅 진입 버튼
│   ├── MetricCardGrid.vue     # 대시보드 지표 카드 (localStorage 기반 동적)
│   ├── RecommendedProgramsCard.vue  # 지원사업 정보
│   ├── ChecklistCard.vue      # 할 일 목록 + 추가/수정/삭제 모달
│   └── ImageUploadCard.vue    # 사진 업로드 (미사용)
└── views/                     # 5개 페이지
    ├── Dashboard.vue          # 대시보드
    ├── PestAnalysis.vue       # 병해충 진단
    ├── MyPage.vue             # 마이페이지 (프로필 관리)
    ├── Chat.vue               # AI 상담
    ├── Login.vue              # 로그인/회원가입
    └── SupportPrograms.vue    # 지원사업 (미사용)
```

## 데이터 저장소 (localStorage)

앱은 다음 데이터를 localStorage에 저장합니다:

| 키 | 내용 | 저장 위치 |
|-----|------|----------|
| `fd_auth` | 로그인 여부 + 사용자명 | useAuth.js |
| `fd_location` | 선택한 지역 (예: "전북 김제") | AppHeader.vue |
| `fd_profile` | 프로필 정보 (이메일, 농장명, 재배작물, 농장규모) | MyPage.vue |
| `fd_checklist` | 할 일 목록 | ChecklistCard.vue |

## 디자인 시스템

### 색상 팔레트 (tailwind.config.js)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `brand` | `#0e6e5d` | 로고, 주 강조색 (진한 초록) |
| `brand-light` | `#eef6f3` | 배경색 (연한 초록) |
| `brand-border` | `#cfe6df` | 테두리색 |
| `accent` | `#2b6cb0` | 액션 버튼 (파랑) |
| `page` | `#f6f7f8` | 페이지 배경 |
| `success` | `#1a7d4b` | 성공 상태 |
| `warn` | `#b45309` | 경고 상태 |

### 타이포그래피
- 폰트: **Noto Sans KR** (400/500/700) — Google Fonts 로드
- 배경: #f6f7f8 (라이트 그레이)

### 컴포넌트 스타일
- 카드: 흰색 배경, 1px `gray-200` 테두리, 10px 라운드
- 버튼: 16px 라운드, 전환 효과
- 모달: 반투명 검은 배경 (50%), z-50
- 최소화된 그림자, 클린 플랫 디자인

## 상태 관리

### 인증 (useAuth.js)
```javascript
const { loggedIn, userName, login, logout } = useAuth()
```
- **localStorage 기반**: `fd_auth` 키에 저장
- 로그인 시 사용자명 저장
- 로그아웃 시 헤더 UI 변경

### 페이지 상태 (각 vue 파일)
- ref() 사용한 로컬 상태 관리
- computed() 사용한 파생 상태
- onMounted() 사용해 localStorage 로드

## 주요 구현 디테일

### 병해충 진단 (PestAnalysis.vue)

**파일 업로드 처리**:
```javascript
// 드래그 앤 드롭 + 파일 입력 지원
const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target?.result // Base64 data URL
    showResult.value = true
  }
  reader.readAsDataURL(file)
}
```

**진단 결과 탭 인터페이스**:
- 첫 번째 탭: 병명 선택 (selectedDiseaseTab)
- 두 번째 탭: 정보 유형 선택 (selectedInfoTab)
- 조건부 렌더링으로 콘텐츠 표시

### 프로필 관리 (MyPage.vue)

**상태 전환**:
```javascript
const isEditMode = ref(false)  // 보기 모드 ↔ 편집 모드
```

**농장규모 자동 포맷**:
```javascript
// "660" → "시설 660㎡ (200평)"
const formatFarmSize = (sqm) => {
  const pyeong = Math.round(sqm / 3.3)
  return `시설 ${sqm}㎡ (${pyeong}평)`
}
```

**지역 선택** (dropdown):
- 17개 도 배열
- 각 도별 시/군 nested object
- 선택 시 "도 시" 형식으로 저장

**재배작물 선택** (다중선택):
```javascript
const selectedCrops = ref([])  // 배열로 ID 저장
const toggleCrop = (cropId) => {
  const idx = selectedCrops.value.indexOf(cropId)
  idx > -1 
    ? selectedCrops.value.splice(idx, 1)
    : selectedCrops.value.push(cropId)
}
```

### 대시보드 연동 (MetricCardGrid.vue)

**동적 데이터**:
```javascript
const metrics = computed(() => {
  const cropNames = selectedCrops.value
    .map(id => crops.find(c => c.id === id)?.name)
    .join(' · ')
  
  return [{
    label: '재배 작물',
    number: `${selectedCrops.value.length}종`,
    sub: cropNames
  }, ...]
})

onMounted(() => {
  const profile = JSON.parse(localStorage.getItem('fd_profile'))
  selectedCrops.value = profile?.selectedCrops || []
})
```

## 향후 구현 계획

- [ ] 병해충 진단 API 연동 (실제 AI 모델)
- [ ] 회원 데이터 백엔드 저장 (현재는 localStorage만)
- [ ] 지원사업 / 시세 API 연결 (KAMIS 등)
- [ ] 사진 크롭/필터링 UI
- [ ] 모바일 햄버거 메뉴 (NavTabs 반응형 개선)
- [ ] 폼 유효성 검사 + 에러 처리 강화
- [ ] 알림 기능 (할 일 상기 등)
- [ ] 다국어 지원

## 기술 스택

| 항목 | 버전 | 용도 |
|------|------|------|
| Vue | 3.4.21+ | 프론트엔드 프레임워크 |
| Vue Router | 4.3.0+ | 라우팅 |
| Vite | 5.2.8+ | 번들러 |
| Tailwind CSS | 3.4.3+ | 스타일링 |
| Node.js | 18+ | 런타임 |

## 개발 가이드

### 컴포넌트 추가
```
src/components/MyComponent.vue
```
→ App.vue 또는 특정 뷰에서 import

### 새 페이지 추가
```
src/views/NewPage.vue
```
→ router/index.js에 라우트 등록

### Tailwind 커스텀
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#0e6e5d',
        // ...
      }
    }
  }
}
```

## 팀 정보

**제작**: 농업 AI 비서팀  
**버전**: 1.0.0  
**라이센스**: Private

---

**마지막 업데이트**: 2026-06-16
