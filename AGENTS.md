# AGENTS.md

## Project
- Build a simple HTML5 brick-breaker web game.
- Stack: Node.js, Vanilla JavaScript, HTML/CSS (no frameworks).
- Record future user instructions here as they are given.

## Controls
- Arrow Left/Right: move the paddle.
- Space: launch the ball (start).

## Core Rules
- Start in NORMAL state with 1 ball.
- If a ball falls below the floor, life -1. When life reaches 0 => GAMEOVER.
- Score increases when breaking bricks (+100 per brick).

## FEVER Time Feature (Ghost Balls)
- Trigger: when score first reaches 1500.
- After a FEVER ends, the next FEVER triggers when score increases by another 1500 (based on the score at FEVER end).
- During FEVER:
  - Keep exactly 1 main ball (the real ball).
  - Spawn "Ghost balls" along the main ball's path (trail).
    - Spawn interval: every 0.15s
    - Max concurrent Ghost balls: 12
    - Each Ghost ball:
      - Collides with walls, ceiling, bricks, and paddle (same paddle reflection logic as main ball)
      - Rendered the same as the main ball (white color)
      - Disappears only when falling below the floor (no life loss)
    - Ghost initial velocity: based on main ball direction with random spread (±25 degrees), speed x1.3
  - Main ball speed x1.6.
  - No life loss during FEVER even if the main ball falls below the floor.
  - Score bonus during FEVER: +50 extra per brick (total 150).
- FEVER ends when active balls count becomes 0 (main + Ghosts):
  - FEVER has no time limit.
  - When the main ball first falls below the floor in FEVER, immediately stop spawning new Ghost balls.
  - FEVER ends once all remaining Ghost balls are removed by falling below the floor.
  - On FEVER end, return to NORMAL and respawn 1 main ball on the paddle.
- FEVER max duration: 15 seconds.
  - When max duration is reached, remove all Ghost balls immediately and end FEVER.


## UI
- Top HUD: score, life.
- During FEVER: show "FEVER" text only (no timer).
- Home screen before entering the game:
  - Includes the title "Break Block"
  - Start button enters the game screen
- UI is split into two screen states: HOME and GAME.
  - HOME shows only title + Start (no HUD/FEVER/canvas).
  - GAME shows canvas + HUD; FEVER UI only when FEVER state.
- CLEAR UI:
  - When all bricks are destroyed, show a centered overlay modal.
  - Modal includes “CLEAR!”, final score (with comma), and Retry button.
  - Background is dimmed; keyboard input does not affect the game while modal is shown.
  - CLEAR 판정은 벽돌이 생성된 이후, 진행 중(NORMAL/FEVER) 상태에서 bricksLeft === 0일 때만 수행한다.

## Requirements
- Implement an explicit game state machine: NORMAL / FEVER / GAMEOVER / CLEAR.
- Manage thresholds/durations/multipliers/ghost limits via variables/constants:
  - score threshold/step: 1500
  - speed multiplier: 1.6
  - ghost spawn interval: 0.15s
  - ghost max count: 12
  - fever max duration: 15s

## Run Instructions
- Install dependencies: `npm install`
- Dev server: `npm run dev`
- Live/static server: `npm run start`

## Recent User Instructions
- Scaffold the project structure as specified, install required npm plugins, and configure `npm run dev` / `npm run start`.
- 게임 로직(코어 루프/입력/충돌/FEVER 트레일 클론) 구현 진행.
- FEVER 규칙 변경 사항 반영 후 AGENTS.md 우선 업데이트, 그 기준으로 game.js 수정.
- FEVER 시작 점수를 1000으로 변경, Ghost 공을 메인 공처럼 흰색으로 표시.
- FEVER 시작 점수를 1500으로 변경, 이후 FEVER 종료 후 1500점 증가마다 재발동.
- 게임 시작 전 홈 화면 추가 (Break Block 제목 + Start 버튼).
- 화면 구조를 HOME/GAME 상태로 분리하고, index.html은 앱 컨테이너만 유지. FEVER UI는 FEVER 상태에서만 DOM에 존재.
- 스크롤을 유지한 채로 FEVER 배너가 떠도 캔버스가 잘리지 않도록 100vh 레이아웃 안에서 HUD/FEVER/캔버스를 모두 수용.
- CLEAR 상태 및 오버레이 모달(CLEAR/점수/Retry) 추가.
- Start 직후 CLEAR가 뜨지 않도록 초기화 순서와 CLEAR 판정 조건/시점을 명확히 적용.
- 피버타임에서 Ghost 공도 패들에 안정적으로 튕기도록 충돌 로직 보강.
- Ghost 공 수명 제거, 바닥 낙하로만 제거되며 FEVER 종료는 모든 공 낙하 시점.
- Retry 후 패들 위치/키 입력 초기화로 자동 이동/입력 불가 문제 수정.

## Operating Rules (How Codex should work)
- AGENTS.md is the single source of truth. If instructions conflict, follow AGENTS.md and ask to resolve ambiguity.
- Do NOT add new features not listed here. If something is unclear, ask before implementing.
- Prefer small, reviewable changes. Avoid large refactors unless explicitly requested.
- Keep code simple and readable (vanilla JS). Avoid unnecessary abstractions.

## Project Structure (fixed unless asked)
- /public
  - index.html
  - style.css
  - game.js
- /server (optional)
  - server.js
- package.json

## Development Roadmap
1) Scaffold project (files/folders, package.json scripts)
2) Implement core loop (canvas, render, update, collision, input)
3) Implement FEVER state machine + UI timer
4) Polish UI (HUD, FEVER banner)
5) Basic testing checklist + bug fixes

## Definition of Done (Acceptance Checklist)
- Game runs with `npm install` then:
  - `npm run dev` starts a dev server
  - `npm run start` starts a production/static server
- Paddle moves left/right and ball launches with Space.
- Bricks break and score updates.
- Life decreases when ball falls in NORMAL; GAMEOVER at 0.
- FEVER triggers at score 1500, and re-triggers every +1500 after a FEVER ends:
  - Ghost balls spawn as specified and collide with paddle
  - Spawn stops after main ball first falls in FEVER
  - FEVER ends after all ghosts are gone, then respawns main ball on paddle
  - Speed multiplier applied and restored
  - No life loss during FEVER
  - Score bonus applied during FEVER
- FEVER UI shows \"FEVER\" text only (no timer).

- 채팅 내용은 한국어로 대답해줘.
