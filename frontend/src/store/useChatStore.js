import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    console.group('Send Message Comprehensive Debug');
    try {
      const { selectedUser, messages } = get();
      
      // Comprehensive input validation
      if (!selectedUser) {
        console.error('No user selected for sending message', { messageData });
        toast.error('Please select a user to send message');
        console.groupEnd();
        return null;
      }

      // Validate message content
      if (!messageData || (!messageData.text && !messageData.image)) {
        console.error('Invalid message data', { messageData });
        toast.error('Message cannot be empty');
        console.groupEnd();
        return null;
      }

      console.log('Sending message details:', {
        userId: selectedUser._id,
        messageData,
        currentMessages: messages.length
      });

      // Perform message send
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Message send response:', {
        status: res.status,
        data: res.data
      });

      // Update messages state
      const updatedMessages = [...messages, res.data];
      set({ messages: updatedMessages });

      console.log('Updated messages count:', updatedMessages.length);
      console.groupEnd();

      return res.data;
    } catch (error) {
      console.error('Comprehensive Send Message Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        messageData
      });

      // Detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        toast.error(error.response.data.message || 'Failed to send message');
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Check your connection.');
      } else {
        // Something happened in setting up the request
        toast.error('Error preparing message send');
      }

      console.groupEnd();
      return null;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
