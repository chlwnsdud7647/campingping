export const CHAT = {
  ROOM: {
    CREATE: 'createRoom',
    CREATED: 'roomCreated',
    GET: 'getChatRooms',
    RECEIVE: 'chatRooms',
  },
  USER: {
    SEND: 'sendMessage',
    LEFT: 'userLeftRoom',
    READ: 'openChatRoom',
  },
  HISTORY: {
    FETCH: 'getChatHistory',
    FETCHED: 'chatHistory',
    NEW: 'newMessage',
    UPDATE: 'updateRead',
  },
};
