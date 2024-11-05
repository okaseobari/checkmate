import { create } from "zustand";
import axiosInstance from "../services/axiosInstance";

const useStore = create((set, get) => ({
  contacts: [],
  schedule: [],
  loading: false,

  fetchContacts: async () => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get("/contact");
      set({ contacts: response.data });
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      set({ loading: false });
    }
  },

  addContact: async (contactData) => {
    try {
      const response = await axiosInstance.post("/contact", contactData);
      set((state) => ({ contacts: [...state.contacts, response.data] }));
      await get().fetchUserSchedule();
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  },

  updateContact: async (contactId, updatedData) => {
    try {
      await axiosInstance.put(`/contact/${contactId}`, updatedData);
      set((state) => ({
        contacts: state.contacts.map((contact) =>
          contact._id === contactId ? { ...contact, ...updatedData } : contact
        ),
      }));
      await get().fetchUserSchedule();
    } catch (error) {
      console.error("Failed to update contact:", error);
    }
  },

  deleteContact: async (contactId) => {
    try {
      await axiosInstance.delete(`/contact/${contactId}`);
      set((state) => ({
        contacts: state.contacts.filter((contact) => contact._id !== contactId),
      }));
      await get().fetchUserSchedule();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  },

  fetchUserSchedule: async () => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get("/schedule");
      set({ schedule: response.data });
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      set({ loading: false });
    }
  },

  setSchedule: (newSchedule) => set({ schedule: newSchedule }),
}));

export default useStore;
