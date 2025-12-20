# 🛒 ACA
2025 부경대학교 캡스톤디자인 **스마트 쇼핑 시스템 ACA**는 오프라인 쇼핑을 스마트하게 지원하기 위해 개발된 앱입니다.

- 스마트 쇼핑 시스템 앱 개발
- 프론트엔드(React Native), 백엔드(Spring Boot), 임베디드 시스템 연동

---

## ✨ 주요 기능
### 🧠 YOLOv5 기반 상품 인식

- 장바구니에 부착된 **임베디드 제품 분류기**에서 YOLOv5 모델을 사용하여 상품 인식
- 연속 프레임 간 **IoU 기반 객체 추적**을 통해 동일 상품을 안정적으로 판별
- 일정 횟수 이상 연속 검출 시 실제 장바구니 담김으로 판단

### 🛒 실시간 가상 장바구니

- 인식된 상품 정보를 **백엔드 서버의 가상 장바구니**에 실시간 반영
- **WebSocket 기반 통신**으로 모바일 앱에 즉시 전달
- 상품 이미지, 이름, 수량, 가격을 실시간 확인 가능

### 📡 BLE Beacon 기반 매장 입·퇴장 감지

- BLE Beacon을 활용한 고객의 **매장 입장 및 퇴장 자동 인식**
- 입장 시 쇼핑 세션 시작
- 퇴장 시 자동 결제 트리거

### 💳 자동 결제 시스템

- 매장 퇴장 감지 시 서버에서 자동 결제 진행
- 사용자는 별도의 결제 절차 없이 쇼핑 종료 가능

### 🧾 전자 영수증 제공

- 결제 완료 후 모바일 앱에서 **전자 영수증 확인**
- 거래 일시, 구매 품목, 결제 금액 등 상세 정보 제공

---

**앱 개발자 전용 레포지토리**로, 다음과 같은 팀원이 참여하고 있습니다
## 🎮 Contributors

<table>
  <tr>
    <th>Role</th>
    <th>Profile</th>
    <th>Name</th>
    <th>Position</th>
  </tr>
  <tr>
    <td align="center">Front-End</td>
    <td align="center">
      <a href="https://github.com/khw010419">
        <img src="https://avatars.githubusercontent.com/khw010419" height="100" width="100"><br/>
        <strong>khw010419</strong>
      </a>
    </td>
    <td align="center"><strong>김효원</strong></td>
    <td align="center"><strong>FE Developer</strong></td>
  </tr>
  <tr>
    <td align="center">Back-End</td>
    <td align="center">
      <a href="https://github.com/Chaeyeon0">
        <img src="https://avatars.githubusercontent.com/Chaeyeon0" height="100" width="100"><br/>
        <strong>Chaeyeon0</strong>
      </a>
    </td>
    <td align="center"><strong>백채연</strong></td>
    <td align="center"><strong>BE Developer</strong></td>
  </tr>
  <tr>
    <td align="center">Embedded</td>
    <td align="center">
      <a href="https://github.com/JehuiLee">
        <img src="https://avatars.githubusercontent.com/JehuiLee" height="100" width="100"><br/>
        <strong>JehuiLee</strong>
      </a>
    </td>
    <td align="center"><strong>이제희</strong></td>
    <td align="center"><strong>Embedded Developer</strong></td>
  </tr>
  <tr>
    <td align="center">Embedded</td>
    <td align="center">
      <a href="https://github.com/Danny-Caesar">
        <img src="https://avatars.githubusercontent.com/Danny-Caesar" height="100" width="100"><br/>
        <strong>Danny-Caesar</strong>
      </a>
    </td>
    <td align="center"><strong>김동건</strong></td>
    <td align="center"><strong>Embedded Developer</strong></td>
  </tr>
</table>
