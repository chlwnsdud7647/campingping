'use client';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DesktopUi from './DesktopUi';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/stores/locationState';
import useGeoLocationPermission from '@/hooks/useGeoLocation';
import Nav from '../Nav/Nav';
import { usePathname, useRouter } from 'next/navigation';
import OpenTheChats from '../OpenTheChats/OpenTheChats';
import { chattingStore } from '@/stores/chattingState';
import Chat from '../Chat/Chat';
import { userStore } from '@/stores/userState';
import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import InstallPrompt from '@/components/PWA/InstallPwa/InstallPwa';

import { usePwaPrompt } from '@/hooks/usePwaPrompt';
import { usePushNotification } from '@/hooks/usePushNotification';

import registerPushNotification from '@/utils/registerPushNotification';
import { isPwa } from '@/utils/isPwa';
import { usePwaStore } from '@/stores/pwaState';
import PwaModal from '@/components/PWA/PwaModal/PwaModal';

import { socket } from '../../socket';
import { ChatHistoryData, ChatMsgs } from '@/types/Chatting';
import { CHAT } from '@/constants/chat/chatEvents';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPwaState, setIsPwaState] = useState<boolean | null>(null);

  const { updateLocation } = useLocationStore();
  const { chatState, setChatState, chatRoomId, setChatRoomId } =
    chattingStore();
  const [, setChatMsgs] = useState<ChatMsgs[]>([]);

  const { userState } = userStore();
  const isGeoLocationGranted = useGeoLocationPermission();

  const { isMobile } = useIsMobile();
  const { handleInstall, handleClose } = usePwaPrompt();
  const { isPwaOpen, clicked } = usePwaStore();
  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      // console.log('서비스 워커 등록 성공:', registration);
    } catch (error) {
      console.error('서비스 워커 등록 실패:', error);
    }
  };

  const requestPushPermission = async () => {
    askPushNotification();
  };

  const { denyPermission, askPushNotification, checkNotificationPermission } =
    usePushNotification();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isGeoLocationGranted) {
      updateLocation();
    } else if (!isMobile) {
      toast.warn(
        '위치 권한을 설정하지 않으면 사용하지 못하는 기능이 있어요 !',
        {
          autoClose: 7000,
        }
      );
    }
  }, [isGeoLocationGranted, updateLocation]);

  useEffect(() => {
    const setupServiceWorkerAndPushPermission = async () => {
      await registerServiceWorker();
      if (userState) {
        requestPushPermission();
      }
    };

    setupServiceWorkerAndPushPermission();
  }, []);

  useEffect(() => {
    const initPushNotification = async () => {
      if (!userState) return;
      try {
        await registerPushNotification();
      } catch (error) {
        console.error('Push Notification 등록 실패:', error);
      }
    };

    initPushNotification();
  }, [userState]);

  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'OPEN_CHAT_MODAL') {
        const roomId = event.data.roomId;

        if (userState && roomId) {
          setChatState(true);
          setChatRoomId(roomId);

          socket.emit(CHAT.HISTORY.FETCH, { roomId: chatRoomId });

          const chatHistoryHandler = ({ chatHistory }: ChatHistoryData) => {
            setChatMsgs(chatHistory);
          };

          socket.on(CHAT.HISTORY.FETCHED, chatHistoryHandler);

          return () => {
            socket.off(CHAT.HISTORY.FETCHED, chatHistoryHandler);
          };
        } else if (userState && !roomId) {
          setChatState(true);
        } else {
          router.push('/sign-in');
          toast.error('로그인이 필요합니다 💡');
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandler);

    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, [userState]);

  useEffect(() => {
    setIsPwaState(isPwa());
  }, []);

  if (isPwaState === null) {
    return;
  }

  return (
    <div className="relative">
      <ToastContainer
        position="top-center"
        draggable
        className="fixed left-1/2 -translate-x-1/2 mt-16 z-50 max-w-[90%] z-[100]"
      />
      <div className="flex h-screen justify-center items-center">
        <DesktopUi />
        <div
          className={`relative w-full md:max-w-[450px] h-full flex justify-center ${chatState ? 'overflow-hidden' : 'overflow-auto'}`}
        >
          {children}
          {pathname !== '/sign-in' && pathname !== '/search' && (
            <OpenTheChats
              onClick={() => {
                if (userState) {
                  setChatState(true);
                } else {
                  router.push('/sign-in');
                  toast.error('로그인이 필요한 기능이에요');
                }
              }}
            />
          )}

          {!isPwaState && <InstallPrompt />}
          {isPwaOpen && clicked === 'install' && (
            <PwaModal onClick={handleInstall} onClose={handleClose} />
          )}
          {isPwaOpen && clicked === 'noti' && (
            <PwaModal
              onClick={checkNotificationPermission}
              onClose={denyPermission}
            />
          )}
          {chatState && <Chat />}
          <Nav />
        </div>
      </div>
    </div>
  );
}
