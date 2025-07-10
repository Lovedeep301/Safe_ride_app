export interface EmployeeStatus {
  id: string;
  employeeId: string;
  date: Date;
  status: 'confirmed' | 'pending' | 'absent' | 'leave';
  arrivedHome: boolean;
  arrivalTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isAbsent: boolean;
  isOnLeave: boolean;
}

class EmployeeServiceClass {
  private statuses: EmployeeStatus[] = [];

  async getTodayStatus(employeeId: string): Promise<EmployeeStatus | null> {
    const today = new Date().toDateString();
    return this.statuses.find(s => 
      s.employeeId === employeeId && 
      s.date.toDateString() === today
    ) || null;
  }

  async confirmArrival(employeeId: string, location?: { latitude: number; longitude: number; address?: string }): Promise<boolean> {
    try {
      const today = new Date();
      const todayString = today.toDateString();
      
      let status = this.statuses.find(s => 
        s.employeeId === employeeId && 
        s.date.toDateString() === todayString
      );

      if (status) {
        status.arrivedHome = true;
        status.arrivalTime = today;
        status.location = location;
        status.status = 'confirmed';
        status.isAbsent = false;
        status.isOnLeave = false;
      } else {
        status = {
          id: `status_${Date.now()}`,
          employeeId,
          date: today,
          status: 'confirmed',
          arrivedHome: true,
          arrivalTime: today,
          location,
          isAbsent: false,
          isOnLeave: false
        };
        this.statuses.push(status);
      }

      return true;
    } catch (error) {
      console.error('Error confirming arrival:', error);
      return false;
    }
  }

  async markAbsent(employeeId: string): Promise<boolean> {
    try {
      const today = new Date();
      const todayString = today.toDateString();
      
      let status = this.statuses.find(s => 
        s.employeeId === employeeId && 
        s.date.toDateString() === todayString
      );

      if (status) {
        status.isAbsent = true;
        status.status = 'absent';
        status.arrivedHome = false;
        status.isOnLeave = false;
      } else {
        status = {
          id: `status_${Date.now()}`,
          employeeId,
          date: today,
          status: 'absent',
          arrivedHome: false,
          isAbsent: true,
          isOnLeave: false
        };
        this.statuses.push(status);
      }

      return true;
    } catch (error) {
      console.error('Error marking absent:', error);
      return false;
    }
  }

  async markOnLeave(employeeId: string): Promise<boolean> {
    try {
      const today = new Date();
      const todayString = today.toDateString();
      
      let status = this.statuses.find(s => 
        s.employeeId === employeeId && 
        s.date.toDateString() === todayString
      );

      if (status) {
        status.isOnLeave = true;
        status.status = 'leave';
        status.arrivedHome = false;
        status.isAbsent = false;
      } else {
        status = {
          id: `status_${Date.now()}`,
          employeeId,
          date: today,
          status: 'leave',
          arrivedHome: false,
          isAbsent: false,
          isOnLeave: true
        };
        this.statuses.push(status);
      }

      return true;
    } catch (error) {
      console.error('Error marking on leave:', error);
      return false;
    }
  }

  async getEmployeeStatuses(date?: Date): Promise<EmployeeStatus[]> {
    const targetDate = date || new Date();
    const targetDateString = targetDate.toDateString();
    
    return this.statuses.filter(s => s.date.toDateString() === targetDateString);
  }

  async updateEmployeeStatus(employeeId: string, status: 'confirmed' | 'pending' | 'absent' | 'leave'): Promise<boolean> {
    try {
      const today = new Date();
      const todayString = today.toDateString();
      
      let employeeStatus = this.statuses.find(s => 
        s.employeeId === employeeId && 
        s.date.toDateString() === todayString
      );

      if (employeeStatus) {
        employeeStatus.status = status;
        employeeStatus.isAbsent = status === 'absent';
        employeeStatus.isOnLeave = status === 'leave';
        employeeStatus.arrivedHome = status === 'confirmed';
        if (status === 'confirmed') {
          employeeStatus.arrivalTime = today;
        }
      } else {
        employeeStatus = {
          id: `status_${Date.now()}`,
          employeeId,
          date: today,
          status,
          arrivedHome: status === 'confirmed',
          isAbsent: status === 'absent',
          isOnLeave: status === 'leave',
          ...(status === 'confirmed' && { arrivalTime: today })
        };
        this.statuses.push(employeeStatus);
      }

      return true;
    } catch (error) {
      console.error('Error updating employee status:', error);
      return false;
    }
  }
}

export const EmployeeService = new EmployeeServiceClass();