export const provinces = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
]

export const citiesByProvince = {
  서울: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구', '양천구'],
  부산: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구'],
  대구: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구'],
  인천: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구'],
  광주: ['동구', '서구', '남구', '북구', '광산구'],
  대전: ['대전'],
  울산: ['중구', '남구', '동구', '북구', '울주군'],
  경기: ['수원', '성남', '의정부', '안양', '부천', '광명', '평택', '동두천', '안산', '고양', '과천', '구리', '남양주', '오산', '시흥', '군포', '의왕', '하남', '여주', '이천', '광주', '양주', '포천', '김포', '화성', '용인'],
  강원: ['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'],
  충북: ['청주', '충주', '제천', '음성', '영동', '진천', '괴산', '증평', '단양'],
  충남: ['천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '예산', '태안'],
  전북: ['전주', '군산', '익산', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
  전남: ['목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '완도', '진도', '신안'],
  경북: ['포항', '경주', '김천', '안동', '구미', '영천', '영주', '상주', '문경', '예천', '봉화', '울진', '울릉'],
  경남: ['창원', '마산', '진해', '통영', '사천', '김해', '밀양', '거제', '남해', '하동', '산청', '함양', '거창', '합천'],
  제주: ['제주시', '서귀포시'],
}

export const detailedFallbackCoordinates = [
  { keyword: '서울 강남구', latitude: 37.5172, longitude: 127.0473, name: '서울 강남구' },
  { keyword: '서울 강동구', latitude: 37.5301, longitude: 127.1238, name: '서울 강동구' },
  { keyword: '서울 강북구', latitude: 37.6396, longitude: 127.0257, name: '서울 강북구' },
  { keyword: '서울 강서구', latitude: 37.5509, longitude: 126.8495, name: '서울 강서구' },
  { keyword: '서울 관악구', latitude: 37.4784, longitude: 126.9516, name: '서울 관악구' },
  { keyword: '서울 광진구', latitude: 37.5384, longitude: 127.0823, name: '서울 광진구' },
  { keyword: '서울 구로구', latitude: 37.4955, longitude: 126.8877, name: '서울 구로구' },
  { keyword: '서울 금천구', latitude: 37.4569, longitude: 126.8958, name: '서울 금천구' },
  { keyword: '서울 노원구', latitude: 37.6542, longitude: 127.0568, name: '서울 노원구' },
  { keyword: '서울 도봉구', latitude: 37.6688, longitude: 127.0471, name: '서울 도봉구' },
  { keyword: '서울 동대문구', latitude: 37.5744, longitude: 127.0396, name: '서울 동대문구' },
  { keyword: '서울 동작구', latitude: 37.5124, longitude: 126.9393, name: '서울 동작구' },
  { keyword: '서울 마포구', latitude: 37.5663, longitude: 126.9016, name: '서울 마포구' },
  { keyword: '서울 서대문구', latitude: 37.5791, longitude: 126.9368, name: '서울 서대문구' },
  { keyword: '서울 서초구', latitude: 37.4837, longitude: 127.0324, name: '서울 서초구' },
  { keyword: '서울 성동구', latitude: 37.5633, longitude: 127.0369, name: '서울 성동구' },
  { keyword: '서울 성북구', latitude: 37.5894, longitude: 127.0167, name: '서울 성북구' },
  { keyword: '서울 송파구', latitude: 37.5145, longitude: 127.1059, name: '서울 송파구' },
  { keyword: '서울 양천구', latitude: 37.5169, longitude: 126.8664, name: '서울 양천구' },
  { keyword: '서울 영등포구', latitude: 37.5264, longitude: 126.8962, name: '서울 영등포구' },
  { keyword: '서울 용산구', latitude: 37.5326, longitude: 126.9905, name: '서울 용산구' },
  { keyword: '서울 은평구', latitude: 37.6027, longitude: 126.9291, name: '서울 은평구' },
  { keyword: '서울 종로구', latitude: 37.5735, longitude: 126.9788, name: '서울 종로구' },
  { keyword: '서울 중구', latitude: 37.5641, longitude: 126.9979, name: '서울 중구' },
  { keyword: '서울 중랑구', latitude: 37.6063, longitude: 127.0927, name: '서울 중랑구' },
]

export const regionFallbackCoordinates = [
  { keyword: '서울', latitude: 37.5665, longitude: 126.978, name: '서울' },
  { keyword: '부산', latitude: 35.1796, longitude: 129.0756, name: '부산' },
  { keyword: '대구', latitude: 35.8714, longitude: 128.6014, name: '대구' },
  { keyword: '인천', latitude: 37.4563, longitude: 126.7052, name: '인천' },
  { keyword: '광주', latitude: 35.1595, longitude: 126.8526, name: '광주' },
  { keyword: '대전', latitude: 36.3504, longitude: 127.3845, name: '대전' },
  { keyword: '울산', latitude: 35.5384, longitude: 129.3114, name: '울산' },
  { keyword: '경기', latitude: 37.4138, longitude: 127.5183, name: '경기' },
  { keyword: '강원', latitude: 37.8228, longitude: 128.1555, name: '강원' },
  { keyword: '충북', latitude: 36.8, longitude: 127.7, name: '충북' },
  { keyword: '충남', latitude: 36.5184, longitude: 126.8, name: '충남' },
  { keyword: '전북', latitude: 35.7175, longitude: 127.153, name: '전북' },
  { keyword: '전남', latitude: 34.8679, longitude: 126.991, name: '전남' },
  { keyword: '경북', latitude: 36.4919, longitude: 128.8889, name: '경북' },
  { keyword: '경남', latitude: 35.4606, longitude: 128.2132, name: '경남' },
  { keyword: '제주', latitude: 33.4996, longitude: 126.5312, name: '제주' },
]

export function normalizeKoreanLocation(location) {
  return (location || '').replace(/\s+/g, ' ').trim()
}

export function findFallbackCoordinates(location, candidates = detailedFallbackCoordinates) {
  const normalized = normalizeKoreanLocation(location)
  return candidates.find((item) => normalized.includes(item.keyword))
}
