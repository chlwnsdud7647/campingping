import { useCallback, useRef, useState } from 'react';
import { socket } from '@/socket';
import { ChatRooms, ChatMsgs, ChatHistoryData } from '@/types/Chatting';
import { chattingStore } from '@/stores/chattingState';
import { CHAT } from '@/constants/chat/chatEvents';
import { api } from '@/utils/axios';
import { toast } from 'react-toastify';

const useChat = () => {
  const { chatRoomId, setChatRoomId, setChatState } = chattingStore();

  const [nextCursor, setNextCursor] = useState<number | null | undefined>(null);
  const [newChat] = useState<ChatMsgs>();

  const chatMsgsRef = useRef<ChatMsgs[]>([]);
  const setChatMsgsRef = useRef<React.Dispatch<
    React.SetStateAction<ChatMsgs[]>
  > | null>(null);

  // rooms
  const getChatRooms = useCallback(
    (setChats: React.Dispatch<React.SetStateAction<ChatRooms[]>>) => {
      socket.emit(CHAT.ROOM.GET);

      socket.on(CHAT.ROOM.RECEIVE, (rooms: ChatRooms[]) => {
        setChats(rooms);
      });

      return () => {
        socket.off(CHAT.ROOM.RECEIVE);
      };
    },
    [chatRoomId]
  );

  const newRoom = (
    chats: ChatRooms[],
    setChats: React.Dispatch<React.SetStateAction<ChatRooms[]>>
  ) => {
    const newMsgId = newChat ? newChat.id : '';
    const roomExist = chats.some((chat) => chat.roomId === newMsgId);

    if (!roomExist) getChatRooms(setChats);
  };

  const closeChats = () => {
    setChatState(false);
    setChatRoomId(null);
  };

  // a room
  const getChatHistory = useCallback(
    (setChatMsgs: React.Dispatch<React.SetStateAction<ChatMsgs[]>>) => {
      if (!chatRoomId) return;

      socket.emit(CHAT.HISTORY.FETCH, {
        roomId: chatRoomId,
      });

      socket.on(
        CHAT.HISTORY.FETCHED,
        ({ chatHistory, nextCursor }: ChatHistoryData) => {
          setChatMsgs((prevMsgs) => [...chatHistory, ...prevMsgs]);
          setNextCursor(nextCursor);
        }
      );
    },
    [chatRoomId]
  );

  const registerSetChatMsgs = useCallback(
    (setChatMsgs: React.Dispatch<React.SetStateAction<ChatMsgs[]>>) => {
      setChatMsgsRef.current = setChatMsgs;
    },
    []
  );

  const newMessageHandler = useCallback((newMessage: ChatMsgs) => {
    if (setChatMsgsRef.current) {
      setChatMsgsRef.current((prevMsgs) => {
        const updatedMsgs = [...prevMsgs, newMessage];
        chatMsgsRef.current = updatedMsgs;
        return updatedMsgs;
      });
    }
  }, []);

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

  const updateRead = (
    chatMsgs: ChatMsgs[],
    setChatMsgs: React.Dispatch<React.SetStateAction<ChatMsgs[]>>
  ) => {
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
    getChatRooms,
    newRoom,
    closeChats,

    nextCursor,
    setNextCursor,
    newChat,
    getChatHistory,
    newMessageHandler,
    sendChatMsg,
    updateRead,
    getOutFromRoom,
  };
};

export default useChat;
