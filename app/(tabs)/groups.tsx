import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { Users, MapPin, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { GroupService, Group, GroupMember } from '@/services/GroupService';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    loadUserGroups();
  }, []);

  const loadUserGroups = async () => {
    if (!user) return;
    
    try {
      const userGroups = await GroupService.getUserGroups(user.id);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const openGroupDetails = async (group: Group) => {
    setSelectedGroup(group);
    try {
      const members = await GroupService.getGroupMembers(group.id);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'absent': return '#6B7280';
      default: return '#EF4444';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      default: return AlertCircle;
    }
  };

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => openGroupDetails(item)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <Users size={24} color="#2563EB" />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDescription}>{item.description}</Text>
        </View>
        <ArrowRight size={20} color="#9CA3AF" />
      </View>

      <View style={styles.groupDetails}>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.pickupLocation}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.pickupTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.members.length} members</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item }: { item: GroupMember }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <View style={styles.memberStatus}>
            <StatusIcon size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status === 'confirmed' ? 'Arrived Home' : 
               item.status === 'pending' ? 'In Transit' : 'Absent'}
            </Text>
          </View>
          {item.arrivalTime && (
            <Text style={styles.arrivalTime}>
              Arrived at {item.arrivalTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (selectedGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedGroup(null)}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{selectedGroup.name}</Text>
          <Text style={styles.headerSubtitle}>{selectedGroup.description}</Text>
        </View>

        <View style={styles.groupDetailsCard}>
          <View style={styles.detailRow}>
            <MapPin size={20} color="#2563EB" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{selectedGroup.pickupLocation}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={20} color="#2563EB" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Time</Text>
              <Text style={styles.detailValue}>{selectedGroup.pickupTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          <FlatList
            data={groupMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMemberItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <Text style={styles.headerSubtitle}>Your cab groups and current status</Text>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Groups Yet</Text>
          <Text style={styles.emptyDescription}>
            You haven't been added to any cab groups yet. Contact your administrator to join a group.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupCard}
          style={styles.groupsList}
          contentContainerStyle={styles.groupsContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  groupsList: {
    flex: 1,
  },
  groupsContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  groupDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  groupDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  groupDetailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 2,
  },
  membersSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  memberItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 6,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  arrivalTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});