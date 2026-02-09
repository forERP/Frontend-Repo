## 빌드 스테이지: Vite React 앱 빌드
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

## 런타임 스테이지: Nginx로 정적 파일 서빙
FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

# 기본 Nginx 정적 파일 삭제
RUN rm -rf ./*

# 빌드 결과 복사
COPY --from=builder /app/dist ./

# Nginx 기본 설정 덮어쓰기 (단일 페이지 앱 라우팅 지원)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 외부에서 접근할 포트 (docker-compose에서 3200으로 매핑 예정)
EXPOSE 80

