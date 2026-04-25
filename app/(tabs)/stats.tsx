import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';

export default function StatsTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={ar.tabs.stats} subtitle={ar.app.subtitle} />
      <View style={styles.body}>
        <EmptyState title={ar.empty.stats} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
