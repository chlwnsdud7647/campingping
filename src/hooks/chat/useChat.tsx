import { useCallback, useState } from 'react';
import { socket } from '@/socket';
import { ChatRooms, ChatMsgs } from '@/types/Chatting';
import { chattingStore } from '@/stores/chattingState';
import { CHAT } from '@/constants/chat/chatEvents';
import { api } from '@/utils/axios';
import { toast } from 'react-toastify';

const useChat = () => {
  const { chatRoomId, setChatRoomId, setChatState } = chattingStore();

  const [nextCursor, setNextCursor] = useState<number | null | undefined>(null);
  const [newChat] = useState<ChatMsgs>();

  // rooms
  const getChatRooms = useCallback(() => {
    socket.emit(CHAT.ROOM.GET);
  }, [chatRoomId]);

  const newRoom = (chats: ChatRooms[]) => {
    if (!newChat || newChat.id) return;
    const newRoomId = newChat ? newChat.id : '';
    const roomExist = chats.some((chat) => chat.roomId === newRoomId);

    if (!roomExist) getChatRooms();
  };

  const closeChats = () => {
    setChatState(false);
    setChatRoomId(null);
  };

  // a room
  const getChatHistory = useCallback(() => {
    if (!chatRoomId) return;

    socket.emit(CHAT.HISTORY.FETCH, {
      roomId: chatRoomId,
    });
  }, [chatRoomId]);

  const sendChatMsg = (inputValue: string, chatRoomId: number) => {
    socket.emit(CHAT.USER.SEND, {
      message: inputValue,
      room: chatRoomId,
    });
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
    sendChatMsg,
    updateRead,
    getOutFromRoom,
  };
};

export default useChat;
