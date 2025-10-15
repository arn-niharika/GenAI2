// utils.tsx (or utils.ts)
import { useUser } from '@clerk/clerk-expo';


  export interface SideNavbarProps {
    chats: Chat[];
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onCreateChat: () => void;
    onEditChat: (chatId: string, newTitle: string) => void;
    onDeleteChat: (chatId: string) => void;
  }
  

  // Define Roles type
export type Roles = 'admin' | 'member';

  export enum UserRoleEnum {
    ADMIN = 0,
    USER = 1,
  }
  
  export interface User {
    id: string;
    name: string;
    email: string | null;
    role: UserRoleEnum;
    password: string;
    chats?: Chat[]; // Optional one-to-many relation
  }
  
  export interface Document {
    id: number;
    title: string;
    description: string;
    type: string;
    size: string;
    date: string;
  }
  
  export interface Chat {
    id: string;
    name?: string;
    userId: string;
    created_at?: Date; // Add created_at to match web app
    messages?: Message[];
  }
  
  // export interface Message {
  //   id: string;
  //   question: string;
  //   answer?: string | null;
  //   q_timestamp: string; // Use q_timestamp instead of createdAt
  //   a_timestamp: string; // Add a_timestamp
  //   isFeedbackGiven: boolean;
  //   feedback?: string;
  //   chatId: string;
  // }

  export interface Message {
    id: string;
    question: string;
    answer?: string | null;
    q_timestamp: string; // Use q_timestamp instead of createdAt
    a_timestamp: string; // Add a_timestamp
    isFeedbackGiven: boolean;
    feedback?: string;
    chatId: string;
    orderline_json?: any; // Add support for order table data
    previous_json?: any; // Add support for previous version data
  }
  
  // Role-checking function
export const checkRole = (role: Roles): boolean => {
  const { user } = useUser();

  if (!user) return false; // No user, no role check

  const userRole = user.publicMetadata?.role as Roles | undefined;
  // console.log('User Role: ---------->', userRole);

  return userRole === role;
};

// Optional: Helper to map UserRoleEnum to Roles
export const mapEnumToRole = (roleEnum: UserRoleEnum): Roles => {
  return roleEnum === UserRoleEnum.ADMIN ? 'admin' : 'member';
};
