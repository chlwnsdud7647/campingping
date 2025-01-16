'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Category from '@/components/Category/Category';
import Card from '@/components/Card/Card';
import { Camp } from '@/types/Camp';
import SearchBar from '@/components/SearchBar/SearchBar';
import { api } from '@/utils/axios';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import LoadingSpinner from '@/components/Button/LoadingSpinner';
import { useCreateQueryString } from '@/hooks/useCreateQueryString';

import useCategory from '@/hooks/useCategory';

const List = () => {
  const searchParams = useSearchParams();

  const { selectedCategory, handleCategorySelected } = useCategory();
  const [regionQuery, setRegionQuery] = useState<string | null>(null);

  const [campingData, setCampingData] = useState<Camp[] | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { nextCursorRef, currentCursor, LIMIT, resetCursor } =
    useInfiniteScroll({
      loadMoreElementRef: loadMoreRef,
    });

  const createQueryString = useCreateQueryString(searchParams);

  useEffect(() => {
    setRegionQuery(new URLSearchParams(window.location.search).get('region'));
  });

  const fetchCampingData = useCallback(async () => {
    try {
      const apiUrl = createQueryString('/campings/lists', [
        { name: 'limit', value: LIMIT },
        { name: 'cursor', value: currentCursor },
        { name: 'category', value: selectedCategory },
        { name: 'region', value: regionQuery },
      ]);
      const response = await api.get(apiUrl);
      const camps = response.data.data.result;
      const nextCursor = response.data.data.nextCursor;
      return { camps, nextCursor };
    } catch (error) {
      console.error(error);
      return { camps: [], nextCursor: 0 };
    }
  }, [LIMIT, createQueryString, currentCursor, selectedCategory, regionQuery]);

  useEffect(() => {
    setCampingData([]);
    resetCursor();
  }, [resetCursor, selectedCategory, regionQuery]);

  useEffect(() => {
    setIsLoading(true);
    fetchCampingData().then(({ camps, nextCursor }) => {
      nextCursorRef.current = nextCursor;
      setCampingData((previous) => {
        const listOfPreviousContentId =
          previous?.map((previousCamp) => previousCamp.contentId) || [];
        const deDuplicatedResults = camps.filter(
          (camp: Camp) => !listOfPreviousContentId.includes(camp.contentId)
        );

        return [...(previous || []), ...deDuplicatedResults];
      });
    });
    setIsLoading(false);
  }, [fetchCampingData, nextCursorRef]);

  return (
    <div className="flex flex-col ">
      <SearchBar origin="list" category={selectedCategory} />
      <Category
        selectedCategory={selectedCategory}
        onCategorySelected={handleCategorySelected}
      />
      <div className="flex flex-col space-y-8 scroll-smooth p-4 mx-*">
        {campingData?.length ? (
          campingData.map((camp) => (
            <Card
              key={camp.contentId}
              itemId={camp.contentId}
              liked={camp.favorite}
              imgSrc={camp.firstImageUrl}
              name={camp.facltNm ? camp.facltNm : ''}
              address={
                camp.addr1
                  ? camp.addr2
                    ? `${camp.addr1} ${camp.addr2}`
                    : camp.addr1
                  : ''
              }
              description={camp.lineIntro || ''}
            />
          ))
        ) : (
          <p>검색 결과가 없습니다</p>
        )}
      </div>
      <div ref={loadMoreRef} className="h-[100px]">
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
};

export default List;
