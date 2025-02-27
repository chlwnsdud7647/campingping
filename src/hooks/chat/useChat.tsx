import { useCallback, useState } from 'react';
import { socket } from '@/socket';
import { ChatRooms, ChatMsgs } from '@/types/Chatting';
import { chattingStore } from '@/stores/chattingState';

const useChat = () => {
  const [chats, setChats] = useState<ChatRooms[]>([]);
  const { chatRoomId, setChatRoomId, setChatState } = chattingStore();
  const [newChat] = useState<ChatMsgs>();

  const getChatRooms = useCallback(() => {
    socket.emit('getChatRooms');

    socket.on('chatRooms', (rooms: ChatRooms[]) => {
      setChats(rooms);
    });

    return () => {
      socket.off('chatRooms');
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

  return { chats, getChatRooms, newRoom, closeChats };
};

export default useChat;
