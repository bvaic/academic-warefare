import { use } from 'react';
import { Socket } from 'socket.io-client';
import { SocketContext } from './SocketContext';

export function useSocket(): Socket {
  const socket = use(SocketContext);
  if (!socket) throw new Error('useSocket must be used within a SocketProvider');
  return socket;
}