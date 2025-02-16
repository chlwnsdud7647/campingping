import Image from 'next/image';
import logo from '@images/campingping.png';
import Button from '@/components/Button/Button';

interface PwaAlarmPopUpProps {
  onClick: () => Promise<void>;
  onClose: () => void;
}

const PwaAlarmPopUp = ({ onClick, onClose }: PwaAlarmPopUpProps) => {
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

  const handleClose = async () => {
    await onClose();
  };

  return (
    <div className="fixed top-0 w-full h-screen bg-black bg-opacity-50 z-zModal max-w-[450px] ">
      <div className=" bg-white p-6 rounded-b-3xl w-full h-48 flex flex-col justify-center items-center transition-all duration-500 ease-in-out z-zModal">
        <Image
          src={logo}
          alt="로고이미지"
          width={50}
          height={50}
          quality={50}
          priority
        />

        {isApple ? (
          <>
            <p className="text-description">
              <span className="text-textGreen">캠핑핑</span> 앱이 오프라인일
              때에도
              <span className="text-textGreen"> 채팅 등의 알람</span>을 받아볼
              수 있어요 !
            </p>
            <p>알림을 허용하시겠습니까?</p>
            <div className="flex gap-3 mt-3">
              <Button width="w-20" height="h-8" onClick={onClick}>
                확인
              </Button>
              <Button
                width="w-20"
                height="h-8"
                bgcolor="bg-LightGray"
                onClick={handleClose}
              >
                취소
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-description">
              알림 설정 권한이 없습니다.
              <span className="text-textGreen">
                설정에서 알림 권한을 직접 활성화해주세요 !
              </span>
            </p>

            <div className="mt-3">
              <Button width="w-20" height="h-8" onClick={handleClose}>
                확인
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PwaAlarmPopUp;
