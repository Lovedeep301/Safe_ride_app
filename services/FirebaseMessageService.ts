import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Message, Conversation } from './MessageService';

export interface FirebaseMessage extends Omit<Message, 'timestamp'> {
  timestamp: any; // Firestore timestamp
  conversationId: string;
}

export interface FirebaseConversation extends Omit<Conversation, 'lastMessage'> {
  lastMessage?: FirebaseMessage;
  createdAt: any;
  updatedAt: any;
}

class FirebaseMessageServiceClass {
  async sendMessage(
    conversationId: string,
    content: string,
    senderId: string,
    senderName: string,
    type: 'direct' | 'group' | 'emergency' = 'direct'
  ): Promise<FirebaseMessage> {
    try {
      const messageData = {
        senderId,
        senderName,
        content,
        timestamp: serverTimestamp(),
        type,
        conversationId,
        isRead: false
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Update conversation's last message
      await this.updateConversationLastMessage(conversationId, {
        id: docRef.id,
        ...messageData,
        timestamp: new Date() // Use current date for immediate display
      } as FirebaseMessage);

      return {
        id: docRef.id,
        ...messageData,
        timestamp: new Date()
      } as FirebaseMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<FirebaseMessage[]> {
    try {
      const messagesRef = collection(db, 'messages');
      // Use simple query without orderBy to avoid index requirement
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId)
      );
      
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseMessage));
      
      // Sort in memory instead of using Firestore orderBy
      return messages.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return aTime - bTime;
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  subscribeToMessages(conversationId: string, callback: (messages: FirebaseMessage[]) => void) {
    const messagesRef = collection(db, 'messages');
    // Use simple query without orderBy to avoid index requirement
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId)
    );

    return onSnapshot(q, (snapshot) => {
      let messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseMessage));
      
      // Sort in memory instead of using Firestore orderBy
      messages = messages.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return aTime - bTime;
      });
      
      callback(messages);
    });
  }

  async createConversation(conversationData: Omit<FirebaseConversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirebaseConversation> {
    try {
      const docRef = await addDoc(collection(db, 'conversations'), {
        ...conversationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...conversationData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as FirebaseConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversations(userId: string): Promise<FirebaseConversation[]> {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseConversation));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  subscribeToConversations(userId: string, callback: (conversations: FirebaseConversation[]) => void) {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseConversation));
      callback(conversations);
    });
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc =>
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  private async updateConversationLastMessage(conversationId: string, message: FirebaseMessage): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: message,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation last message:', error);
    }
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const FirebaseMessageService = new FirebaseMessageServiceClass();