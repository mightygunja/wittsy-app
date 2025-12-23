/**
 * ChatBox Component
 * In-game chat with messages, quick chat, emotes, and reactions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
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
  REACTIONS,
} from '../../services/chat';
import { COLORS, SPACING } from '../../utils/constants';

interface ChatBoxProps {
  roomId: string;
  userId: string;
  username: string;
  compact?: boolean;
  maxHeight?: number;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  roomId,
  userId,
  username,
  compact = false,
  maxHeight = 400,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(compact ? 0 : 1)).current;

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
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
    outputRange: [60, maxHeight],
  });

  return (
    <Animated.View style={[styles.container, { height: chatHeight }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => compact && setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerTitle}>💬 Chat</Text>
        <View style={styles.headerActions}>
          <Text style={styles.messageCount}>{messages.length}</Text>
          {compact && (
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▲'}</Text>
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

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowQuickChat(true)}
              >
                <Text style={styles.iconButtonText}>💬</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowEmotes(true)}
              >
                <Text style={styles.iconButtonText}>😊</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                maxLength={200}
              />

              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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

            <ScrollView style={styles.quickChatList}>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emotes</Text>
              <TouchableOpacity onPress={() => setShowEmotes(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.emotesList}>
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

const styles = StyleSheet.create({
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 24,
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
  },
  emotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emoteButton: {
    width: '30%',
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
});
