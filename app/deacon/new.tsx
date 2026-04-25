import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { DeaconForm, type DeaconFormValue } from '@/components/deacons/DeaconForm';
import { createDeacon } from '@/db/deacons';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';

export default function NewDeaconRoute() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(value: DeaconFormValue) {
    setSubmitting(true);
    try {
      await createDeacon({
        name: value.name,
        phone: value.phone || undefined,
        notes: value.notes || undefined,
        joinedDate: value.joinedDate || undefined,
      });
      toast.show(ar.deacon.saved, 'success');
      router.back();
    } catch (e) {
      toast.show(String(e), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={ar.deacon.new}
        showCross={false}
        right={
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityLabel={ar.actions.close}
          >
            <X size={22} color={colors.text} />
          </Pressable>
        }
      />
      <DeaconForm
        submitLabel={ar.actions.save}
        submitting={submitting}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
});
