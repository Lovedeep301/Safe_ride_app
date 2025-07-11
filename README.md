# Employee Safety Hub

A comprehensive React Native Expo application for employee safety management, real-time communication, and transportation coordination.

## 🚀 Project Overview

Employee Safety Hub is a mobile-first application designed to ensure employee safety through real-time tracking, emergency alerts, and seamless communication between employees, drivers, and administrators.

## 📱 Key Features

### For Employees
- **Safety Confirmation**: Confirm safe arrival at home with location tracking
- **Emergency Alerts**: Quick SOS button with multiple emergency types
- **Group Communication**: Chat with cab group members and drivers
- **Real-time Tracking**: View live cab locations and driver status
- **Status Management**: Mark attendance, leave, or absence

### For Drivers
- **Route Management**: View and manage assigned routes and passengers
- **Passenger Tracking**: Monitor pickup/drop-off status for each passenger
- **Vehicle Status**: Track fuel, mileage, and maintenance schedules
- **Duty Management**: Toggle on/off duty status
- **Emergency Response**: Receive and respond to emergency alerts

### For Administrators
- **User Management**: Create, edit, and manage employee and driver accounts
- **Group Management**: Organize employees into cab groups
- **Real-time Monitoring**: Live map view of all users and vehicles
- **Emergency Dashboard**: Monitor and respond to emergency alerts
- **Analytics**: View safety statistics and user activity

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router with tab-based navigation
- **UI Components**: Custom components with Lucide React Native icons
- **Styling**: StyleSheet with consistent design system
- **Fonts**: Inter font family for typography

### Backend Services (Mock Implementation)
- **Authentication**: Role-based access control (Employee, Driver, Admin)
- **Location Services**: GPS tracking with address geocoding
- **Emergency Services**: Alert management and notification system
- **Messaging**: Real-time group and direct messaging
- **Data Management**: Local state management with service layer

### Key Services
- `AuthService`: User authentication and management
- `LocationService`: GPS tracking and location utilities
- `EmergencyService`: Emergency alert handling
- `MessageService`: Communication and messaging
- `DriverService`: Driver-specific functionality
- `EmployeeService`: Employee status management
- `GroupService`: Group and team management

## 📂 Project Structure

```
app/
├── (tabs)/                 # Employee interface
│   ├── index.tsx          # Home dashboard
│   ├── groups.tsx         # Cab groups
│   ├── messages.tsx       # Communication
│   └── admin.tsx          # Admin panel
├── (driver-tabs)/         # Driver interface
│   ├── index.tsx          # Driver dashboard
│   ├── routes.tsx         # Route management
│   ├── passengers.tsx     # Passenger tracking
│   ├── messages.tsx       # Driver communication
│   └── profile.tsx        # Driver profile
├── auth.tsx               # Authentication screen
└── index.tsx              # App entry point

components/
├── EmergencyButton.tsx    # Emergency alert component
└── RealTimeMap.tsx        # Live tracking map

services/
├── AuthService.ts         # Authentication logic
├── LocationService.ts     # GPS and location
├── EmergencyService.ts    # Emergency management
├── MessageService.ts      # Messaging system
├── DriverService.ts       # Driver operations
├── EmployeeService.ts     # Employee operations
└── GroupService.ts        # Group management
```

## 🗺️ Development Roadmap

### Phase 1: Core Foundation ✅ (Completed)
- [x] Basic authentication system with role-based access
- [x] User interface for employees, drivers, and admins
- [x] Navigation structure with tab-based routing
- [x] Mock data services and state management
- [x] Basic styling and design system

### Phase 2: Safety Features ✅ (Completed)
- [x] Emergency alert system with multiple alert types
- [x] Location tracking and GPS integration
- [x] Safety confirmation workflow
- [x] Real-time map visualization
- [x] Status management (home, leave, absent)

### Phase 3: Communication ✅ (Completed)
- [x] Group messaging for cab groups
- [x] Direct messaging between users
- [x] Driver-passenger communication
- [x] Emergency communication channels
- [x] Message history and read receipts

### Phase 4: Driver Management ✅ (Completed)
- [x] Route assignment and management
- [x] Passenger pickup/drop-off tracking
- [x] Vehicle status monitoring
- [x] Duty status management
- [x] Driver dashboard and analytics

### Phase 5: Admin Panel ✅ (Completed)
- [x] User creation and management
- [x] Group creation and assignment
- [x] Real-time monitoring dashboard
- [x] Emergency alert management
- [x] System analytics and reporting

### Phase 6: Backend Integration 🔄 (In Progress)
- [x] Firebase Authentication integration
- [x] Firestore real-time database
- [x] Real-time messaging system
- [x] Emergency alerts with Firebase
- [x] Location tracking with Firebase
- [ ] Push notifications with FCM
- [ ] File upload with Firebase Storage
- [ ] Offline data synchronization

### Phase 7: Advanced Features 📋 (Planned)
- [ ] Advanced analytics and reporting
- [ ] Geofencing for automatic status updates
- [ ] Integration with external mapping services
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Dark mode theme

### Phase 8: Production Readiness 📋 (Planned)
- [ ] Performance optimization
- [ ] Security audit and improvements
- [ ] Comprehensive testing suite
- [ ] CI/CD pipeline setup
- [ ] App store deployment
- [ ] Documentation and user guides

### Phase 9: Enterprise Features 📋 (Future)
- [ ] Multi-tenant support
- [ ] Advanced role management
- [ ] Integration with HR systems
- [ ] Custom branding options
- [ ] API for third-party integrations
- [ ] Advanced security features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator (for testing)
- Firebase project (for production features)

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Configure Firebase (optional)
# 1. Create a Firebase project
# 2. Copy your config to firebase.config.ts
# 3. Enable Authentication and Firestore
# 4. Set up security rules

# Start the development server
npm run dev
```

### Demo Accounts
The application includes demo accounts for testing:

**Admin Accounts:**
- ID: ADMIN001, Password: admin123
- ID: ADMIN002, Password: admin123

**Driver Accounts:**
- ID: DRV001, Password: driver123
- ID: DRV002, Password: driver123
- ID: DRV003, Password: driver123

**Employee Accounts:**
- ID: EMP001, Password: emp123
- ID: EMP002, Password: emp123
- ID: EMP003, Password: emp123
- ID: EMP004, Password: emp123
- ID: EMP005, Password: emp123

### Firebase Integration
The app now includes Firebase services:
- **Authentication**: Email/password with unique ID lookup
- **Real-time Database**: Firestore for all app data
- **Messaging**: Real-time chat with Firebase
- **Emergency Alerts**: Live emergency notification system
- **Location Tracking**: Real-time location updates
- **User Management**: Complete user lifecycle management

## 🔧 Configuration

### Environment Setup
The application now supports Firebase integration. To configure:

1. **Firebase Setup**:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase configuration to `firebase.config.ts`

2. **Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow unauthenticated users to query users collection for login lookup
       match /users {
         allow list: if true;
       }
       
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         allow read: if request.auth != null && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // Messages - participants can read/write
       match /messages/{messageId} {
         allow read, write: if request.auth != null;
       }
       
       // Conversations - participants can read/write
       match /conversations/{conversationId} {
         allow read, write: if request.auth != null;
       }
       
       // Emergency alerts - authenticated users can create, admins can manage
       match /emergencyAlerts/{alertId} {
         allow create: if request.auth != null;
         allow read, update: if request.auth != null && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // Location updates - users can create their own, admins can read all
       match /locationUpdates/{updateId} {
         allow create: if request.auth != null && 
           request.auth.uid == resource.data.userId;
         allow read: if request.auth != null && 
           (request.auth.uid == resource.data.userId || 
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
       }
     }
   }
   ```

3. **Authentication Setup**:
   - Enable Email/Password authentication in Firebase Console
   - Configure authorized domains for web deployment

4. **Push Notifications** (Optional):
   - Enable Firebase Cloud Messaging
   - Configure service worker for web notifications

### Firebase vs Mock Data
The application supports both Firebase and mock data modes:
- Use `FirebaseAuthService` for production with real Firebase backend
- Use `AuthService` for development with mock data
- Switch between services in your components as needed

### Customization
- Update branding in `app.json`
- Modify color scheme in component styles
- Configure notification settings
- Adjust location tracking intervals

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔮 Future Vision

Employee Safety Hub aims to become the leading platform for workplace safety management, expanding beyond transportation to include:
- Workplace safety protocols
- Incident reporting and management
- Safety training and certification
- Integration with IoT safety devices
- AI-powered risk assessment
- Comprehensive safety analytics

---

**Built with ❤️ for employee safety and peace of mind**