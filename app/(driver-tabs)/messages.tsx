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
        console.log('Firebase real-time updates not available, using polling');
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

  // renderMessage remains the same (already wrapped in <Text>)

  return currentScreen === 'conversations' ? renderConversationsScreen() : renderChatScreen();
}

const styles = StyleSheet.create({
  // your styles remain unchanged
});
