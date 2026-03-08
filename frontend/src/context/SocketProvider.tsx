import { type ReactNode } from 'react';
import { socket, SocketContext } from './SocketContext';

export default function SocketProvider({ children }: { children: ReactNode }) {
  return (
    <SocketContext value={socket}>
      {children}
    </SocketContext>
  );
}