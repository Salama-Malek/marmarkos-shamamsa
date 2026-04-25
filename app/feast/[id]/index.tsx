import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { PartRow } from '@/components/parts/PartRow';

import { getFeast } from '@/db/feasts';
import {
  deletePart,
  listPartsForFeast,
  setPartActive,
} from '@/db/parts';
import { ar } from '@/lib/i18n';
import { colors, spacing, text } from '@/theme';
import type { Feast, Part } from '@/types';

export default function FeastDetailRoute() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [feast, setFeast] = useState<Feast | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);
  const [pending, setPending] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    const [f, p] = await Promise.all([getFeast(id), listPartsForFeast(id)]);
    setFeast(f);
    setParts(p);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  async function handleToggleActive(part: Part, next: boolean) {
    try {
      await setPartActive(part.id, next);
      await reload();
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  async function handleDelete(part: Part) {
    setPending(true);
    try {
      await deletePart(part.id);
      toast.show(ar.part.deleted, 'success');
      await reload();
    } finally {
      setPending(false);
      setDeleteTarget(null);
    }
  }

  if (loading || !feast) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title={ar.feast.detail}
          showCross={false}
          right={<BackChevron onPress={() => router.back()} />}
        />
        <CenteredSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={feast.arName}
        showCross={false}
        right={<BackChevron onPress={() => router.back()} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[text.body, { color: colors.textMuted }]}>
            {ar.feast.parts}
          </Text>
        </Card>

        {parts.length === 0 ? (
          <EmptyState title={ar.assignment.noPartsForFeast} />
        ) : (
          <View style={styles.list}>
            {parts.map((p) => (
              <PartRow
                key={p.id}
                part={p}
                onPress={(part) =>
                  router.push({ pathname: '/part/[id]/edit', params: { id: part.id } })
                }
                onLongPress={(part) => setDeleteTarget(part)}
                onToggleActive={handleToggleActive}
              />
            ))}
          </View>
        )}

        <Button
          label={ar.feast.addPart}
          variant="secondary"
          icon={<Plus size={18} color={colors.primary} />}
          onPress={() => router.push({ pathname: '/part/new', params: { feastId: feast.id } })}
        />
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title={ar.part.deleteConfirmTitle}
        body={
          deleteTarget?.isSeeded
            ? ar.part.cannotDeleteSeeded
            : ar.part.deleteConfirmBody
        }
        confirmLabel={ar.actions.confirmDelete}
        destructive
        loading={pending}
        onConfirm={() => deleteTarget && !deleteTarget.isSeeded && void handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

function BackChevron({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={ar.actions.back}>
      <ChevronRight size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  list: {
    gap: spacing.xs,
  },
});
