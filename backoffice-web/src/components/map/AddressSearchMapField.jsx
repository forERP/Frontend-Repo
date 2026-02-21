import { useEffect, useRef, useState } from 'react';
import {
  getDefaultMapCenter,
  hasValidCoordinate,
  loadKakaoMapSdk,
  toNumber,
} from '../../utils/kakaoMap';
import './MapCommon.css';

function normalizeSearchResult(result) {
  const latitude = toNumber(result?.y);
  const longitude = toNumber(result?.x);
  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    address: result?.road_address_name || result?.address_name || '',
    roadAddress: result?.road_address_name || '',
    jibunAddress: result?.address_name || '',
    latitude,
    longitude,
  };
}

export default function AddressSearchMapField({
  address,
  latitude,
  longitude,
  onAddressChange,
  onLocationChange,
  disabled = false,
  placeholder = '주소를 입력하세요.',
}) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const kakaoRef = useRef(null);

  const [searchKeyword, setSearchKeyword] = useState(address || '');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    setSearchKeyword(address || '');
  }, [address]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const kakao = await loadKakaoMapSdk();
        if (!mounted || !mapElementRef.current) {
          return;
        }

        kakaoRef.current = kakao;
        geocoderRef.current = new kakao.maps.services.Geocoder();

        const { latitude: defaultLatitude, longitude: defaultLongitude } = getDefaultMapCenter();
        mapRef.current = new kakao.maps.Map(mapElementRef.current, {
          center: new kakao.maps.LatLng(defaultLatitude, defaultLongitude),
          level: 4,
        });

        markerRef.current = new kakao.maps.Marker({
          map: null,
        });
      } catch (error) {
        console.error(error);
        if (mounted) {
          setMapError(error?.message || '카카오 지도를 초기화하지 못했습니다.');
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
    };
  }, []);

  useEffect(() => {
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
      return;
    }

    const position = new kakaoRef.current.maps.LatLng(lat, lng);
    markerRef.current.setPosition(position);
    markerRef.current.setMap(mapRef.current);
    mapRef.current.setCenter(position);
  }, [latitude, longitude]);

  const handleSearch = () => {
    if (disabled) {
      return;
    }

    const keyword = (searchKeyword || '').trim();
    if (!keyword) {
      setSearchResults([]);
      setSearchError('검색할 주소를 입력해 주세요.');
      return;
    }

    if (!geocoderRef.current || !kakaoRef.current) {
      setSearchError('지도 기능이 아직 준비되지 않았습니다.');
      return;
    }

    setSearching(true);
    setSearchError('');

    geocoderRef.current.addressSearch(keyword, (result, status) => {
      setSearching(false);

      if (status !== kakaoRef.current.maps.services.Status.OK) {
        setSearchResults([]);
        setSelectedResultIndex('');
        setSearchError('주소 검색 결과가 없습니다.');
        return;
      }

      const normalized = (result || []).map(normalizeSearchResult).filter(Boolean);
      if (normalized.length === 0) {
        setSearchResults([]);
        setSelectedResultIndex('');
        setSearchError('좌표로 변환 가능한 주소가 없습니다.');
        return;
      }

      setSearchResults(normalized);
      setSelectedResultIndex('');
    });
  };

  const handleSelectResult = (result) => {
    onLocationChange?.({
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    onAddressChange?.(result.address);
    setSearchKeyword(result.address);
    setSearchResults([]);
    setSelectedResultIndex('');
    setSearchError('');
  };

  const handleAddressInput = (event) => {
    const nextAddress = event.target.value;
    setSearchKeyword(nextAddress);
    onAddressChange?.(nextAddress);
    onLocationChange?.({
      address: nextAddress,
      latitude: null,
      longitude: null,
    });
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectedResultIndex(value);
    if (value === '') {
      return;
    }

    const selected = searchResults[Number(value)];
    if (!selected) {
      return;
    }

    handleSelectResult(selected);
  };

  return (
    <div className="map-field-wrapper">
      <div className="map-address-row">
        <input
          type="text"
          value={searchKeyword}
          onChange={handleAddressInput}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button type="button" onClick={handleSearch} disabled={disabled || searching}>
          {searching ? '검색 중...' : '주소 검색'}
        </button>
      </div>

      {searchError && <div className="map-error-text">{searchError}</div>}
      {mapError && <div className="map-error-text">{mapError}</div>}

      {searchResults.length > 0 && (
        <select
          className="map-result-select"
          value={selectedResultIndex}
          onChange={handleSelectChange}
          disabled={disabled}
        >
          <option value="">검색 결과에서 주소를 선택하세요.</option>
          {searchResults.map((result, index) => (
            <option key={`${result.address}-${result.latitude}-${result.longitude}-${index}`} value={index}>
              {result.roadAddress || result.address}
              {result.roadAddress && result.jibunAddress ? ` (${result.jibunAddress})` : ''}
            </option>
          ))}
        </select>
      )}

      <div ref={mapElementRef} className="map-preview" />
    </div>
  );
}
