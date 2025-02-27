'use client';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { socket } from '../../socket';

import { CHAT } from '@/constants/chat/chatEvents';

import ChatBox from './ChatBox';
import ChatRoom from './ChatRoom/ChatRoom';

import chevron from '@icons/chevron_gray.svg';
import goToBack from '@icons/goToBack.svg';

import { chattingStore } from '@/stores/chattingState';
import { userStore } from '@/stores/userState';

import { onConnect, onDisconnect } from '@/utils/chat/handleSocket';
import useChat from '@/hooks/chat/useChat';

const Chat = () => {
  const [, setIsConnected] = useState(false);
  const [, setTransport] = useState('N/A');
  const { userState } = userStore();

  const { chats, getChatRooms, newRoom, closeChats } = useChat();

  const { chatState, chatRoomId, setChatRoomId, setChatNick, chatNick } =
    chattingStore();

  useEffect(() => {
    if (!userState) return;

    if (socket.connected) {
      onConnect(setIsConnected, setTransport);
    }

    socket.on('connect', () => onConnect(setIsConnected, setTransport));
    socket.on('disconnect', () => onDisconnect(setIsConnected, setTransport));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [userState]);

  useEffect(() => {
    getChatRooms();
  }, []);

  useEffect(() => {
    const handleNewMessage = () => {
      newRoom();
    };

    socket.on(CHAT.HISTORY.NEW, handleNewMessage);

    return () => {
      socket.off(CHAT.HISTORY.NEW, handleNewMessage);
    };
  }, [newRoom]);

  useEffect(() => {
    const handleUserLeftRoom = () => {
      if (chats.length > 0) {
        getChatRooms();
      }
    };

    socket.on(CHAT.USER.LEFT, handleUserLeftRoom);

    return () => {
      socket.off(CHAT.USER.LEFT, handleUserLeftRoom);
    };
  }, [getChatRooms]);

  return (
    <div
      className={`bg-white fixed bottom-0 w-full max-w-[450px] ${chatState ? 'h-5/6' : 'h-0'} rounded-t-2xl overflow-hidden flex flex-col shadow-mapListShadow transition-all duration-500 ease-in-out z-zChat`}
    >
      <div className="relative flex justify-center ">
        <Image
          src={chevron}
          alt="화살표 아이콘"
          width={16}
          quality={10}
          className="pb-2 mb-4 mt-3 origin-center rotate-180 "
          onClick={closeChats}
        />

        {chatRoomId && (
          <Image
            src={goToBack}
            width={16}
            alt="뒤로가기 버튼"
            quality={10}
            className="absolute left-5 top-6"
            onClick={() => setChatRoomId(null)}
          />
        )}
      </div>

      {chatRoomId === null ? (
        <div>
          <div className="text-title p-6">주변 사람들과 대화해보세요</div>
          <div className="flex flex-wrap flex-col items-center gap-4 w-full pb-12">
            {chats.length > 0 ? (
              chats.map((chat) => {
                return (
                  <div
                    key={chat.roomId}
                    className="w-full flex justify-center"
                    onClick={() => {
                      setChatRoomId(chat.roomId);
                      setChatNick(chat.users[0].nickname);
                    }}
                  >
                    <ChatBox
                      roomId={chat.roomId}
                      nickname={chat.users[0].nickname}
                      lastMsg={chat.lastMessage}
                      lastMsgTime={chat.lastMessageTime}
                      unreadCount={chat.unreadCount}
                    />
                  </div>
                );
              })
            ) : (
              <div className="h-full items-center">
                참여 중인 채팅이 없어요 !
              </div>
            )}
          </div>
        </div>
      ) : (
        <ChatRoom
          roomId={chatRoomId}
          setChatRoomId={setChatRoomId}
          nickname={chatNick}
        />
      )}
    </div>
  );
};

export default Chat;
