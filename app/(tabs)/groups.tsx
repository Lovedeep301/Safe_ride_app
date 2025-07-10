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
import { Users, MapPin, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, MessageCircle, ArrowRight } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { GroupService, Group, GroupMember } from '@/services/GroupService';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    loadUserGroups();
  }, []);

  const loadUserGroups = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userGroups = await GroupService.getUserGroups(user.id);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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

      <Text style={styles.routeText}>{item.route}</Text>
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
              Arrived at {formatTime(item.arrivalTime)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderGroupsList = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <Text style={styles.headerSubtitle}>
          Your cab groups and current status
        </Text>
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

  const renderGroupDetails = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedGroup(null)}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.groupTitleSection}>
          <Text style={styles.groupTitle}>{selectedGroup?.name}</Text>
          <Text style={styles.groupSubtitle}>{selectedGroup?.description}</Text>
        </View>

        <View style={styles.groupDetailsCard}>
          <View style={styles.detailRow}>
            <MapPin size={20} color="#2563EB" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{selectedGroup?.pickupLocation}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={20} color="#2563EB" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Time</Text>
              <Text style={styles.detailValue}>{selectedGroup?.pickupTime}</Text>
            </View>
          </View>

          <View style={styles.routeSection}>
            <Text style={styles.routeLabel}>Route</Text>
            <Text style={styles.routeValue}>{selectedGroup?.route}</Text>
          </View>
        </View>
      </View>

      <View style={styles.membersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          <TouchableOpacity style={styles.chatButton}>
            <MessageCircle size={20} color="#2563EB" />
            <Text style={styles.chatButtonText}>Group Chat</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={groupMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          style={styles.membersList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );

  return selectedGroup ? renderGroupDetails() : renderGroupsList();
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
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  groupsList: {
    flex: 1,
  },
  groupsContent: {
    paddingHorizontal: 24,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 8,
  },
  routeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
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
  detailsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
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
  groupTitleSection: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  groupSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  groupDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
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
  routeSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  routeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
    marginTop: 4,
  },
  membersSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginLeft: 6,
  },
  membersList: {
    flex: 1,
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
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  arrivalTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});