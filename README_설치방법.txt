동진 종사자 안전보건 의견청취 QR 관리시스템 v1.3

[이번 버전 추가]
- 본사 관리자 화면
- 현장별 접수의견 현황
- 현장 QR 관리
- 최초 설정 탭
- 초보자용 설치가이드 탭
- setup_guide.html 별도 설치가이드 페이지

[설치 순서]
1. GitHub 저장소 dj-worker-opinion 생성
2. index.html, apps_script.gs, setup_guide.html 업로드
3. GitHub Pages 활성화
4. 웹페이지 접속 후 '초보 설치가이드' 탭 확인
5. 구글시트 만들기
6. Apps Script 만들기
7. 설치코드 복사 후 Apps Script에 붙여넣기
8. SHEET_ID 입력
9. setupSheets() 실행
10. 웹앱으로 배포
11. 웹앱 URL을 관리화면 상단 Google Apps Script 배포 URL에 저장
12. 관리자 PIN 입력 후 설정 저장

[입력해야 할 값]
- 구글시트 제목: 동진_종사자의견청취_관리대장
- Apps Script 프로젝트명: 동진 종사자의견청취 QR 서버
- SHEET_ID: 구글시트 주소의 /d/ 와 /edit 사이 긴 문자
- ADMIN_PIN: 기본 5183, 필요 시 apps_script.gs 상단에서 변경
- 웹앱 실행 사용자: 나
- 웹앱 액세스 권한: 모든 사용자

[정상 설치 확인]
- setupSheets() 실행 후 구글시트 하단에 의견접수, 현장QR, 반기점검 탭이 생기면 정상
- 현장 QR 관리에서 테스트 현장을 등록하고 제출화면 열기로 의견 1건 제출
- 본사 관리자에서 본사 현황 불러오기/의견 목록 불러오기로 테스트 의견이 보이면 완료
