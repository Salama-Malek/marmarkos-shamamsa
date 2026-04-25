import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FS from 'expo-file-system/legacy';
import {
  ChevronRight,
  Code2,
  Download,
  ExternalLink,
  FileDown,
  HardDrive,
  Trash2,
  Upload,
} from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';

import {
  exportAllAsJson,
  InvalidBackupError,
  restoreFromJson,
  wipeAllData,
  type RestoreResult,
} from '@/db/backup';
import { shareText, MIME, safeFilename } from '@/lib/share';
import { saveTextToDevice } from '@/lib/saveToDevice';

import { ar } from '@/lib/i18n';
import { useNumerals } from '@/lib/numeralsContext';
import { colors, spacing, text } from '@/theme';

export default function SettingsRoute() {
  const router = useRouter();
  const toast = useToast();
  const { style: numStyle, setStyle: setNumStyle } = useNumerals();

  const [pendingBackup, setPendingBackup] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [restorePreview, setRestorePreview] = useState<{ jsonText: string; filename: string } | null>(
    null,
  );
  const [showWipe, setShowWipe] = useState(false);
  const [busy, setBusy] = useState<'restore' | 'wipe' | null>(null);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = (Constants.expoConfig?.android?.versionCode ?? 1).toString();

  async function handleBackup() {
    if (pendingBackup) return;
    setPendingBackup(true);
    try {
      const payload = await exportAllAsJson(version);
      const json = JSON.stringify(payload, null, 2);
      const today = new Date().toISOString().slice(0, 10);
      const filename = safeFilename(`marmarkos-shamamsa-backup-${today}`, 'json');
      await shareText(json, filename, MIME.json, ar.settings.backup);
      toast.show(ar.settings.backupSuccess, 'success');
    } catch (e) {
      toast.show(String(e), 'error');
    } finally {
      setPendingBackup(false);
    }
  }

  async function handleSaveToDevice() {
    if (pendingSave) return;
    setPendingSave(true);
    try {
      const payload = await exportAllAsJson(version);
      const json = JSON.stringify(payload, null, 2);
      const today = new Date().toISOString().slice(0, 10);
      const filename = safeFilename(`marmarkos-shamamsa-backup-${today}`, 'json');
      const result = await saveTextToDevice(json, filename, MIME.json);
      if (result.kind === 'cancelled') {
        toast.show('تم إلغاء الحفظ', 'info');
      } else {
        toast.show(ar.settings.saveSuccess, 'success');
      }
    } catch (e) {
      toast.show(String(e), 'error');
    } finally {
      setPendingSave(false);
    }
  }

  async function handlePickRestoreFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;
      const text = await FS.readAsStringAsync(file.uri, { encoding: FS.EncodingType.UTF8 });
      setRestorePreview({ jsonText: text, filename: file.name });
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  async function handleConfirmRestore() {
    if (!restorePreview) return;
    setBusy('restore');
    try {
      const result: RestoreResult = await restoreFromJson(restorePreview.jsonText);
      toast.show(
        `تم استعادة ${result.deacons} شماس و ${result.liturgies} قداس`,
        'success',
      );
      setRestorePreview(null);
    } catch (e) {
      if (e instanceof InvalidBackupError) {
        toast.show(e.message, 'error');
      } else {
        toast.show(String(e), 'error');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleWipe() {
    setBusy('wipe');
    try {
      await wipeAllData();
      toast.show(ar.settings.wipeSuccess, 'success');
      setShowWipe(false);
    } catch (e) {
      toast.show(String(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={ar.settings.title}
        showCross={false}
        right={
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityLabel={ar.actions.back}
          >
            <ChevronRight size={22} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle title={ar.settings.appInfo} />
        <Card>
          <Row label={ar.settings.church} value="كنيسة مارمرقس الرسول · موسكو" />
          <Divider />
          <Row label={ar.settings.appName} value={ar.app.title} />
          <Divider />
          <Row label={ar.settings.appVersion} value={version} />
          <Divider />
          <Row label={ar.settings.appBuild} value={build} />
        </Card>

        <SectionTitle title={ar.settings.numerals} />
        <Card>
          <SegmentedControl
            value={numStyle}
            onChange={(v) => void setNumStyle(v)}
            options={[
              { value: 'arabic', label: ar.settings.numeralsArabic },
              { value: 'western', label: ar.settings.numeralsWestern },
            ]}
          />
        </Card>

        <SectionTitle title={ar.settings.dataManagement} />
        <Card>
          <ActionRow
            icon={<FileDown size={22} color={colors.gold} />}
            title={ar.export.title}
            subtitle={ar.export.subtitle}
            onPress={() => router.push('/export' as never)}
          />
          <Divider />
          <ActionRow
            icon={<Download size={22} color={colors.primary} />}
            title={ar.settings.backup}
            subtitle={ar.settings.backupSubtitle}
            loading={pendingBackup}
            onPress={handleBackup}
          />
          <Divider />
          <ActionRow
            icon={<HardDrive size={22} color={colors.primary} />}
            title={ar.settings.save}
            subtitle={ar.settings.saveSubtitle}
            loading={pendingSave}
            onPress={handleSaveToDevice}
          />
          <Divider />
          <ActionRow
            icon={<Upload size={22} color={colors.primary} />}
            title={ar.settings.restore}
            subtitle={ar.settings.restoreSubtitle}
            onPress={handlePickRestoreFile}
          />
          <Divider />
          <ActionRow
            icon={<Trash2 size={22} color={colors.absent} />}
            title={ar.settings.wipe}
            subtitle={ar.settings.wipeSubtitle}
            destructive
            onPress={() => setShowWipe(true)}
          />
        </Card>

        <SectionTitle title={ar.settings.developer} />
        <Card>
          <Pressable
            style={({ pressed }) => [styles.developerRow, pressed ? { opacity: 0.92 } : undefined]}
            onPress={() => void Linking.openURL('https://github.com/Salama-Malek')}
          >
            <View style={styles.developerIcon}>
              <Code2 size={22} color={colors.gold} />
            </View>
            <View style={styles.developerBody}>
              <Text style={[text.bodyBold, styles.developerName]}>Salama Malek</Text>
              <View style={styles.developerLinkRow}>
                <Text style={[text.small, styles.developerLink]}>github.com/Salama-Malek</Text>
                <ExternalLink size={14} color={colors.gold} />
              </View>
            </View>
          </Pressable>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={!!restorePreview}
        title={ar.settings.restore}
        body={
          restorePreview
            ? `سيتم استبدال جميع البيانات الحالية بمحتوى ${restorePreview.filename}.`
            : ''
        }
        confirmLabel={ar.actions.confirm}
        destructive
        loading={busy === 'restore'}
        onConfirm={() => void handleConfirmRestore()}
        onCancel={() => setRestorePreview(null)}
      />

      <ConfirmModal
        visible={showWipe}
        title={ar.settings.wipe}
        body="سيتم حذف جميع الشمامسة والقداسات والتكليفات. لا يمكن التراجع."
        confirmLabel={ar.actions.confirmDelete}
        destructive
        requireTypeWord={ar.actions.confirm}
        loading={busy === 'wipe'}
        onConfirm={() => void handleWipe()}
        onCancel={() => setShowWipe(false)}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={[text.subheading, styles.section]}>{title}</Text>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[text.body, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[text.bodyMedium, { color: colors.text, flex: 1, textAlign: 'left' }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  destructive,
  loading,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  destructive?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionRow,
        pressed ? { backgroundColor: colors.bgDeep } : undefined,
        loading ? { opacity: 0.6 } : undefined,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.actionBody}>
        <Text style={[text.bodyMedium, { color: destructive ? colors.absent : colors.text }]}>
          {title}
        </Text>
        <Text style={[text.small, styles.actionSubtitle]}>{subtitle}</Text>
      </View>
      <View style={styles.actionIcon}>{icon}</View>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  section: {
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  actionIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionSubtitle: {
    color: colors.textMuted,
  },
  developerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  developerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.bgDeep,
  },
  developerBody: {
    flex: 1,
    gap: 2,
  },
  developerName: {
    color: colors.text,
  },
  developerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  developerLink: {
    color: colors.gold,
    fontFamily: 'Cairo_500Medium',
    writingDirection: 'ltr',
    textAlign: 'left',
  },
});
