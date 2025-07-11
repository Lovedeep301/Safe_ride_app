import { FirebaseMessageService } from './FirebaseMessageService';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'direct' | 'group' | 'emergency';
  groupId?: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'emergency';
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  groupId?: string;
}

class MessageServiceClass {
  private useFirebase = true; // Toggle to use Firebase or mock data

  async getConversations(): Promise<Conversation[]> {
    if (this.useFirebase) {
      try {
        const { AuthService } = await import('./AuthService');
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];
        
        const firebaseConversations = await FirebaseMessageService.getConversations(currentUser.id);
        return this.convertFirebaseConversations(firebaseConversations);
      } catch (error) {
        console.error('Error fetching Firebase conversations:', error);
        return [];
      }
    }
    
    // Fallback to mock data
    return this.getMockConversations();
  }

  async getDriverConversations(): Promise<Conversation[]> {
    const allConversations = await this.getConversations();
    return allConversations.filter(conv => 
      conv.type === 'group' || 
      conv.type === 'emergency'
    );
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    if (this.useFirebase) {
      try {
        const firebaseMessages = await FirebaseMessageService.getMessages(conversationId);
        return this.convertFirebaseMessages(firebaseMessages);
      } catch (error) {
        console.error('Error fetching Firebase messages:', error);
        return [];
      }
    }
    
    // Fallback to mock data
    return this.getMockMessages(conversationId);
  }

  async sendMessage(conversationId: string, content: string, senderId: string, senderName: string): Promise<Message> {
    if (this.useFirebase) {
      try {
        const firebaseMessage = await FirebaseMessageService.sendMessage(
          conversationId,
          content,
          senderId,
          senderName
        );
        return this.convertFirebaseMessage(firebaseMessage);
      } catch (error) {
        console.error('Error sending Firebase message:', error);
        throw error;
      }
    }
    
    // Fallback to mock implementation
    return this.sendMockMessage(conversationId, content, senderId, senderName);
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    if (this.useFirebase) {
      try {
        await FirebaseMessageService.markAsRead(conversationId, userId);
      } catch (error) {
        console.error('Error marking Firebase messages as read:', error);
      }
    }
  }

  async createDirectConversation(currentUserId: string, targetUserId: string, targetUserName: string): Promise<Conversation> {
    if (this.useFirebase) {
      try {
        const firebaseConversation = await FirebaseMessageService.createConversation({
          type: 'direct',
          name: targetUserName,
          participants: [currentUserId, targetUserId],
          unreadCount: 0
        });
        return this.convertFirebaseConversation(firebaseConversation);
      } catch (error) {
        console.error('Error creating Firebase conversation:', error);
        throw error;
      }
    }
    
    // Fallback to mock implementation
    return this.createMockDirectConversation(currentUserId, targetUserId, targetUserName);
  }

  async createEmergencyConversation(userId: string): Promise<Conversation> {
    if (this.useFirebase) {
      try {
        const firebaseConversation = await FirebaseMessageService.createConversation({
          type: 'emergency',
          name: 'Emergency Support',
          participants: [userId, 'admin001'],
          unreadCount: 0
        });
        return this.convertFirebaseConversation(firebaseConversation);
      } catch (error) {
        console.error('Error creating Firebase emergency conversation:', error);
        throw error;
      }
    }
    
    // Fallback to mock implementation
    return this.createMockEmergencyConversation(userId);
  }

  // Conversion methods for Firebase data
  private convertFirebaseConversations(firebaseConversations: any[]): Conversation[] {
    return firebaseConversations.map(conv => this.convertFirebaseConversation(conv));
  }

  private convertFirebaseConversation(firebaseConv: any): Conversation {
    return {
      id: firebaseConv.id,
      type: firebaseConv.type,
      name: firebaseConv.name,
      participants: firebaseConv.participants,
      unreadCount: firebaseConv.unreadCount || 0,
      groupId: firebaseConv.groupId,
      lastMessage: firebaseConv.lastMessage ? this.convertFirebaseMessage(firebaseConv.lastMessage) : undefined
    };
  }

  private convertFirebaseMessages(firebaseMessages: any[]): Message[] {
    return firebaseMessages.map(msg => this.convertFirebaseMessage(msg));
  }

  private convertFirebaseMessage(firebaseMsg: any): Message {
    return {
      id: firebaseMsg.id,
      senderId: firebaseMsg.senderId,
      senderName: firebaseMsg.senderName,
      content: firebaseMsg.content,
      timestamp: firebaseMsg.timestamp?.toDate ? firebaseMsg.timestamp.toDate() : new Date(firebaseMsg.timestamp),
      type: firebaseMsg.type,
      groupId: firebaseMsg.groupId,
      isRead: firebaseMsg.isRead
    };
  }

  // Mock data methods (fallback)
  private getMockConversations(): Conversation[] {
    const mockConversations = [
      {
        id: 'conv1',
        type: 'group' as const,
        name: 'Downtown Cab Group',
        participants: ['emp001', 'emp002', 'emp003', 'driver001'],
        groupId: 'group1',
        unreadCount: 3,
        lastMessage: {
          id: '4',
          senderId: 'driver001',
          senderName: 'Michael Rodriguez',
          content: 'Running 5 minutes late due to traffic. Please wait at pickup point.',
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          type: 'group' as const,
          groupId: 'group1',
          isRead: false
        }
      }
    ];
    
    return mockConversations.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp.getTime() || 0;
      const bTime = b.lastMessage?.timestamp.getTime() || 0;
      return bTime - aTime;
    });
  }

  private getMockMessages(conversationId: string): Message[] {
    const mockMessages = [
      {
        id: '1',
        senderId: 'emp002',
        senderName: 'Bob Smith',
        content: 'Hey, are we still taking the same cab today?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'group' as const,
        groupId: 'group1',
        isRead: false
      }
    ];
    
    return mockMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private async sendMockMessage(conversationId: string, content: string, senderId: string, senderName: string): Promise<Message> {
    return {
      id: `msg_${Date.now()}`,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
      type: 'direct',
      isRead: false
    };
  }

  private async createMockDirectConversation(currentUserId: string, targetUserId: string, targetUserName: string): Promise<Conversation> {
    return {
      id: `conv_${Date.now()}`,
      type: 'direct',
      name: targetUserName,
      participants: [currentUserId, targetUserId],
      unreadCount: 0
    };
  }

  private async createMockEmergencyConversation(userId: string): Promise<Conversation> {
    return {
      id: `emergency_${Date.now()}`,
      type: 'emergency',
      name: 'Emergency Support',
      participants: [userId, 'admin001'],
      unreadCount: 0
    };
  }
}

export const MessageService = new MessageServiceClass();