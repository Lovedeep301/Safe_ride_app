export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
  pickupLocation: string;
  pickupTime: string;
  route: string;
}

export interface GroupMember {
  id: string;
  name: string;
  status: 'confirmed' | 'pending' | 'absent';
  arrivalTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

class GroupServiceClass {
  private groups: Group[] = [
    {
      id: 'group1',
      name: 'Downtown Cab Group',
      description: 'Daily commute from downtown area',
      members: ['emp001', 'emp002', 'emp003'],
      createdBy: 'admin001',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      pickupLocation: 'Downtown Transit Hub',
      pickupTime: '8:30 AM',
      route: 'Downtown → Office Complex'
    },
    {
      id: 'group2',
      name: 'Westside Cab Group',
      description: 'Westside pickup route',
      members: ['emp004', 'emp005'],
      createdBy: 'admin001',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      pickupLocation: 'Westside Mall',
      pickupTime: '9:00 AM',
      route: 'Westside → Office Complex'
    }
  ];

  async getUserGroups(userId: string): Promise<Group[]> {
    return this.groups.filter(group => group.members.includes(userId));
  }

  async getAllGroups(): Promise<Group[]> {
    return [...this.groups];
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    return this.groups.find(group => group.id === groupId) || null;
  }

  async createGroup(group: Omit<Group, 'id' | 'createdAt'>): Promise<Group> {
    const newGroup: Group = {
      ...group,
      id: `group_${Date.now()}`,
      createdAt: new Date()
    };

    this.groups.push(newGroup);
    return newGroup;
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group | null> {
    const groupIndex = this.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return null;

    this.groups[groupIndex] = { ...this.groups[groupIndex], ...updates };
    return this.groups[groupIndex];
  }

  async addMemberToGroup(groupId: string, memberId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group || group.members.includes(memberId)) return false;

    group.members.push(memberId);
    return true;
  }

  async removeMemberFromGroup(groupId: string, memberId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    group.members = group.members.filter(id => id !== memberId);
    return true;
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    const groupIndex = this.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    this.groups.splice(groupIndex, 1);
    return true;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return [];

    // This would normally fetch from EmployeeService
    return group.members.map(memberId => ({
      id: memberId,
      name: this.getMemberName(memberId),
      status: this.getMemberStatus(memberId),
      arrivalTime: this.getMemberArrivalTime(memberId),
      location: this.getMemberLocation(memberId)
    }));
  }

  private getMemberName(memberId: string): string {
    const names: Record<string, string> = {
      'emp001': 'John Doe',
      'emp002': 'Sarah Johnson',
      'emp003': 'Mike Chen',
      'emp004': 'Lisa Wong',
      'emp005': 'David Kim'
    };
    return names[memberId] || 'Unknown Employee';
  }

  private getMemberStatus(memberId: string): 'confirmed' | 'pending' | 'absent' {
    // This would normally check with EmployeeService
    const random = Math.random();
    if (random > 0.7) return 'confirmed';
    if (random > 0.3) return 'pending';
    return 'absent';
  }

  private getMemberArrivalTime(memberId: string): Date | undefined {
    const status = this.getMemberStatus(memberId);
    if (status === 'confirmed') {
      return new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 2);
    }
    return undefined;
  }

  private getMemberLocation(memberId: string): { latitude: number; longitude: number; address?: string } | undefined {
    const status = this.getMemberStatus(memberId);
    if (status === 'confirmed') {
      return {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        address: 'Home Address'
      };
    }
    return undefined;
  }
}

export const GroupService = new GroupServiceClass();