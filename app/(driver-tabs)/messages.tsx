import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { MessageCircle, Send, Users, Clock, ArrowLeft, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { MessageService, Conversation, Message } from '@/services/MessageService';
import { FirebaseMessageService } from '@/services/FirebaseMessageService';

export default function DriverMessages() {
  const [currentScreen, setCurrentScreen] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageSubscription, setMessageSubscription] = useState(null);
  const [conversationSubscription, setConversationSubscription] = useState(null);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (user) {
      try {
        const unsubscribe = FirebaseMessageService.subscribeToConversations(user.id, (firebaseConversations) => {
          const convertedConversations = firebaseConversations.map(conv => ({
            ...conv,
            lastMessage: conv.lastMessage ? {
              ...conv.lastMessage,
              timestamp: conv.lastMessage.timestamp?.toDate ? conv.lastMessage.timestamp.toDate() : new Date()
            } : undefined
          }));
          setConversations(convertedConversations);
        });
        setConversationSubscription(() => unsubscribe);
      } catch (error) {
        console.warn('Firebase real-time updates not available, loading local data');
        loadConversations();
      }
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const convs = await MessageService.getDriverConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setCurrentScreen('chat');

    if (messageSubscription) {
      messageSubscription();
      setMessageSubscription(null);
    }

    try {
      const unsubscribe = FirebaseMessageService.subscribeToMessages(conversation.id, (firebaseMessages) => {
        const convertedMessages = firebaseMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date()
        }));
        setMessages(convertedMessages);
      });
      setMessageSubscription(() => unsubscribe);
    } catch (error) {
      console.log('Firebase real-time messages not available, using manual refresh');
    }

    try {
      const msgs = await MessageService.getMessages(conversation.id);
      setMessages(msgs);
      if (user) {
        await MessageService.markAsRead(conversation.id, user.id);
        loadConversations();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    return () => {
      messageSubscription?.();
      conversationSubscription?.();
    };
  }, [messageSubscription, conversationSubscription]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setIsLoading(true);
    try {
      const message = await MessageService.sendMessage(
        selectedConversation.id,
        newMessage.trim(),
        user.id,
        user.name
      );

      if (!messageSubscription) {
        setMessages(prev => [...prev, message]);
      }
      setNewMessage('');

      if (!conversationSubscription) {
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (Platform.OS === 'web') {
        alert('Failed to send message. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity style={styles.conversationItem} onPress={() => openConversation(item)}>
      <View style={styles.conversationIcon}>
        {item.type === 'emergency' ? (
          <AlertTriangle size={24} color="#DC2626" />
        ) : item.type === 'group' ? (
          <Users size={24} color="#059669" />
        ) : (
          <MessageCircle size={24} color="#059669" />
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>{item.name}</Text>
          {item.lastMessage && (
            <Text style={styles.conversationTime}>{formatTime(item.lastMessage.timestamp)}</Text>
          )}
        </View>

        {item.lastMessage && (
          <Text style={styles.conversationPreview} numberOfLines={1}>
            {item.lastMessage.senderName}: {item.lastMessage.content}
          </Text>
        )}

        {item.type === 'emergency' && (
          <Text style={styles.emergencyLabel}>Emergency</Text>
        )}
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.senderId === user?.id ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  const renderConversationsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.conversationsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );

  const renderChatScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('conversations')}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.chatTitle}>{selectedConversation?.name}</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return currentScreen === 'conversations' ? renderConversationsScreen() : renderChatScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  conversationPreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emergencyLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  chatTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});