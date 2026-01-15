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
  typingUser: null,

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
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [res.data, ...messages] });

      // Move selected user to top of the users list
      const updatedUsers = users
        .map((user) =>
          user._id === selectedUser._id
            ? { ...user, lastMessage: new Date() }
            : user
        )
        .sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage) : new Date(0);
          const timeB = b.lastMessage ? new Date(b.lastMessage) : new Date(0);
          return timeB - timeA;
        });

      set({ users: updatedUsers });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [newMessage, ...get().messages],
      });

      // Re-sort users - move the user who sent message to top
      const updatedUsers = get()
        .users.map((user) =>
          user._id === newMessage.senderId
            ? { ...user, lastMessage: new Date() }
            : user
        )
        .sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage) : new Date(0);
          const timeB = b.lastMessage ? new Date(b.lastMessage) : new Date(0);
          return timeB - timeA;
        });

      set({ users: updatedUsers });
    });

    socket.on("updateMessage", (updateMessage) => {
      set({
        messages: get().messages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      });
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        set({ typingUser: selectedUser });
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        set({ typingUser: null });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("updateMessage");
    socket.off("typing");
    socket.off("stopTyping");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
