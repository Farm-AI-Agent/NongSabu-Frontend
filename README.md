# 작물닥터 농사부 🌿

농업 병해충 진단 AI 비서 — **Vue 3 + Tailwind CSS** 프론트엔드.

처음 화면 프로토타입을 실제 개발용 코드로 추출한 패키지입니다.

## 빠른 시작

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

> Node 18+ 권장.

## 페이지 (vue-router)

| 경로 | 화면 | 파일 |
|------|------|------|
| `/` | 대시보드 | `src/views/Dashboard.vue` |
| `/pest-analysis` | AI 병해충 사진진단 | `src/views/PestAnalysis.vue` |
| `/mypage` | 마이페이지 | `src/views/MyPage.vue` |
| `/login` | 로그인 / 회원가입 | `src/views/Login.vue` |
| `/chat` | AI 상담 채팅 | `src/views/Chat.vue` |

## 컴포넌트 구조

```
src/
├── App.vue                     # <router-view> 루트
├── main.js                     # 앱 부트스트랩
├── style.css                   # Tailwind 지시문 + 전역 리셋
├── router/index.js             # 라우트 정의
├── composables/
│   └── useAuth.js              # 로그인 상태 (localStorage 보존)
├── components/
│   ├── AppHeader.vue           # 상단 바 (로그인 여부에 따라 이름/버튼)
│   ├── NavTabs.vue             # 가로 네비게이션 탭
│   ├── FloatingChatButton.vue  # 우하단 채팅 진입 버튼
│   ├── MetricCardGrid.vue      # 대시보드 지표 카드
│   ├── RecommendedProgramsCard.vue
│   ├── ImageUploadCard.vue
│   └── ChecklistCard.vue       # 오늘 할 일 (체크 토글)
└── views/                      # 5개 페이지
```

## 디자인 토큰 (tailwind.config.js)

| 토큰 | 값 | 용도 |
|------|------|------|
| `brand` | `#0e6e5d` | 상단 바, 로고, 기본 강조 |
| `brand-light` | `#eef6f3` | 연한 표면 (아바타·아이콘 배경) |
| `brand-border` | `#cfe6df` | 연한 테두리 |
| `accent` | `#2b6cb0` | 업로드/진단 액션 (블루) |
| `page` | `#f6f7f8` | 페이지 배경 |
| `success` | `#1a7d4b` | 긍정 상태 텍스트 |
| `warn` | `#b45309` | 주의 상태 텍스트 |

- 폰트: **Noto Sans KR** (400/500/700) — `index.html`에서 Google Fonts로 로드
- 카드: 흰색 배경, 1px `gray-200` 테두리, 10~12px 라운드
- 그림자 최소화, 플랫한 클린 SaaS 룩

## 인증 상태에 대해

`useAuth.js`는 데모용으로 `localStorage`에 로그인 여부만 저장합니다.
- 로그인/회원가입 완료 → 로그인 상태로 전환 후 대시보드 이동
- 마이페이지 로그아웃 → 헤더가 로그인/회원가입 버튼으로 전환

실제 서비스에서는 **Pinia + 백엔드 세션/토큰**으로 교체하세요.

## 다음 단계 (TODO)

- [ ] 사진 업로드 실제 연동 (`<input type="file">` + 미리보기)
- [ ] 진단 API 연동 (병해충 분석 결과 화면)
- [ ] 지원사업 / 시세 데이터 API 연결 (KAMIS 등)
- [ ] 모바일 햄버거 메뉴 (현재는 가로 스크롤 탭)
- [ ] 폼 유효성 검사 + 에러 처리
