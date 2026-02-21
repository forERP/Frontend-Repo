import { useEffect, useMemo, useRef, useState } from 'react';
import { getDefaultMapCenter, hasValidCoordinate, loadKakaoMapSdk, toNumber } from '../../utils/kakaoMap';
import './MapCommon.css';

const COLOR_CURRENT = '#2563eb';
const COLOR_HQ = '#dc2626';
const COLOR_OTHER = '#059669';
const COLOR_WAREHOUSE = '#f59e0b';

function createMarkerImage(kakao, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="11" fill="${color}" stroke="white" stroke-width="3"/></svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return new kakao.maps.MarkerImage(url, new kakao.maps.Size(30, 30), {
    offset: new kakao.maps.Point(15, 15),
  });
}

function normalizeStorePoint(store, currentStoreId) {
  const lat = toNumber(store?.latitude);
  const lng = toNumber(store?.longitude);
  if (lat === null || lng === null) {
    return null;
  }

  const id = Number(store?.id);
  const isCurrent = Number.isFinite(id) && id === Number(currentStoreId);
  const isHq = store?.type === 'HQ';

  if (isCurrent) {
    return {
      kind: 'current',
      color: COLOR_CURRENT,
      label: `[현재 매장] ${store?.name || '매장'}`,
      latitude: lat,
      longitude: lng,
    };
  }

  if (isHq) {
    return {
      kind: 'hq',
      color: COLOR_HQ,
      label: `[본사] ${store?.name || '본사'}`,
      latitude: lat,
      longitude: lng,
    };
  }

  return {
    kind: 'other',
    color: COLOR_OTHER,
    label: store?.name || '다른 매장',
    latitude: lat,
    longitude: lng,
  };
}

function normalizeWarehousePoint(warehouse) {
  const lat = toNumber(warehouse?.latitude);
  const lng = toNumber(warehouse?.longitude);
  if (lat === null || lng === null) {
    return null;
  }

  const storeName = warehouse?.storeName ? `(${warehouse.storeName}) ` : '';

  return {
    kind: 'warehouse',
    color: COLOR_WAREHOUSE,
    label: `[창고] ${storeName}${warehouse?.name || ''}`,
    latitude: lat,
    longitude: lng,
  };
}

export default function StoreGroupMap({
  currentStoreId,
  stores,
  warehouses,
  showWarehouses,
  onToggleWarehouses,
  title = '매장 위치 지도',
}) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const kakaoRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const normalizedStorePoints = useMemo(
    () => (stores || []).map((store) => normalizeStorePoint(store, currentStoreId)).filter(Boolean),
    [stores, currentStoreId],
  );

  const normalizedWarehousePoints = useMemo(
    () => (warehouses || []).map(normalizeWarehousePoint).filter(Boolean),
    [warehouses],
  );

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const kakao = await loadKakaoMapSdk();
        if (!mounted || !mapElementRef.current) {
          return;
        }

        kakaoRef.current = kakao;

        const { latitude, longitude } = getDefaultMapCenter();
        mapRef.current = new kakao.maps.Map(mapElementRef.current, {
          center: new kakao.maps.LatLng(latitude, longitude),
          level: 7,
        });

        setMapReady(true);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(err?.message || '매장 지도를 표시하지 못했습니다.');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      markersRef.current = [];
      overlaysRef.current = [];
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    if (!mapRef.current || !kakaoRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    const pointList = showWarehouses
      ? [...normalizedStorePoints, ...normalizedWarehousePoints]
      : normalizedStorePoints;

    if (pointList.length === 0) {
      const { latitude, longitude } = getDefaultMapCenter();
      const center = new kakaoRef.current.maps.LatLng(latitude, longitude);
      mapRef.current.setCenter(center);
      mapRef.current.setLevel(7);
      return;
    }

    const bounds = new kakaoRef.current.maps.LatLngBounds();

    pointList.forEach((point) => {
      const position = new kakaoRef.current.maps.LatLng(point.latitude, point.longitude);
      const marker = new kakaoRef.current.maps.Marker({
        position,
        image: createMarkerImage(kakaoRef.current, point.color),
      });
      marker.setMap(mapRef.current);
      markersRef.current.push(marker);

      const overlay = new kakaoRef.current.maps.CustomOverlay({
        position,
        yAnchor: 2,
        content: `<div style="padding:4px 8px;border-radius:8px;background:#ffffff;border:1px solid #d1d5db;font-size:11px;color:#111827;white-space:nowrap;">${point.label}</div>`,
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);

      bounds.extend(position);
    });

    mapRef.current.setBounds(bounds, 40, 40, 40, 40);
  }, [mapReady, normalizedStorePoints, normalizedWarehousePoints, showWarehouses]);

  const hasStoreLocation = (stores || []).some((store) => hasValidCoordinate(store?.latitude, store?.longitude));

  return (
    <div className="group-map-card">
      <h3>{title}</h3>
      {!hasStoreLocation && <p className="map-empty-text">위치가 저장된 매장이 없어 기본 위치로 표시됩니다.</p>}

      <div className="group-map-toolbar">
        <div className="group-map-legend">
          <span className="group-map-legend-item">
            <i className="group-map-dot" style={{ background: COLOR_CURRENT }} />
            현재 매장
          </span>
          <span className="group-map-legend-item">
            <i className="group-map-dot" style={{ background: COLOR_HQ }} />
            본사
          </span>
          <span className="group-map-legend-item">
            <i className="group-map-dot" style={{ background: COLOR_OTHER }} />
            다른 매장
          </span>
          <span className="group-map-legend-item">
            <i className="group-map-dot" style={{ background: COLOR_WAREHOUSE }} />
            창고
          </span>
        </div>

        <label className="group-map-toggle">
          <input
            type="checkbox"
            checked={showWarehouses}
            onChange={(event) => onToggleWarehouses?.(event.target.checked)}
          />
          창고 함께 표시
        </label>
      </div>

      {error && <div className="map-error-text">{error}</div>}
      <div ref={mapElementRef} className="map-preview" />
    </div>
  );
}