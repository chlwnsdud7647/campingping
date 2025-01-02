import { useState } from 'react';

const useRegionHandler = () => {
  const [selectedRegion, setSelectedRegion] = useState('');

  const handleUserSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLDivElement) {
      const value = e.target.innerText;

      if (value.includes('특별자치')) {
        setSelectedRegion(value.slice(0, 2) + value.slice(-1));
      } else if (value.includes('광역시') || value.includes('특별시')) {
        setSelectedRegion(value.slice(0, 2) + '시');
      } else if (value.includes('남') || value.includes('북')) {
        setSelectedRegion(value);
      } else {
        setSelectedRegion(value);
      }
    }
  };

  return { selectedRegion, handleUserSelect };
};

export default useRegionHandler;
