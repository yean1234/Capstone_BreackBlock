# Break Block

HTML5 Canvas로 구현한 벽돌깨기 게임입니다. 홈 화면과 게임 화면을 분리하고, 점수 기반 FEVER 시스템과 CLEAR 모달로 플레이 흐름을 명확하게 구성했습니다.

## 게임 특징
1) **HOME 화면 / GAME 화면 분리**
- 시작 전에는 HOME 화면만 보이며, Start 버튼을 누르면 GAME 화면으로 전환됩니다.

2) **1500점마다 FEVER 발동**
- 점수가 1500점에 도달할 때마다 FEVER가 실행됩니다.

2-1) **FEVER 효과**
- 메인 공 속도가 증가합니다.
- 메인 공의 경로를 따라 Ghost 공이 생성됩니다.

2-2) **FEVER 종료 조건**
- 메인 공과 Ghost 공이 모두 바닥으로 떨어지면 FEVER가 종료됩니다.
- 최대 지속 시간은 **15초**이며, 시간이 끝나면 즉시 종료됩니다.

3) **CLEAR 오버레이 모달**
- 모든 벽돌을 깨면 CLEAR 모달이 화면 중앙에 표시됩니다.
- 최종 점수가 표시되고, Retry 버튼으로 즉시 재시작할 수 있습니다.

## 조작 방법
- **좌/우 방향키**: 패들 이동
- **스페이스바**: 공 발사

## 실행 방법
```bash
npm install
npm run dev
```
또는
```bash
npm run start
```

## 기술 스택
- Node.js
- Vanilla JavaScript
- HTML/CSS
- Canvas API
