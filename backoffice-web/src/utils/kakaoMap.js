const KAKAO_SDK_ID = 'kakao-map-sdk-script';
const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };

let kakaoSdkPromise = null;

function readRuntimeConfig() {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__RUNTIME_CONFIG__ || {};
}

export function getKakaoMapAppKey() {
  const runtimeKey = readRuntimeConfig().KAKAO_MAP_APP_KEY;
  if (runtimeKey && String(runtimeKey).trim()) {
    return String(runtimeKey).trim();
  }

  const buildKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;
  if (buildKey && String(buildKey).trim()) {
    return String(buildKey).trim();
  }

  return '';
}

export function getDefaultMapCenter() {
  return DEFAULT_CENTER;
}

export function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function hasValidCoordinate(latitude, longitude) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  return lat !== null && lng !== null;
}

export async function loadKakaoMapSdk() {
  if (typeof window === 'undefined') {
    throw new Error('브라우저 환경에서만 지도를 사용할 수 있습니다.');
  }

  if (window.kakao?.maps?.services) {
    return window.kakao;
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  const appKey = getKakaoMapAppKey();
  if (!appKey) {
    throw new Error('KAKAO_MAP_APP_KEY가 설정되어 있지 않습니다.');
  }

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const onReady = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve(window.kakao));
      } else {
        reject(new Error('카카오 지도 SDK 로드에 실패했습니다.'));
      }
    };

    const existingScript = document.getElementById(KAKAO_SDK_ID);
    if (existingScript) {
      if (window.kakao?.maps) {
        onReady();
      } else {
        existingScript.addEventListener('load', onReady, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('카카오 지도 SDK 로드에 실패했습니다.')), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_SDK_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error('카카오 지도 SDK 로드에 실패했습니다.'));
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}
