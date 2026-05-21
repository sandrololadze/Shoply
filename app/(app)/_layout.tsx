// app/(app)/_layout.tsx
// Authenticated app layout with bottom tab navigator

import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import Svg, { Rect, Path, Line, Circle } from 'react-native-svg';
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
        headerTitle: () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Text style={{ fontSize: 24 }}>🛒</Text>
    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B' }}>Shoply</Text>
  </View>
),
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Svg width="32" height="32" viewBox="0 0 200 200">
          <Rect x="8" y="8" width="184" height="184" rx="36" fill="#EEF2FF" stroke="#6366F1" strokeWidth="6"/>
          <Path d="M38 58 Q38 38 58 38 L162 38 Q182 38 182 58 L182 88" fill="none" stroke="#6366F1" strokeWidth="10" strokeLinecap="round"/>
          <Path d="M33 73 L48 73 L66 98" fill="none" stroke="#6366F1" strokeWidth="10" strokeLinecap="round"/>
          <Rect x="48" y="93" width="138" height="74" rx="14" fill="white" stroke="#6366F1" strokeWidth="6"/>
          <Path d="M56 110 L65 119 L81 103" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          <Line x1="90" y1="113" x2="176" y2="113" stroke="#6366F1" strokeWidth="5" strokeLinecap="round"/>
          <Line x1="90" y1="129" x2="170" y2="129" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" opacity="0.55"/>
          <Line x1="90" y1="145" x2="173" y2="145" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
          <Circle cx="70" cy="177" r="15" fill="#6366F1"/>
          <Circle cx="157" cy="177" r="15" fill="#6366F1"/>
        </Svg>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B' }}>Shoply</Text>
      </View>
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
