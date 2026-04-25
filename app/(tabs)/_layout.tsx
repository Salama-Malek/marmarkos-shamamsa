import { Tabs } from 'expo-router';
import { CalendarDays, Users, ListChecks, BarChart3 } from 'lucide-react-native';
import { colors } from '@/theme';
import { ar } from '@/lib/i18n';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: 'Cairo_500Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ar.tabs.liturgies,
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deacons"
        options={{
          title: ar.tabs.deacons,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="parts"
        options={{
          title: ar.tabs.parts,
          tabBarIcon: ({ color, size }) => <ListChecks size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: ar.tabs.stats,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
