'use client';

import dynamic from 'next/dynamic';

import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useRef, useState } from 'react';

import SearchBar from '@/components/SearchBar/SearchBar';
import Weather from '@/components/Weather/Weather';

import { MapListWrap } from './component/MapListWrap';
import Overlay from './component/Overlay';

import { CampMap } from '@/types/CampMap';
import { useLocationStore } from '@/stores/locationState';

import { api } from '@/utils/axios';
import useLocation from '@/hooks/useLocation';
import useCategory from '@/hooks/useCategory';

const LIMIT = 10;

const Map = () => {
  const [regionQuery, setRegionQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(0);

  const NoSSRCategory = dynamic(
    () => import('../../components/Category/Category'),
    { ssr: false }
  );

  const { selectedCategory, handleCategorySelected } = useCategory();

  const { userLat, userLon } = useLocationStore();
  const [lat, setLat] = useState<number | null>(userLat);
  const [lon, setLon] = useState<number | null>(userLon);

  const mapRef = useRef<HTMLDivElement>(null);
  const [kakaoMap, setKakaoMap] = useState<unknown | null>(null);
  const [, setKakaoMarker] = useState<unknown | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const [campList, setCampList] = useState<CampMap[]>([]);

  useEffect(() => {
    setRegionQuery(new URLSearchParams(window.location.search).get('region'));
  });

  const location = useLocation(regionQuery);

  const getNearByCampings = async () => {
    try {
      const res = await api.get(`/campings/map?lat=${userLat}&lon=${userLon}`);

      setCampList(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getCampingsByDoNm = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await api.get(
        `campings/lists?region=${regionQuery}${selectedCategory !== '전체' ? `&category=${selectedCategory}` : ''}&limit=${LIMIT}&cursor=${nextCursor}`
      );

      const data = res.data.data.result;

      if (res.data.data.nextCursor === null) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setNextCursor(res.data.data.nextCursor);
      }

      setCampList((prev) => [...prev, ...data]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading, selectedCategory, regionQuery, hasMore]);

  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || !hasMore) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (regionQuery) {
            }
            getCampingsByDoNm();
          }
        },
        { threshold: 0.4 }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, hasMore, getCampingsByDoNm]
  );

  useEffect(() => {
    if (!mapRef.current) return;

    if (lat !== null && lon !== null) {
      window.kakao?.maps.load(() => {
        const options = regionQuery
          ? {
              center: new window.kakao.maps.LatLng(lat, lon),
              level: 10,
              disableDoubleClick: true,
            }
          : {
              center: new window.kakao.maps.LatLng(lat, lon),
              level: 7,
              disableDoubleClick: true,
            };

        const map = new window.kakao.maps.Map(mapRef.current, options);
        if (regionQuery) {
          map.setZoomable(false);
        }
        if (!regionQuery) {
          map.setZoomable(false);
          map.setDraggable(false);
        }

        setKakaoMap(map);
      });

      if (regionQuery) {
        getCampingsByDoNm();
      } else {
        getNearByCampings();
      }
    }
  }, [lat, lon, regionQuery, selectedCategory]);

  useEffect(() => {
    if (!kakaoMap || campList.length === 0) return;
    const positions = campList.map((camp) => ({
      id: camp.contentId,
      title: camp.facltNm,
      latlng: new window.kakao.maps.LatLng(
        camp.location.coordinates[1],
        camp.location.coordinates[0]
      ),
      address: camp.addr1,
    }));

    positions.forEach((position) => {
      const marker = new window.kakao.maps.Marker({
        map: kakaoMap,
        position: position.latlng,
        title: position.title,
        address: position.address,
        contentId: position.id,
      });

      marker.setMap(kakaoMap);

      const createContent = (
        closeHandler: React.MouseEventHandler<HTMLImageElement>
      ) => {
        const overlayContent = document.createElement('div');
        const root = createRoot(overlayContent);
        root.render(
          <Overlay
            id={position.id}
            name={position.title}
            address={position.address}
            onClick={closeHandler}
          />
        );

        return overlayContent;
      };

      const closeOverlay = () => {
        overlay.setMap(null);
      };

      const overlay = new window.kakao.maps.CustomOverlay({
        content: createContent(closeOverlay),
        position: marker.getPosition(),
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        const markerPosition = marker.getPosition();
        const adjustedPosition = new window.kakao.maps.LatLng(
          markerPosition.getLat() + 0.1,
          markerPosition.getLng()
        );

        overlay.setPosition(adjustedPosition);
        overlay.setMap(kakaoMap);
      });

      setKakaoMarker(marker);
    });
  }, [campList]);

  useEffect(() => {
    if (regionQuery && location) {
      setLat(location.regionLat);
      setLon(location.regionLon);
    } else if (userLat && userLon) {
      setLat(userLat);
      setLon(userLon);
    }
  }, [regionQuery, location, userLat, userLon]);

  return (
    <>
      <SearchBar origin="map" category={selectedCategory} />

      {regionQuery && (
        <NoSSRCategory
          selectedCategory={selectedCategory}
          onCategorySelected={handleCategorySelected}
        />
      )}

      <Weather />
      <div className="relative w-full h-full">
        {lat && lon ? (
          <div ref={mapRef} className="w-full h-full">
            <MapListWrap campList={campList} lastItemRef={lastItemRef} />
          </div>
        ) : (
          <div className="h-5/6 flex flex-col justify-center items-center">
            <p>위치를 기반으로 하는 페이지 입니다.</p>
            <p>위치 권한을 확인해주세요</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Map;
