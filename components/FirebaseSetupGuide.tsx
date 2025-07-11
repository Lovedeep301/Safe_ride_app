import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Copy, ExternalLink } from 'lucide-react-native';

export default function FirebaseSetupGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const markStepComplete = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
  };

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } else {
      Alert.alert('Copy this text:', text);
    }
  };

  const securityRules = `rules_version = '2';
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
}`;

  const steps = [
    {
      id: 1,
      title: "Create Firebase Project",
      description: "Set up your Firebase project",
      actions: [
        "Go to https://console.firebase.google.com",
        "Click 'Create a project'",
        "Enter project name: 'employee-safety-hub'",
        "Disable Google Analytics (optional)",
        "Click 'Create project'"
      ]
    },
    {
      id: 2,
      title: "Add Web App",
      description: "Register your web application",
      actions: [
        "Click the Web icon '</>' in project overview",
        "App nickname: 'Employee Safety Hub'",
        "Don't check 'Firebase Hosting'",
        "Click 'Register app'",
        "Copy the config object (you'll need this!)"
      ]
    },
    {
      id: 3,
      title: "Enable Authentication",
      description: "Set up user authentication",
      actions: [
        "Go to Authentication in left sidebar",
        "Click 'Get started'",
        "Go to 'Sign-in method' tab",
        "Click 'Email/Password'",
        "Enable 'Email/Password'",
        "Click 'Save'"
      ]
    },
    {
      id: 4,
      title: "Create Firestore Database",
      description: "Set up real-time database",
      actions: [
        "Go to 'Firestore Database' in left sidebar",
        "Click 'Create database'",
        "Choose 'Start in production mode'",
        "Select location (us-central1 recommended)",
        "Click 'Done'"
      ]
    },
    {
      id: 5,
      title: "Configure Security Rules",
      description: "Set up data access permissions",
      actions: [
        "In Firestore Database, go to 'Rules' tab",
        "Replace default rules with the security rules below",
        "Click 'Publish'"
      ],
      code: securityRules
    },
    {
      id: 6,
      title: "Update Firebase Config",
      description: "Add your Firebase credentials to the app",
      actions: [
        "Open firebase.config.ts in your project",
        "Replace the placeholder config with your actual Firebase config",
        "Save the file"
      ],
      code: `// Replace this in firebase.config.ts
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};`
    }
  ];

  const renderStep = (step: any) => {
    const isCompleted = completedSteps.includes(step.id);
    
    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            {isCompleted ? (
              <CheckCircle size={24} color="#10B981" />
            ) : (
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>{step.id}</Text>
              </View>
            )}
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        </View>

        <View style={styles.stepContent}>
          {step.actions.map((action: string, index: number) => (
            <View key={index} style={styles.actionItem}>
              <Text style={styles.actionNumber}>{index + 1}.</Text>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}

          {step.code && (
            <View style={styles.codeContainer}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeTitle}>Code to copy:</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(step.code)}
                >
                  <Copy size={16} color="#2563EB" />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.codeScroll} horizontal>
                <Text style={styles.codeText}>{step.code}</Text>
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.completeButton, isCompleted && styles.completedButton]}
            onPress={() => markStepComplete(step.id)}
          >
            <Text style={[styles.completeButtonText, isCompleted && styles.completedButtonText]}>
              {isCompleted ? 'Completed ✓' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Firebase Setup Guide</Text>
          <Text style={styles.subtitle}>
            Follow these steps to enable real-time features
          </Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progress: {completedSteps.length}/{steps.length} steps completed
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedSteps.length / steps.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {steps.map(renderStep)}

        <View style={styles.footer}>
          <View style={styles.helpSection}>
            <AlertCircle size={24} color="#F59E0B" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                If you encounter any issues, check the Firebase Console documentation or create an issue in the repository.
              </Text>
            </View>
          </View>

          {completedSteps.length === steps.length && (
            <View style={styles.successSection}>
              <CheckCircle size={32} color="#10B981" />
              <Text style={styles.successTitle}>Setup Complete! 🎉</Text>
              <Text style={styles.successText}>
                Your Firebase integration is ready. Real-time messaging, emergency alerts, and location tracking are now active!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    marginRight: 12,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  stepContent: {
    paddingLeft: 36,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginRight: 8,
    minWidth: 20,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  codeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  codeScroll: {
    maxHeight: 200,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 18,
  },
  completeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  completedButton: {
    backgroundColor: '#10B981',
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  completedButtonText: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  helpSection: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  helpContent: {
    marginLeft: 12,
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 20,
  },
  successSection: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 24,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#065F46',
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#065F46',
    textAlign: 'center',
    lineHeight: 20,
  },
});