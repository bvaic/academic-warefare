import { createContext } from 'react';
import { io, Socket } from 'socket.io-client';

export const socket: Socket = io();
export const SocketContext = createContext<Socket | null>(null);