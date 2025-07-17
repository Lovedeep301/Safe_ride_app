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
  private conversations: Conversation[] = [
    {
      id: 'conv1',
      type: 'group',
      name: 'Downtown Cab Group',
      participants: ['emp001', 'emp002', 'emp003', 'driver001'],
      unreadCount: 0
    },
    {
      id: 'conv2',
      type: 'group',
      name: 'Westside Cab Group',
      participants: ['emp004', 'emp005', 'driver002'],
      unreadCount: 0
    },
    {
      id: 'conv3',
      type: 'direct',
      name: 'Admin Support',
      participants: ['emp001', 'admin001'],
      unreadCount: 0
    }
  ];

  private messages: Message[] = [
    {
      id: 'msg1',
      senderId: 'driver001',
      senderName: 'Michael Rodriguez',
      content: 'Good morning everyone! I\'ll be at the pickup point in 10 minutes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: 'group',
      isRead: false
    },
    {
      id: 'msg2',
      senderId: 'emp001',
      senderName: 'Alice Johnson',
      content: 'Thanks for the update! I\'m already at the pickup point.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      type: 'group',
      isRead: false
    }
  ];

  async getConversations(): Promise<Conversation[]> {
    try {
      const { AuthService } = await import('./AuthService');
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) return this.getMockConversations();
      
      const firebaseConversations = await FirebaseMessageService.getConversations(currentUser.id);
      return this.convertFirebaseConversations(firebaseConversations);
    } catch (error) {
      console.warn('Firebase conversations not available, using local data:', error);
      return this.getMockConversations();
    }
  }

  async getDriverConversations(): Promise<Conversation[]> {
    const allConversations = await this.getConversations();
    return allConversations.filter(conv => 
      conv.type === 'group' || 
      conv.type === 'emergency'
    );
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const firebaseMessages = await FirebaseMessageService.getMessages(conversationId);
      return this.convertFirebaseMessages(firebaseMessages);
    } catch (error) {
      console.warn('Firebase messages not available, using local data:', error);
      return this.getMockMessages(conversationId);
    }
  }

  async sendMessage(conversationId: string, content: string, senderId: string, senderName: string): Promise<Message> {
    try {
      const firebaseMessage = await FirebaseMessageService.sendMessage(
        conversationId,
        content,
        senderId,
        senderName
      );
      return this.convertFirebaseMessage(firebaseMessage);
    } catch (error) {
      console.warn('Firebase send message not available, using local storage:', error);
      return this.sendMockMessage(conversationId, content, senderId, senderName);
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await FirebaseMessageService.markAsRead(conversationId, userId);
    } catch (error) {
      console.warn('Firebase mark as read not available:', error);
      // Update local messages
      this.messages
        .filter(m => m.senderId !== userId)
        .forEach(m => m.isRead = true);
    }
  }

  async createDirectConversation(currentUserId: string, targetUserId: string, targetUserName: string): Promise<Conversation> {
    try {
      const firebaseConversation = await FirebaseMessageService.createConversation({
        type: 'direct',
        name: targetUserName,
        participants: [currentUserId, targetUserId],
        unreadCount: 0
      });
      return this.convertFirebaseConversation(firebaseConversation);
    } catch (error) {
      console.warn('Firebase create conversation not available, using local storage:', error);
      return this.createMockDirectConversation(currentUserId, targetUserId, targetUserName);
    }
  }

  async createEmergencyConversation(userId: string): Promise<Conversation> {
    try {
      const firebaseConversation = await FirebaseMessageService.createConversation({
        type: 'emergency',
        name: 'Emergency Support',
        participants: [userId, 'admin001'],
        unreadCount: 0
      });
      return this.convertFirebaseConversation(firebaseConversation);
    } catch (error) {
      console.warn('Firebase emergency conversation not available, using local storage:', error);
      return this.createMockEmergencyConversation(userId);
    }
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
    const { AuthService } = require('./AuthService');
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return [];

    // Filter conversations by user participation
    const userConversations = this.conversations.filter(conv => 
      conv.participants.includes(currentUser.id)
    );

    // Add last messages
    return userConversations.map(conv => {
      const convMessages = this.messages.filter(m => 
        conv.participants.includes(m.senderId)
      ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return {
        ...conv,
        lastMessage: convMessages[0],
        unreadCount: convMessages.filter(m => !m.isRead && m.senderId !== currentUser.id).length
      };
    });
  }

  private getMockMessages(conversationId: string): Message[] {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return [];

    // Return messages from participants in this conversation
    return this.messages
      .filter(m => conversation.participants.includes(m.senderId))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private async sendMockMessage(conversationId: string, content: string, senderId: string, senderName: string): Promise<Message> {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
      type: 'group',
      isRead: false
    };

    this.messages.push(newMessage);
    return newMessage;
  }

  private async createMockDirectConversation(currentUserId: string, targetUserId: string, targetUserName: string): Promise<Conversation> {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      type: 'direct',
      name: targetUserName,
      participants: [currentUserId, targetUserId],
      unreadCount: 0
    };

    this.conversations.push(newConversation);
    return newConversation;
  }

  private async createMockEmergencyConversation(userId: string): Promise<Conversation> {
    const newConversation: Conversation = {
      id: `emergency_${Date.now()}`,
      type: 'emergency',
      name: 'Emergency Support',
      participants: [userId, 'admin001'],
      unreadCount: 0
    };

    this.conversations.push(newConversation);
    return newConversation;
  }
}

export const MessageService = new MessageServiceClass();