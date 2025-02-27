import { useCallback, useState } from 'react';
import { socket } from '@/socket';
import { ChatRooms, ChatMsgs, ChatHistoryData } from '@/types/Chatting';
import { chattingStore } from '@/stores/chattingState';
import { CHAT } from '@/constants/chat/chatEvents';
import { api } from '@/utils/axios';
import { toast } from 'react-toastify';

const useChat = () => {
  const { chatRoomId, setChatRoomId, setChatState } = chattingStore();

  const [chats, setChats] = useState<ChatRooms[]>([]);

  const [chatMsgs, setChatMsgs] = useState<ChatMsgs[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null | undefined>(null);
  const [newChat] = useState<ChatMsgs>();

  // rooms
  const getChatRooms = useCallback(() => {
    socket.emit(CHAT.ROOM.GET);

    socket.on(CHAT.ROOM.RECEIVE, (rooms: ChatRooms[]) => {
      setChats(rooms);
    });

    return () => {
      socket.off(CHAT.ROOM.RECEIVE);
    };
  }, [chatRoomId]);

  const newRoom = () => {
    const newMsgId = newChat ? newChat.id : '';
    const roomExist = chats.some((chat) => chat.roomId === newMsgId);

    if (!roomExist) getChatRooms();
  };

  const closeChats = () => {
    setChatState(false);
    setChatRoomId(null);
  };

  // a room
  const getChatHistory = () => {
    socket.emit(CHAT.HISTORY.FETCH, {
      roomId: chatRoomId,
    });

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

  const sendChatMsg = (
    inputValue: string,
    chatRoomId: number,
    isNewMessage: React.MutableRefObject<boolean>
  ) => {
    socket.emit(CHAT.USER.SEND, {
      message: inputValue,
      room: chatRoomId,
    });

    isNewMessage.current = true;
  };

  const updateRead = () => {
    const updatedChatHistory = chatMsgs?.map((chat) => ({
      ...chat,
      isRead: true,
    }));

    setChatMsgs(updatedChatHistory);
  };

  const getOutFromRoom = async () => {
    const res = await api.delete(`/chats/rooms/${chatRoomId}`);

    if (res.status === 200) {
      toast.success('채팅방이 삭제되었습니다 🚪');

      setChatRoomId(null);
    }
  };

  return {
    chats,
    getChatRooms,
    newRoom,
    closeChats,
    chatMsgs,
    setChatMsgs,
    nextCursor,
    setNextCursor,
    newChat,
    getChatHistory,
    sendChatMsg,
    updateRead,
    getOutFromRoom,
  };
};

export default useChat;
