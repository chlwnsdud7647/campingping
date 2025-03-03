'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '@/socket';
import { toast } from 'react-toastify';

import { CHAT } from '@/constants/chat/chatEvents';

import Button from '@/components/Button/Button';
import MyChatMsg from './MyChatMsg';
import UrChatMsg from './UrChatMsg';

import profileGreen from '@icons/profile_green.svg';

import { ChatHistoryData, ChatMsgs } from '@/types/Chatting';

import { userStore } from '@/stores/userState';
import { chattingStore } from '@/stores/chattingState';
import useInputValue from '@/hooks/useInputValue';
import { useIsMobile } from '@/hooks/useIsMobile';

import useChat from '@/hooks/chat/useChat';

interface ChatRoomProps {
  roomId: number;
  setChatRoomId: (v: number | null) => void;
  nickname: string;
}

const ChatRoom = ({ nickname, setChatRoomId }: ChatRoomProps) => {
  const { userEmail } = userStore();
  const { chatRoomId } = chattingStore();
  const { isMobile } = useIsMobile();

  const [chatMsgs, setChatMsgs] = useState<ChatMsgs[]>([]);

  const {
    setNextCursor,
    nextCursor,
    getChatHistory,
    newMessageHandler,
    sendChatMsg,
    updateRead,
    getOutFromRoom,
  } = useChat();

  const isInitial = useRef<boolean>(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatMsgsRef = useRef<ChatMsgs[]>([]);
  const isNewMessage = useRef(true);

  const [inputValue, handleInputChange, resetInput] = useInputValue();

  const [hasScrolled, setHasScrolled] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!chatRoomId) return;
    getChatHistory(setChatMsgs);
  }, []);

  useEffect(() => {
    socket.on(CHAT.HISTORY.NEW, newMessageHandler);

    return () => {
      socket.off(CHAT.HISTORY.NEW, newMessageHandler);
    };
  }, [newMessageHandler]);

  // useEffect(() => {
  //   const handleNewmassage = async () => {
  //     isNewMessage.current = true;
  //     socket.on(CHAT.HISTORY.NEW, newMessageHandler);

  //     return () => {
  //       socket.off(CHAT.HISTORY.NEW, newMessageHandler);
  //     };
  //   };

  //   handleNewmassage();
  //   isNewMessage.current = false;
  // }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }

    isInitial.current = false;
  }, []);

  const handleSendMessage = async () => {
    if (chatRoomId !== null) {
      sendChatMsg(inputValue, chatRoomId, isNewMessage);
      resetInput();
    } else {
      console.error('Chat room ID is null.');
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue && chatRoomId !== null) {
        if (e.nativeEvent.isComposing) {
          e.stopPropagation();
          return;
        }

        const messageToSend = inputValue;

        sendChatMsg(messageToSend, chatRoomId, isNewMessage);

        resetInput();
      }
    }
  };

  useEffect(() => {
    chatMsgsRef.current = chatMsgs;
  }, [chatMsgs]);

  const handleGetChatting = ({ chatHistory, nextCursor }: ChatHistoryData) => {
    if (isInitial) {
      // console.log('check');

      setChatMsgs(() => {
        const currentMsgs = chatMsgsRef.current;

        const existingMsgIds = new Set(currentMsgs.map((msg) => msg.id));
        const filteredNewMsgs = chatHistory.filter(
          (msg) => !existingMsgIds.has(msg.id)
        );

        const updatedMsgs = [...filteredNewMsgs, ...currentMsgs];

        return updatedMsgs;
      });

      setNextCursor(nextCursor ?? null);

      if (chatContainerRef.current) {
        const currentScrollHeight = chatContainerRef.current.scrollHeight;
        chatContainerRef.current.scrollTo({
          top: currentScrollHeight * 0.08,
          // behavior: 'smooth',
        });
      }
    }
  };

  useEffect(() => {
    if (!chatContainerRef.current) return;
    if (!isNewMessage) return;

    const container = chatContainerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMsgs]);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;

    const { scrollTop } = chatContainerRef.current;

    if (scrollTop === 0 && nextCursor) {
      if (debounceTimeout.current) return;
      debounceTimeout.current = setTimeout(() => {
        isNewMessage.current = false;
        socket.emit(CHAT.HISTORY.FETCH, {
          roomId: chatRoomId,
          cursor: nextCursor,
        });

        socket.on(CHAT.HISTORY.FETCHED, handleGetChatting);

        setTimeout(() => {
          debounceTimeout.current = null;
        }, 100);
      }, 300);
    }
  }, [chatRoomId, nextCursor]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    if (chatContainerRef.current && hasScrolled && nextCursor) {
      socket.emit(CHAT.HISTORY.FETCH, {
        roomId: chatRoomId,
        cursor: nextCursor,
      });

      const handleChatHistory = (data: ChatHistoryData) => {
        handleGetChatting(data);
      };

      socket.on(CHAT.HISTORY.FETCH, handleChatHistory);

      setHasScrolled(false);

      return () => {
        socket.off(CHAT.HISTORY.FETCHED, handleChatHistory);
      };
    }

    if (!isInitial.current) {
      setTimeout(() => {
        isInitial.current = true;
      }, 1000);
    }
  }, [hasScrolled, nextCursor, chatRoomId, handleGetChatting]);

  socket.on(CHAT.HISTORY.UPDATE, updateRead);

  const userLeft = () => {
    setClosed(true);
  };

  socket.on(CHAT.USER.LEFT, userLeft);

  return (
    <div className="relative h-full flex flex-col pb-12">
      <div className="mt-1 ">
        <div className="px-6 pt-1 pb-2 flex gap-1 justify-between border-b border-Green">
          <div className="flex gap-1">
            <Image
              src={profileGreen}
              width={20}
              alt="프로필 아이콘"
              quality={10}
            />
            <div className="items-baseline ">
              <span className="text-bold mr-1 text-[20px]">{nickname}</span>
              <span className="text-description text-Gray">님과의 대화</span>
            </div>
          </div>

          <button
            className="text-Green"
            onClick={closed ? () => setChatRoomId(null) : getOutFromRoom}
          >
            대화 나가기
          </button>
        </div>
      </div>
      <div
        className={`overflow-auto ${isMobile ? 'h-3/5' : 'h-5/6'} `}
        ref={chatContainerRef}
      >
        {chatMsgs?.map((chat) => {
          return chat.author.email === userEmail ? (
            <MyChatMsg
              key={chat.id}
              message={chat.message}
              createdAt={chat.createdAt}
              isRead={chat.isRead}
            />
          ) : (
            <UrChatMsg
              key={chat.id}
              message={chat.message}
              createdAt={chat.createdAt}
              nickname={chat.author.nickname}
            />
          );
        })}

        {closed && (
          <div className="flex justify-center">
            <div className="flex justify-center items-center bg-LightGray rounded-2xl text-white px-3 py-1 my-4">
              상대방이 채팅을 떠났습니다
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-Green w-full h-32 flex justify-center items-center gap-3 p-4">
        <textarea
          placeholder="채팅을 입력하세요"
          className="w-full h-24 outline-none	px-1 resize-none rounded-lg"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleEnter}
          disabled={closed}
        ></textarea>
        <Button height="h-24" onClick={handleSendMessage}>
          전송
        </Button>
      </div>
    </div>
  );
};

export default ChatRoom;
