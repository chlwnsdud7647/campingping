import { SetStateAction } from 'react';
import { socket } from '@/socket';

export const onConnect = (
  setIsConnected: React.Dispatch<SetStateAction<boolean>>,
  setTransport: React.Dispatch<SetStateAction<string>>
) => {
  setIsConnected(true);
  setTransport(socket.io.engine.transport.name);

  socket.io.engine.on(
    'upgrade',
    (transport: { name: SetStateAction<string> }) => {
      setTransport(transport.name);
    }
  );
};

export const onDisconnect = (
  setIsConnected: React.Dispatch<SetStateAction<boolean>>,
  setTransport: React.Dispatch<SetStateAction<string>>
) => {
  setIsConnected(false);
  setTransport('N/A');
};
