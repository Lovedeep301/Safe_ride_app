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
  private messages: Message[] = [
    {
      id: '1',
      senderId: 'emp002',
      senderName: 'Bob Smith',
      content: 'Hey, are we still taking the same cab today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'group',
      groupId: 'group1',
      isRead: false
    },
    {
      id: '2',
      senderId: 'emp003',
      senderName: 'Carol Davis',
      content: 'Yes, pickup at 8:30 AM as usual',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      type: 'group',
      groupId: 'group1',
      isRead: false
    },
    {
      id: '3',
      senderId: 'emp004',
      senderName: 'David Brown',
      content: 'Can we chat about the quarterly reports?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'direct',
      isRead: true
    },
    {
      id: '4',
      senderId: 'driver001',
      senderName: 'Michael Rodriguez',
      content: 'Running 5 minutes late due to traffic. Please wait at pickup point.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      type: 'group',
      groupId: 'group1',
      isRead: false
    }
  ];

  private conversations: Conversation[] = [
    {
      id: 'conv1',
      type: 'group',
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
        type: 'group',
        groupId: 'group1',
        isRead: false
      }
    },
    {
      id: 'conv2',
      type: 'direct',
      name: 'David Brown',
      participants: ['emp001', 'emp004'],
      unreadCount: 0,
      lastMessage: {
        id: '3',
        senderId: 'emp004',
        senderName: 'David Brown',
        content: 'Can we chat about the quarterly reports?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        type: 'direct',
        isRead: true
      }
    },
    {
      id: 'conv3',
      type: 'emergency',
      name: 'Emergency Support',
      participants: ['driver001', 'admin001'],
      unreadCount: 0,
      lastMessage: {
        id: '5',
        senderId: 'admin001',
        senderName: 'Admin Support',
        content: 'Emergency support is available 24/7. How can we help?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        type: 'emergency',
        isRead: true
      }
    }
  ];

  async getConversations(): Promise<Conversation[]> {
    return [...this.conversations].sort((a, b) => {
      const aTime = a.lastMessage?.timestamp.getTime() || 0;
      const bTime = b.lastMessage?.timestamp.getTime() || 0;
      return bTime - aTime;
    });
  }

  async getDriverConversations(): Promise<Conversation[]> {
    // Filter conversations relevant to drivers
    return this.conversations.filter(conv => 
      conv.type === 'group' || 
      conv.type === 'emergency' || 
      conv.participants.some(p => p.startsWith('driver'))
    ).sort((a, b) => {
      const aTime = a.lastMessage?.timestamp.getTime() || 0;
      const bTime = b.lastMessage?.timestamp.getTime() || 0;
      return bTime - aTime;
    });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return [];

    return this.messages
      .filter(m => {
        if (conversation.type === 'group') {
          return m.groupId === conversation.groupId;
        } else {
          return conversation.participants.includes(m.senderId);
        }
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async sendMessage(conversationId: string, content: string, senderId: string, senderName: string): Promise<Message> {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
      type: conversation.type,
      groupId: conversation.groupId,
      isRead: false
    };

    this.messages.push(newMessage);
    
    // Update conversation last message
    conversation.lastMessage = newMessage;
    conversation.unreadCount = conversation.participants
      .filter(p => p !== senderId)
      .length;

    return newMessage;
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Mark messages as read
    this.messages
      .filter(m => {
        if (conversation.type === 'group') {
          return m.groupId === conversation.groupId && m.senderId !== userId;
        } else {
          return conversation.participants.includes(m.senderId) && m.senderId !== userId;
        }
      })
      .forEach(m => m.isRead = true);

    // Update conversation unread count
    conversation.unreadCount = 0;
  }

  async createDirectConversation(currentUserId: string, targetUserId: string, targetUserName: string): Promise<Conversation> {
    const existingConv = this.conversations.find(c => 
      c.type === 'direct' && 
      c.participants.includes(currentUserId) && 
      c.participants.includes(targetUserId)
    );

    if (existingConv) return existingConv;

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

  async createEmergencyConversation(userId: string): Promise<Conversation> {
    const existingConv = this.conversations.find(c => 
      c.type === 'emergency' && 
      c.participants.includes(userId)
    );

    if (existingConv) return existingConv;

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