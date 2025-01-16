'use client';

import Image from 'next/image';

import closeIcon from '@icons/close.svg';

import { useRouter } from 'next/navigation';
import { useRegion } from '@/hooks/useRegion';
import { regionStore } from '@/stores/RegionState';
import { useEffect, useState } from 'react';

const regions = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

const Search = () => {
  const router = useRouter();
  const { updateRegion } = useRegion();
  const { coloredState } = regionStore();
  const [originPath, setOriginPath] = useState<string | null>(null);
  const [query, setQuery] = useState<string | null>(null);

  const closeSearch = () => {
    router.back();
  };

  useEffect(() => {
    const currentQuery = new URLSearchParams(window.location.search);
    const origin = currentQuery.get('origin');
    setOriginPath(origin);

    currentQuery.delete('origin');
    const updatedQuery = currentQuery.toString();
    setQuery(updatedQuery);
  }, [updateRegion]);

  const handleSearch = async () => {
    try {
      router.push(`/${originPath}?${query || ''}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div
        className="absolute left-5 top-5 flex justify-center items-center w-9 h-9 shadow-iconShadow rounded-full"
        onClick={closeSearch}
      >
        <Image src={closeIcon} width={10} height={10} alt="닫기 아이콘" />
      </div>
      <h1 className="mt-20 mb-7 text-title">지역으로 검색해보세요</h1>
      <div className="bg-LightGray w-full h-[1px] mb-2" />
      <div className="grid grid-cols-2 w-10/12 h-2/3 place-items-center">
        {regions.map((regionName) => {
          return (
            <div
              key={regionName}
              className={`flex justify-center items-center border  w-36 h-12 rounded-full ${coloredState === regionName ? 'border-Green text-Green' : 'border-LightGray text-Gray'}`}
              onClick={(e) => {
                updateRegion(e);
              }}
            >
              {regionName}
            </div>
          );
        })}
      </div>
      <div className="bg-LightGray w-full h-[1px] mt-3" />
      <button
        className="w-3/5 h-10 bg-Green rounded-full text-white mt-5"
        onClick={handleSearch}
      >
        확인
      </button>
    </div>
  );
};
export default Search;
