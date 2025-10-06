// contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Create Socket Context
const SocketContext = createContext();

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const initializeSocket = () => {
    const mockSocket = {
      connected: true,
      on: (event, callback) => {
        console.log(`Socket listener set for: ${event}`);
        if (event === 'connect') {
          setTimeout(() => {
            setIsConnected(true);
            callback();
          }, 100);
        }
      },
      emit: (event, data) => {
        console.log(`Socket emitting: ${event}`, data);
      },
      disconnect: () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      },
      joinChannel: (channelId) => {
        console.log(`Joining channel: ${channelId}`);
        mockSocket.emit('join-channel', channelId);
      },
      leaveChannel: (channelId) => {
        console.log(`Leaving channel: ${channelId}`);
        mockSocket.emit('leave-channel', channelId);
      }
    };

    setSocket(mockSocket);
    
    setTimeout(() => {
      setIsConnected(true);
      mockSocket.on('connect', () => {});
    }, 500);
  };

  const emitEvent = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected - cannot emit event:', event);
    }
  };

  const listenToEvent = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
    
    return () => {
      if (socket) {
        console.log(`Cleaning up listener for: ${event}`);
      }
    };
  };

  const joinChannel = (channelId) => {
    if (socket && isConnected) {
      socket.joinChannel(channelId);
    }
  };

  const leaveChannel = (channelId) => {
    if (socket && isConnected) {
      socket.leaveChannel(channelId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    }
  };

  const sendDirectMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send-direct-message', messageData);
    }
  };

  const value = {
    socket,
    isConnected,
    emitEvent,
    listenToEvent,
    joinChannel,
    leaveChannel,
    sendMessage,
    sendDirectMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;