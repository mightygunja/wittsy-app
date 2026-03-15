/**
 * Groups Screen
 * List user's groups, create a new group, or join via invite code
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Group } from '../types/social';
import {
  getUserGroups,
  joinGroupViaInviteCode,
} from '../services/groups';
import { SPACING } from '../utils/constants';

export const GroupsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors: COLORS } = useTheme();
  const { user, userProfile } = useAuth();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Join group modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Fallback: if navigated here directly with an inviteCode param, auto-join
  useEffect(() => {
    const inviteCode: string | undefined = route?.params?.inviteCode;
    if (!inviteCode || !user || !userProfile) return;
    const autoJoin = async () => {
      try {
        const result = await joinGroupViaInviteCode(inviteCode, user.uid, userProfile.username);
        if (result.success && result.groupId) {
          navigation.replace('GroupDetail', { groupId: result.groupId });
        } else {
          Alert.alert('Invalid Invite', result.error || 'This invite link is invalid or has expired.');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to join group');
      }
    };
    autoJoin();
  }, [route?.params?.inviteCode, user, userProfile]);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getUserGroups(user.uid);
      setGroups(result);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleJoinGroup = async () => {
    if (!user || !userProfile) return;
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    setJoining(true);
    try {
      const result = await joinGroupViaInviteCode(
        joinCode.trim(),
        user.uid,
        userProfile.username,
        userProfile.avatar
      );
      if (result.success && result.groupId) {
        setShowJoin(false);
        setJoinCode('');
        await loadGroups();
        navigation.navigate('GroupDetail', { groupId: result.groupId });
      } else {
        Alert.alert('Error', result.error || 'Failed to join group');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateGroup')}>
            <Text style={styles.createBtnText}>+ New Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a group with friends or join one using an invite code.
            </Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => navigation.navigate('CreateGroup')}>
              <Text style={styles.emptyCreateBtnText}>Create Your First Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              activeOpacity={0.8}
            >
              <View style={styles.groupIconCircle}>
                <Text style={styles.groupIconText}>{group.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                {!!group.description && (
                  <Text style={styles.groupDesc} numberOfLines={1}>{group.description}</Text>
                )}
                <Text style={styles.groupMeta}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.groupChevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Join Group Modal */}
      <Modal visible={showJoin} transparent animationType="slide" onRequestClose={() => { setShowJoin(false); Keyboard.dismiss(); }}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalDismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join Group</Text>
            <Text style={styles.modalSubtitle}>Enter the 6-character invite code shared by a group member.</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputCode]}
              placeholder="XXXXXX"
              placeholderTextColor={COLORS.textSecondary}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleJoinGroup}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => { setShowJoin(false); setJoinCode(''); Keyboard.dismiss(); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleJoinGroup}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
    headerActions: { flexDirection: 'row', gap: 8 },
    joinBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
    },
    joinBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
    createBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
    },
    createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    scroll: { flex: 1 },
    scrollContent: { padding: SPACING.lg, gap: 12 },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: SPACING.xl,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    emptyCreateBtn: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 24,
    },
    emptyCreateBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    groupCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: SPACING.md,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    groupIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupIconText: { color: '#fff', fontSize: 22, fontWeight: '700' },
    groupInfo: { flex: 1 },
    groupName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    groupDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    groupMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    groupChevron: { fontSize: 22, color: COLORS.textSecondary, marginLeft: 4 },
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalDismissArea: {
      flex: 1,
    },
    modalCard: {
      backgroundColor: COLORS.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: SPACING.xl,
      paddingBottom: 40,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
    modalInput: {
      backgroundColor: COLORS.background,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: COLORS.text,
      marginBottom: 12,
    },
    modalInputMultiline: { height: 80, textAlignVertical: 'top' },
    modalInputCode: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 6,
      textAlign: 'center',
    },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalBtnPrimary: { backgroundColor: COLORS.primary },
    modalBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    modalBtnSecondary: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
    modalBtnSecondaryText: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
  });
