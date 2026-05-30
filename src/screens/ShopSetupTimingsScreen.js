import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Time Picker Data ───────────────────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

const ITEM_HEIGHT = 48;

// Format time object → "09:00 AM"
function formatTime(t) {
  return `${t.hour}:${t.minute} ${t.period}`;
}

// Default session with unique id
function newSession(startHour = '09', startMin = '00', startPer = 'AM',
                   endHour = '06',  endMin  = '00', endPer  = 'PM') {
  return {
    id: Date.now() + Math.random(),
    start: { hour: startHour, minute: startMin, period: startPer },
    end:   { hour: endHour,   minute: endMin,   period: endPer   },
  };
}

// Default schedule for all 7 days
function defaultSchedule() {
  return DAYS.map((_, i) => ({
    isOpen: i < 6, // Mon–Sat open, Sun closed by default
    sessions: [newSession()],
  }));
}

// ─── Drum-Roll Column ──────────────────────────────────────────────
function DrumColumn({ items, selected, onSelect }) {
  const listRef = useRef(null);
  const selectedIdx = items.indexOf(selected);

  useEffect(() => {
    if (listRef.current && selectedIdx >= 0) {
      listRef.current.scrollToIndex({ index: selectedIdx, animated: false });
    }
  }, [selectedIdx]);

  return (
    <View style={dc.col}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          if (items[idx]) onSelect(items[idx]);
        }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        renderItem={({ item }) => (
          <View style={dc.item}>
            <Text style={[dc.itemText, item === selected && dc.itemSelected]}>
              {item}
            </Text>
          </View>
        )}
      />
      {/* Selection highlight band */}
      <View pointerEvents="none" style={dc.highlight} />
    </View>
  );
}

const dc = StyleSheet.create({
  col: {
    flex: 1,
    height: ITEM_HEIGHT * 3,
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#b0b0b0',
  },
  itemSelected: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#1b1c1c',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#ff5722',
    borderRadius: 4,
  },
});

// ─── Time Picker Modal ────────────────────────────────────────────
function TimePickerModal({ visible, initialTime, label, onConfirm, onCancel }) {
  const [hour, setHour]     = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState(initialTime.period);

  // Reset state when modal opens with new initialTime
  useEffect(() => {
    if (visible) {
      setHour(initialTime.hour);
      setMinute(initialTime.minute);
      setPeriod(initialTime.period);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={tp.overlay}>
        <View style={tp.sheet}>
          {/* Handle */}
          <View style={tp.handle} />

          <Text style={tp.label}>{label}</Text>

          {/* Drum columns */}
          <View style={tp.drumsRow}>
            <DrumColumn items={HOURS}   selected={hour}   onSelect={setHour}   />
            <Text style={tp.colon}>:</Text>
            <DrumColumn items={MINUTES} selected={minute} onSelect={setMinute} />
            <DrumColumn items={PERIODS} selected={period} onSelect={setPeriod} />
          </View>

          {/* Actions */}
          <View style={tp.actions}>
            <TouchableOpacity style={tp.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={tp.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tp.confirmBtn}
              activeOpacity={0.85}
              onPress={() => onConfirm({ hour, minute, period })}
            >
              <Text style={tp.confirmText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const tp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
    color: '#1b1c1c',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  drumsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    height: ITEM_HEIGHT * 3,
  },
  colon: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#1b1c1c',
    marginHorizontal: 4,
    marginTop: -ITEM_HEIGHT * 0.25,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#eae7e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#5b4039',
  },
  confirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
});

// ─── Session Card ────────────────────────────────────────────────
function SessionCard({ session, index, isFirst, onRemove, onTimePress }) {
  return (
    <View style={sc.box}>
      <View style={sc.header}>
        <Text style={sc.title}>SESSION {index + 1}</Text>
        {!isFirst && (
          <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={20} color="#ba1a1a" />
          </TouchableOpacity>
        )}
      </View>

      <View style={sc.timeRow}>
        {/* Start */}
        <View style={sc.timeWrapper}>
          <Text style={sc.timeLabel}>Start Time</Text>
          <TouchableOpacity
            style={sc.timeBox}
            activeOpacity={0.75}
            onPress={() => onTimePress('start', session)}
          >
            <MaterialIcons name="schedule" size={18} color="#ff5722" />
            <Text style={sc.timeValue}>{formatTime(session.start)}</Text>
          </TouchableOpacity>
        </View>

        <Text style={sc.divider}>—</Text>

        {/* End */}
        <View style={sc.timeWrapper}>
          <Text style={sc.timeLabel}>End Time</Text>
          <TouchableOpacity
            style={sc.timeBox}
            activeOpacity={0.75}
            onPress={() => onTimePress('end', session)}
          >
            <MaterialIcons name="schedule" size={18} color="#ff5722" />
            <Text style={sc.timeValue}>{formatTime(session.end)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  box: {
    backgroundColor: '#f6f3f2',
    borderWidth: 1.5,
    borderColor: '#eae7e7',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#5c697a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeWrapper: { flex: 1 },
  timeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#5b4039',
    marginBottom: 6,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#eae7e7',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  timeValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#1b1c1c',
    marginLeft: 6,
  },
  divider: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#5b4039',
    marginHorizontal: 10,
    marginTop: 20,
  },
});

// ─── Main Screen ───────────────────────────────────────────────────
export default function ShopSetupTimingsScreen({ onNext, onSkip }) {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [activeDay, setActiveDay] = useState(0);

  // Time picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMeta, setPickerMeta] = useState(null);
  // pickerMeta = { sessionId, field: 'start' | 'end', initialTime, label }

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn  = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, tension: 40, friction: 3, useNativeDriver: true }).start();

  // Helpers to mutate schedule immutably
  const updateDay = useCallback((dayIdx, updater) => {
    setSchedule(prev => prev.map((day, i) => i === dayIdx ? updater(day) : day));
  }, []);

  const toggleOpen = (dayIdx) => {
    updateDay(dayIdx, (day) => ({
      ...day,
      isOpen: !day.isOpen,
      sessions: day.sessions.length === 0 ? [newSession()] : day.sessions,
    }));
  };

  const addSession = (dayIdx) => {
    updateDay(dayIdx, (day) => ({
      ...day,
      sessions: [...day.sessions, newSession('06', '00', 'PM', '10', '00', 'PM')],
    }));
  };

  const removeSession = (dayIdx, sessionId) => {
    updateDay(dayIdx, (day) => ({
      ...day,
      sessions: day.sessions.filter(s => s.id !== sessionId),
    }));
  };

  const openTimePicker = (field, session) => {
    setPickerMeta({
      sessionId: session.id,
      field,
      initialTime: field === 'start' ? session.start : session.end,
      label: field === 'start' ? 'Set Opening Time' : 'Set Closing Time',
    });
    setPickerVisible(true);
  };

  const handleTimeConfirm = (newTime) => {
    const { sessionId, field } = pickerMeta;
    updateDay(activeDay, (day) => ({
      ...day,
      sessions: day.sessions.map(s =>
        s.id === sessionId ? { ...s, [field]: newTime } : s
      ),
    }));
    setPickerVisible(false);
  };

  const copyToAllDays = () => {
    const currentDay = schedule[activeDay];
    setSchedule(prev => prev.map(() => ({
      isOpen: currentDay.isOpen,
      sessions: currentDay.sessions.map(s => ({ ...s, id: Date.now() + Math.random() })),
    })));
  };

  const handleContinue = () => {
    // Build structured output
    const structured = {};
    DAYS.forEach((day, i) => {
      const d = schedule[i];
      structured[day] = {
        isOpen: d.isOpen,
        sessions: d.isOpen
          ? d.sessions.map(s => ({
              start: formatTime(s.start),
              end:   formatTime(s.end),
            }))
          : [],
      };
    });
    console.log('=== SHOP TIMINGS DATA ===');
    console.log(JSON.stringify(structured, null, 2));
    onNext();
  };

  const currentDay = schedule[activeDay];

  return (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

      {/* Step Indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepText}>3</Text>
        </View>
        <Text style={styles.stepTitle}>Shop timings</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Step 3 of 5</Text>
          <TouchableOpacity style={styles.skipRow} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>SKIP FOR NOW</Text>
            <MaterialIcons name="chevron-right" size={16} color="#5b4039" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Shop Timings</Text>
        <Text style={styles.subtitle}>Set your business hours and daily sessions.</Text>
      </View>

      {/* Form */}
      <View style={styles.formContent}>
        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              style={[styles.dayButton, activeDay === index && styles.dayButtonActive]}
              onPress={() => setActiveDay(index)}
            >
              <Text style={[styles.dayText, activeDay === index && styles.dayTextActive]}>{day}</Text>
              {/* Dot indicator if open */}
              {schedule[index].isOpen && (
                <View style={[styles.dayDot, activeDay === index && styles.dayDotActive]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Schedule card */}
        <View style={styles.scheduleCard}>
          {/* Header row */}
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>{DAYS[activeDay]} Schedule</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, !currentDay.isOpen && styles.toggleLabelClosed]}>
                {currentDay.isOpen ? 'Open' : 'Closed'}
              </Text>
              <Switch
                trackColor={{ false: '#e4e2e1', true: '#ff5722' }}
                thumbColor="#ffffff"
                onValueChange={() => toggleOpen(activeDay)}
                value={currentDay.isOpen}
              />
            </View>
          </View>

          {currentDay.isOpen ? (
            <View style={styles.sessionsContainer}>
              {currentDay.sessions.map((session, idx) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={idx}
                  isFirst={idx === 0}
                  onRemove={() => removeSession(activeDay, session.id)}
                  onTimePress={(field, s) => openTimePicker(field, s)}
                />
              ))}

              {/* Add session */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.addSessionButton}
                onPress={() => addSession(activeDay)}
              >
                <MaterialIcons name="add-circle-outline" size={20} color="#ff5722" />
                <Text style={styles.addSessionText}>Add Another Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.closedStateBox}>
              <View style={styles.closedIconCircle}>
                <MaterialIcons name="storefront" size={32} color="#5b4039" />
              </View>
              <Text style={styles.closedTitle}>Closed for business today</Text>
              <Text style={styles.closedSubtitle}>Your shop won't be visible to customers on this day.</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.scheduleFooter}>
            <TouchableOpacity activeOpacity={0.7} style={styles.copyScheduleBtn} onPress={copyToAllDays}>
              <MaterialIcons name="content-copy" size={18} color="#706500" />
              <Text style={styles.copyScheduleText}>Copy this schedule to all days</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonWrapper]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#1e1b1b" />
        </TouchableOpacity>
      </Animated.View>

      {/* Time Picker Modal */}
      {pickerMeta && (
        <TimePickerModal
          visible={pickerVisible}
          initialTime={pickerMeta.initialTime}
          label={pickerMeta.label}
          onConfirm={handleTimeConfirm}
          onCancel={() => setPickerVisible(false)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: -16,
    zIndex: 5,
  },

  // Step
  stepIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#ff5722',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ff5722', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  stepText: { fontFamily: 'Montserrat-Bold', fontSize: 11, color: '#ffffff' },
  stepTitle: {
    fontFamily: 'Montserrat-Bold', fontSize: 12, color: '#1e1b1b',
    textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 12,
  },

  // Progress
  progressContainer: { marginBottom: 28 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#ff5722', textTransform: 'uppercase', letterSpacing: 1 },
  skipRow: { flexDirection: 'row', alignItems: 'center' },
  skipText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: '#5b4039', letterSpacing: 0.5, marginRight: 2 },
  progressBarTrack: { height: 5, backgroundColor: '#eeeeee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ff5722', width: '60%', borderRadius: 3 },

  // Header
  headerTextContainer: { marginBottom: 20 },
  title: { fontFamily: 'Montserrat-Bold', fontSize: 20, color: '#1b1c1c', marginBottom: 6 },
  subtitle: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#5b4039', lineHeight: 20 },

  // Form
  formContent: { flex: 1, paddingBottom: 16 },

  // Day buttons
  daysRow: { paddingBottom: 16, paddingRight: 16 },
  dayButton: {
    width: 50, height: 60, borderRadius: 12,
    backgroundColor: '#f6f3f2', borderWidth: 1.5, borderColor: '#eae7e7',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: '#ff5722', borderColor: '#ff5722',
    shadowColor: '#ff5722', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  dayText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#5b4039', textTransform: 'uppercase' },
  dayTextActive: { color: '#ffffff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ff5722', marginTop: 4 },
  dayDotActive: { backgroundColor: '#ffffff' },

  // Card
  scheduleCard: {
    backgroundColor: '#ffffff', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#eae7e7',
    padding: 16, marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f6f3f2', marginBottom: 16,
  },
  scheduleTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#1b1c1c' },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#1b1c1c', marginRight: 8 },
  toggleLabelClosed: { color: '#7f8c8d' },

  // Sessions
  sessionsContainer: { gap: 12 },

  // Add session
  addSessionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderWidth: 1.5, borderColor: '#ff5722', borderStyle: 'dashed',
    borderRadius: 24, backgroundColor: '#fff5f2', marginTop: 4,
  },
  addSessionText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#ff5722', marginLeft: 6 },

  // Closed state
  closedStateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  closedIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f6f3f2', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  closedTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#1b1c1c', marginBottom: 4 },
  closedSubtitle: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#7f8c8d', textAlign: 'center' },

  // Footer
  scheduleFooter: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f6f3f2' },
  copyScheduleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, backgroundColor: '#f9e534', borderRadius: 24,
  },
  copyScheduleText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#706500', marginLeft: 6 },

  // Continue button
  buttonWrapper: { marginTop: 12 },
  continueButton: {
    height: 56, backgroundColor: '#ffd600', borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ffd600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  continueButtonText: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#1e1b1b', marginRight: 8 },
});
