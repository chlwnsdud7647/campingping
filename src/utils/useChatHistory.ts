import { CHAT } from '@/constants/chat/chatEvents';
import { socket } from '@/socket';
import { chattingStore } from '@/stores/chattingState';
import { ChatHistoryData, ChatMsgs } from '@/types/Chatting';
import { useState, useEffect } from 'react';

export const useChatHistory = () => {
  const { chatRoomId } = chattingStore();
  const [chatMsgs, setChatMsgs] = useState<ChatMsgs[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null | undefined>(null);

  useEffect(() => {
    const getChatHistory = () => {
      socket.emit(CHAT.HISTORY.FETCH, { roomId: chatRoomId });

      socket.off(CHAT.HISTORY.NEW);
      socket.on(CHAT.HISTORY.NEW, getChatHistory);

      socket.on(
        CHAT.HISTORY.FETCHED,
        ({ chatHistory, nextCursor }: ChatHistoryData) => {
          setChatMsgs(chatHistory);
          if (typeof nextCursor === 'number') {
            setNextCursor(nextCursor);
          }
        }
      );
    };

    getChatHistory();

    return () => {
      socket.off(CHAT.HISTORY.NEW);
      socket.off(CHAT.HISTORY.FETCHED);
    };
  }, [chatRoomId]);

  return { chatMsgs, nextCursor };
};
