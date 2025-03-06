import { useCallback, useState } from 'react';
import { socket } from '@/socket';
import { ChatRooms, ChatMsgs, UpdateMsg } from '@/types/Chatting';
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
    socket.emit(CHAT.USER.READ, { roomId: chatRoomId });
  }, [chatRoomId]);

  const sendChatMsg = (inputValue: string, chatRoomId: number) => {
    socket.emit(CHAT.USER.SEND, {
      message: inputValue,
      room: chatRoomId,
    });
  };

  const updateRead = (
    data: UpdateMsg,
    chatMsgs: ChatMsgs[],
    setChatMsgs: React.Dispatch<React.SetStateAction<ChatMsgs[]>>
  ) => {
    if (!data.isRead) return;

    setChatMsgs((prev) =>
      prev.map((chat) =>
        chat.author.email === data.email ? { ...chat, isRead: true } : chat
      )
    );
  };

  const getOutFromRoom = async () => {
    const res = await api.delete(`/chats/rooms/${chatRoomId}`);

    if (res.status === 200) {
      toast.success('채팅방이 삭제되었습니다 🚪');

      setChatRoomId(null);
      getChatRooms();
    }
  };

  return {
    getChatRooms,

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
