// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useColors, Typography } from '../../src/lib/design';
import { useLanguageStore } from '../../src/store/languageStore';

export default function AppLayout() {
  const Colors = useColors();
  const { t } = useLanguageStore();

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
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Tabs.Screen
        name="groups"
        options={{
          tabBarLabel: t('lists'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 24 }}>🛒</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>Shoply</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarLabel: t('profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="group/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="group/[id]/activity" options={{ href: null }} />
      <Tabs.Screen name="group/[id]/members" options={{ href: null }} />
      <Tabs.Screen name="group/[id]/store" options={{ href: null }} />
    </Tabs>
  );
}