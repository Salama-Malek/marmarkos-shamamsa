import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { PartForm, type PartFormValue } from '@/components/parts/PartForm';
import { createPart } from '@/db/parts';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';

export default function NewPartRoute() {
  const router = useRouter();
  const toast = useToast();
  const { feastId } = useLocalSearchParams<{ feastId?: string }>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(value: PartFormValue) {
    setSubmitting(true);
    try {
      await createPart({
        arName: value.arName,
        category: value.category,
        scope: value.scope,
        feastIds: value.feastIds,
      });
      toast.show(ar.part.saved, 'success');
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
        title={ar.part.new}
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
      <PartForm
        forceFeastId={feastId}
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
