import { useEffect, useRef, useState } from 'react';
import { getDefaultMapCenter, hasValidCoordinate, loadKakaoMapSdk, toNumber } from '../../utils/kakaoMap';
import './MapCommon.css';

export default function SingleLocationMap({ latitude, longitude, title = '위치 정보', emptyMessage = '저장된 좌표가 없습니다.' }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const kakaoRef = useRef(null);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const kakao = await loadKakaoMapSdk();
        if (!mounted || !mapElementRef.current) {
          return;
        }

        kakaoRef.current = kakao;
        const { latitude: defaultLatitude, longitude: defaultLongitude } = getDefaultMapCenter();

        mapRef.current = new kakao.maps.Map(mapElementRef.current, {
          center: new kakao.maps.LatLng(defaultLatitude, defaultLongitude),
          level: 4,
        });

        markerRef.current = new kakao.maps.Marker({ map: null });
        setMapReady(true);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(err?.message || '카카오 지도를 표시하지 못했습니다.');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    if (!mapRef.current || !markerRef.current || !kakaoRef.current) {
      return;
    }

    if (!hasValidCoordinate(latitude, longitude)) {
      markerRef.current.setMap(null);
      return;
    }

    const lat = toNumber(latitude);
    const lng = toNumber(longitude);
    if (lat === null || lng === null) {
      markerRef.current.setMap(null);
      return;
    }

    const position = new kakaoRef.current.maps.LatLng(lat, lng);
    markerRef.current.setPosition(position);
    markerRef.current.setMap(mapRef.current);
    mapRef.current.setCenter(position);
  }, [mapReady, latitude, longitude]);

  if (error) {
    return <div className="map-error-text">{error}</div>;
  }

  return (
    <div className="single-map-card">
      <h3>{title}</h3>
      {!hasValidCoordinate(latitude, longitude) && <p className="map-empty-text">{emptyMessage}</p>}
      <div ref={mapElementRef} className="map-preview" />
    </div>
  );
}
