import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Pencil } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Pill } from '@/components/ui/Pill';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { CalendarTile } from '@/components/liturgies/CalendarTile';
import { AttendanceRow } from '@/components/attendance/AttendanceRow';
import { AssignmentRow } from '@/components/assignments/AssignmentRow';
import { AssignmentPicker } from '@/components/assignments/AssignmentPicker';

import { getLiturgy } from '@/db/liturgies';
import { getFeast } from '@/db/feasts';
import { listDeacons } from '@/db/deacons';
import { listPartsForLiturgy } from '@/db/parts';
import {
  getAttendanceForLiturgy,
  setAttendance,
} from '@/db/attendance';
import {
  getAssignmentsForLiturgyDetailed,
  removeAssignment,
  removeAssignmentsForDeacon,
  setAssignment,
  type AssignmentDetail,
} from '@/db/assignments';

import { ar } from '@/lib/i18n';
import { formatArabicDateLong } from '@/lib/date';
import { useNumerals } from '@/lib/numeralsContext';
import { colors, spacing, text } from '@/theme';
import type {
  AttendanceStatus,
  Deacon,
  Liturgy,
  Part,
  Feast,
} from '@/types';

type Tab = 'attendance' | 'assignments';

export default function LiturgyDetailRoute() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { style: numStyle } = useNumerals();

  const [tab, setTab] = useState<Tab>('attendance');

  const [liturgy, setLiturgy] = useState<Liturgy | null>(null);
  const [feast, setFeast] = useState<Feast | null>(null);
  const [deacons, setDeacons] = useState<Deacon[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [attendance, setAttendanceState] = useState<Map<string, AttendanceStatus>>(new Map());
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const [pickerPart, setPickerPart] = useState<Part | null>(null);
  const [absentWarning, setAbsentWarning] = useState<{
    deaconId: string;
    nextStatus: AttendanceStatus;
    name: string;
    count: number;
  } | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const liturgyRow = await getLiturgy(id);
    if (!liturgyRow) {
      setLoading(false);
      return;
    }
    const [feastRow, deaconsList, partsList, attendanceRows, assignmentsList] = await Promise.all([
      liturgyRow.feastId ? getFeast(liturgyRow.feastId) : Promise.resolve(null),
      listDeacons({ filter: 'active' }),
      listPartsForLiturgy(liturgyRow.feastId),
      getAttendanceForLiturgy(liturgyRow.id),
      getAssignmentsForLiturgyDetailed(liturgyRow.id),
    ]);
    setLiturgy(liturgyRow);
    setFeast(feastRow);
    setDeacons(deaconsList);
    setParts(partsList);
    const map = new Map<string, AttendanceStatus>();
    for (const r of attendanceRows) map.set(r.deaconId, r.status);
    setAttendanceState(map);
    setAssignments(assignmentsList);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const presentDeacons = useMemo(
    () => deacons.filter((d) => attendance.get(d.id) === 'present'),
    [deacons, attendance],
  );

  const assignmentByPartId = useMemo(() => {
    const map = new Map<string, AssignmentDetail>();
    for (const a of assignments) map.set(a.partId, a);
    return map;
  }, [assignments]);

  const assignmentsByDeaconCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) {
      map.set(a.deaconId, (map.get(a.deaconId) ?? 0) + 1);
    }
    return map;
  }, [assignments]);

  async function handleSetStatus(deaconId: string, nextStatus: AttendanceStatus) {
    if (!liturgy) return;
    const current = attendance.get(deaconId);
    // Toggle off if same status tapped twice — same UX as the existing app.
    const finalStatus = current === nextStatus ? null : nextStatus;

    // Cascade warning: switching away from "present" while assignments exist.
    if (
      current === 'present' &&
      finalStatus !== 'present' &&
      (assignmentsByDeaconCount.get(deaconId) ?? 0) > 0
    ) {
      const deacon = deacons.find((d) => d.id === deaconId);
      setAbsentWarning({
        deaconId,
        nextStatus: finalStatus ?? 'absent',
        name: deacon?.name ?? '',
        count: assignmentsByDeaconCount.get(deaconId) ?? 0,
      });
      return;
    }

    try {
      await setAttendance(liturgy.id, deaconId, finalStatus);
      const next = new Map(attendance);
      if (finalStatus === null) next.delete(deaconId);
      else next.set(deaconId, finalStatus);
      setAttendanceState(next);
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  async function confirmCascadeAbsent() {
    if (!liturgy || !absentWarning) return;
    try {
      await setAttendance(liturgy.id, absentWarning.deaconId, absentWarning.nextStatus);
      await removeAssignmentsForDeacon(liturgy.id, absentWarning.deaconId);
      setAbsentWarning(null);
      await reload();
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  async function handlePickDeacon(deaconId: string) {
    if (!liturgy || !pickerPart) return;
    try {
      await setAssignment(liturgy.id, pickerPart.id, deaconId);
      toast.show(ar.assignment.assigned, 'success');
      setPickerPart(null);
      await reload();
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  async function handleClearAssignment(part: Part) {
    if (!liturgy) return;
    try {
      await removeAssignment(liturgy.id, part.id);
      toast.show(ar.assignment.removed, 'success');
      await reload();
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  if (loading || !liturgy) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title={ar.liturgy.detail}
          showCross={false}
          right={<BackChevron onPress={() => router.back()} />}
        />
        <CenteredSpinner />
      </SafeAreaView>
    );
  }

  const isCancelled = liturgy.status === 'cancelled';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={liturgy.title || ar.liturgy.detail}
        showCross={false}
        right={<BackChevron onPress={() => router.back()} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <View style={styles.headRow}>
            <CalendarTile date={liturgy.date} tone={isCancelled ? 'cancelled' : 'primary'} />
            <View style={styles.headBody}>
              <Text style={[text.bodyBold, styles.titleText]} numberOfLines={2}>
                {liturgy.title || ''}
              </Text>
              <Text style={[text.small, styles.dateText]}>
                {formatArabicDateLong(liturgy.date, numStyle)}
              </Text>
              <View style={styles.metaRow}>
                {feast ? <Pill label={feast.arName} tone="gold" /> : null}
                {isCancelled ? <Pill label={ar.status.cancelled} tone="cancelled" /> : null}
              </View>
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/liturgy/[id]/edit', params: { id: liturgy.id } })
              }
              hitSlop={10}
              accessibilityLabel={ar.actions.edit}
              style={styles.editBtn}
            >
              <Pencil size={20} color={colors.primary} />
            </Pressable>
          </View>

          {liturgy.notes ? (
            <View style={styles.notesBlock}>
              <Text style={[text.small, { color: colors.textMuted }]}>{ar.liturgy.notes}</Text>
              <Text style={[text.body, { color: colors.text }]}>{liturgy.notes}</Text>
            </View>
          ) : null}
        </Card>

        {isCancelled ? (
          <Card>
            <Text style={[text.body, { color: colors.textMuted, textAlign: 'center' }]}>
              {ar.liturgy.cancelled}
            </Text>
            {liturgy.cancellationReason ? (
              <Text
                style={[text.small, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }]}
              >
                {liturgy.cancellationReason}
              </Text>
            ) : null}
          </Card>
        ) : (
          <>
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: 'attendance', label: ar.liturgy.attendanceTab },
                { value: 'assignments', label: ar.liturgy.assignmentsTab },
              ]}
            />

            {tab === 'attendance' ? (
              <View style={styles.list}>
                {deacons.length === 0 ? (
                  <Card>
                    <Text style={[text.body, { color: colors.textMuted, textAlign: 'center' }]}>
                      {ar.empty.deacons}
                    </Text>
                  </Card>
                ) : (
                  deacons.map((d) => (
                    <AttendanceRow
                      key={d.id}
                      deacon={d}
                      status={attendance.get(d.id)}
                      onSetStatus={handleSetStatus}
                      assignmentsCount={assignmentsByDeaconCount.get(d.id) ?? 0}
                    />
                  ))
                )}
              </View>
            ) : (
              <View style={styles.list}>
                {parts.length === 0 ? (
                  <Card>
                    <Text style={[text.body, { color: colors.textMuted, textAlign: 'center' }]}>
                      {ar.empty.parts}
                    </Text>
                  </Card>
                ) : (
                  parts.map((p) => {
                    const a = assignmentByPartId.get(p.id);
                    return (
                      <AssignmentRow
                        key={p.id}
                        part={p}
                        assignedDeaconName={a?.deaconName}
                        onPress={() => {
                          if (presentDeacons.length === 0) {
                            toast.show(ar.assignment.cannotAssignAbsent, 'error');
                            return;
                          }
                          setPickerPart(p);
                        }}
                        onClear={a ? handleClearAssignment : undefined}
                      />
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AssignmentPicker
        visible={!!pickerPart}
        part={pickerPart}
        presentDeacons={presentDeacons}
        onClose={() => setPickerPart(null)}
        onPick={handlePickDeacon}
      />

      <ConfirmModal
        visible={!!absentWarning}
        title={ar.assignment.deaconAbsentWarning}
        body={
          absentWarning
            ? `${absentWarning.name} مكلَّف بـ ${absentWarning.count} جزء — هل تريد إلغاء التكليفات والاستمرار؟`
            : ''
        }
        confirmLabel={ar.actions.confirm}
        destructive
        onConfirm={() => void confirmCascadeAbsent()}
        onCancel={() => setAbsentWarning(null)}
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
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleText: {
    color: colors.text,
  },
  dateText: {
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  editBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xxs,
  },
  list: {
    gap: spacing.xs,
  },
});
