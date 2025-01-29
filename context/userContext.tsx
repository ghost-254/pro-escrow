// context/UserContext.tsx
import React, { createContext, useContext } from "react";
import * as userService from "../services/userService";

// Define the context type
export interface UserContextProps {
  fetchUsers: typeof userService.fetchUsers;
  fetchUserById: typeof userService.fetchUserById;
  addUser: typeof userService.addUser;
  updateUser: typeof userService.updateUser;
  deleteUser: typeof userService.deleteUser;
  loginUser: typeof userService.loginUser;
  logoutUser: typeof userService.logoutUser;
}

// Create context
export const UserContext = createContext<UserContextProps | undefined>(undefined);

// Provide context
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserContext.Provider value={userService}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook
export const useApi = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
