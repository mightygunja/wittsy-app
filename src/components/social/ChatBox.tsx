/**
 * ChatBox Component
 * In-game chat with messages, quick chat, emotes, and reactions
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { ChatMessage } from '../../types/social';
import {
  sendChatMessage,
  sendQuickChat,
  sendEmote,
  addReaction,
  removeReaction,
  subscribeToChatMessages,
  QUICK_CHAT_OPTIONS,
  EMOTES,
} from '../../services/chat';
import { SPACING } from '../../utils/constants'
import { useTheme } from '../../hooks/useTheme';;

interface ChatBoxProps {
  roomId: string;
  userId: string;
  username: string;
  compact?: boolean;
  maxHeight?: number;
  userJoinedAt?: number; // Timestamp when user joined room
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  roomId,
  userId,
  username,
  compact = false,
  maxHeight = 400,
  userJoinedAt,
}) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  useEffect(() => { console.log(' showEmotes changed to:', showEmotes); }, [showEmotes]);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(compact ? 0 : 1)).current;

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(roomId, (newMessages) => {
      console.log('💬 ChatBox received messages:', newMessages.length, newMessages);
      
      // Filter messages to only show those after user joined
      const filteredMessages = userJoinedAt 
        ? newMessages.filter(msg => new Date(msg.timestamp).getTime() >= userJoinedAt)
        : newMessages;
      
      setMessages(filteredMessages);
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => unsubscribe();
  }, [roomId, userJoinedAt]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 65,
      friction: 8,
      velocity: 2,
    }).start();
  }, [isExpanded]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      await sendChatMessage(roomId, userId, username, inputText.trim());
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickChat = async (quickChatId: string) => {
    try {
      await sendQuickChat(roomId, userId, username, quickChatId);
      setShowQuickChat(false);
    } catch (error) {
      console.error('Error sending quick chat:', error);
    }
  };

  const handleEmote = async (emoteId: string) => {
    console.log(' User clicked emote:', emoteId);
    try {
      await sendEmote(roomId, userId, username, emoteId);
      setShowEmotes(false);
    } catch (error) {
      console.error('Error sending emote:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const hasReacted = message?.reactions?.[emoji]?.includes(userId);

      if (hasReacted) {
        await removeReaction(roomId, messageId, userId, emoji);
      } else {
        await addReaction(roomId, messageId, userId, emoji);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.userId === userId;
    const isSystem = message.type === 'system';
    const isEmote = message.type === 'emote';

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <Text style={styles.messageUsername}>{message.username}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            isEmote && styles.emoteBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              isEmote && styles.emoteText,
            ]}
          >
            {message.content}
          </Text>
        </View>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <View style={styles.reactionsContainer}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionBubble,
                  userIds.includes(userId) && styles.reactionBubbleActive,
                ]}
                onPress={() => handleReaction(message.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{userIds.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add Reaction Button */}
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={() => {
            // Show reaction picker for this message
            // For now, just add a thumbs up
            handleReaction(message.id, '👍');
          }}
        >
          <Text style={styles.addReactionText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const chatHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });

  const buttonOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const chatOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (compact && !isExpanded) {
    // Show floating button when collapsed
    return (
      <Animated.View style={[styles.floatingButton, { opacity: buttonOpacity }]}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setIsExpanded(true)}
        >
          <Text style={styles.chatButtonIcon}>💬</Text>
          {messages.length > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{messages.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { height: chatHeight, opacity: chatOpacity }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => compact && setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerTitle}>💬 Chat</Text>
        <View style={styles.headerActions}>
          <Text style={styles.messageCount}>{messages.length}</Text>
          {compact && (
            <Text style={styles.expandIcon}>✕</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Messages */}
      {isExpanded && (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
          </ScrollView>

          {/* Input Area - Fixed at bottom, doesn't cover messages */}
          <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  console.log('💬 Quick chat button pressed!');
                  setShowQuickChat(true);
                }}
              >
                <Text style={styles.iconButtonText}>💬</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => { 
                  console.log('😊 Emote button pressed!'); 
                  setShowEmotes(true); 
                }}
              >
                <Text style={styles.iconButtonText}>😊</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textTertiary}
                value={inputText}
                onChangeText={(text) => {
                  console.log('⌨️ Chat input changed:', text);
                  setInputText(text);
                }}
                onFocus={() => {
                  // Scroll to latest message when keyboard appears so the input stays visible
                  setTimeout(() => scrollToBottom(), 150);
                }}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                maxLength={200}
              />

              {inputText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setInputText('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
        </>
      )}

      {/* Quick Chat Modal */}
      <Modal
        visible={showQuickChat}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuickChat(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickChat(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Chat</Text>
              <TouchableOpacity onPress={() => setShowQuickChat(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.quickChatList}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {['greeting', 'reaction', 'strategy', 'emotion'].map(category => (
                <View key={category} style={styles.quickChatCategory}>
                  <Text style={styles.quickChatCategoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  {QUICK_CHAT_OPTIONS.filter(opt => opt.category === category).map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.quickChatOption}
                      onPress={() => handleQuickChat(option.id)}
                    >
                      <Text style={styles.quickChatEmoji}>{option.emoji}</Text>
                      <Text style={styles.quickChatText}>{option.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Emotes Modal */}
      <Modal
        visible={showEmotes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmotes(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmotes(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emotes</Text>
              <TouchableOpacity onPress={() => setShowEmotes(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.emotesList}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.emotesGrid}>
                {EMOTES.filter(e => !e.premium && !e.unlockCondition).map(emote => (
                  <TouchableOpacity
                    key={emote.id}
                    style={styles.emoteButton}
                    onPress={() => handleEmote(emote.id)}
                  >
                    <Text style={styles.emoteEmoji}>{emote.emoji}</Text>
                    <Text style={styles.emoteName}>{emote.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Premium Emotes */}
              <Text style={styles.emotesSectionTitle}>Premium 👑</Text>
              <View style={styles.emotesGrid}>
                {EMOTES.filter(e => e.premium).map(emote => (
                  <TouchableOpacity
                    key={emote.id}
                    style={[styles.emoteButton, styles.premiumEmote]}
                    onPress={() => handleEmote(emote.id)}
                  >
                    <Text style={styles.emoteEmoji}>{emote.emoji}</Text>
                    <Text style={styles.emoteName}>{emote.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Unlockable Emotes */}
              <Text style={styles.emotesSectionTitle}>Unlockable 🔒</Text>
              <View style={styles.emotesGrid}>
                {EMOTES.filter(e => e.unlockCondition).map(emote => (
                  <TouchableOpacity
                    key={emote.id}
                    style={[styles.emoteButton, styles.lockedEmote]}
                    disabled
                  >
                    <Text style={styles.emoteEmoji}>{emote.emoji}</Text>
                    <Text style={styles.emoteName}>{emote.name}</Text>
                    <Text style={styles.unlockCondition}>{emote.unlockCondition}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.text,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesContent: {
    padding: SPACING.sm,
  },
  messageContainer: {
    marginBottom: SPACING.sm,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageUsername: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '100%',
    overflow: 'visible',
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  emoteBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    minWidth: 50,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.text,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  emoteText: {
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },
  systemMessage: {
    alignSelf: 'center',
    marginVertical: SPACING.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionBubbleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  addReactionButton: {
    marginTop: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addReactionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 80,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    minHeight: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  quickChatList: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  quickChatCategory: {
    padding: SPACING.md,
  },
  quickChatCategoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  quickChatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  quickChatEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  quickChatText: {
    fontSize: 14,
    color: COLORS.text,
  },
  emotesList: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  emotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emoteButton: {
    width: 80,
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
  },
  premiumEmote: {
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  lockedEmote: {
    opacity: 0.5,
  },
  emoteEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emoteName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emotesSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  unlockCondition: {
    fontSize: 8,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  chatButtonIcon: {
    fontSize: 28,
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  chatBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});































