// app/(app)/_layout.tsx
// Authenticated app layout with bottom tab navigator

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/lib/design';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: Typography.semibold,
          marginTop: 2,
        },
        headerStyle: { backgroundColor: Colors.bgCard },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: Typography.bold,
          fontSize: 18,
          color: Colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="groups"
        options={{
          title: 'My Lists',
          tabBarLabel: 'Lists',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Hidden screens — navigated to programmatically */}
      <Tabs.Screen
        name="group/[id]/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="group/[id]/activity"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="group/[id]/members"
        options={{ href: null }}
      />
    </Tabs>
  );
}
