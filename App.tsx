// App.tsx — VigilPulse Functional Mobile Prototype (Expo / React Native)
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { evaluateClusterRisk } from './src/engine/earlyWarningEngine';
import { SYNTHETIC_SITE_DATASETS } from './src/data/syntheticPilotDataset';
import { DailyClusterInput, SyndromeCategory } from './src/types/surveillance';

const SYNDROMES: SyndromeCategory[] = [
  'Feeling Well',
  'Fever / Chills',
  'Cough / Respiratory',
  'GI / Diarrhoea',
  'Heat Fatigue / Dizziness',
];

const SITE_KEYS = Object.keys(SYNTHETIC_SITE_DATASETS);

export default function App() {
  const [mode, setMode] = useState<'WORKER' | 'COMMAND'>('WORKER');
  const [activeSite, setActiveSite] = useState<string>('ZONE-A-MFG');
  const [selectedSyndrome, setSelectedSyndrome] = useState<SyndromeCategory>('Feeling Well');
  const [datasets, setDatasets] = useState<Record<string, DailyClusterInput[]>>(SYNTHETIC_SITE_DATASETS);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showFhir, setShowFhir] = useState<boolean>(false);

  const currentHistory = datasets[activeSite];
  const result = evaluateClusterRisk(currentHistory);

  const handleCheckIn = () => {
    const isSymptomatic = selectedSyndrome !== 'Feeling Well';
    const updatedHistory = [...currentHistory];
    const lastDay = { ...updatedHistory[updatedHistory.length - 1] };
    lastDay.activeParticipants += 1;
    if (isSymptomatic) {
      lastDay.symptomaticCount += 1;
    }
    updatedHistory[updatedHistory.length - 1] = lastDay;

    setDatasets({
      ...datasets,
      [activeSite]: updatedHistory,
    });
    setSubmitted(true);
  };

  const badgeColor =
    result.alertLevel === 'ACTION_ALERT'
      ? '#C53030'
      : result.alertLevel === 'WATCH'
      ? '#D69E2E'
      : result.alertLevel === 'SUPPRESSED'
      ? '#4A5568'
      : '#008080';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>VigilPulse PW-HEWS</Text>
        <Text style={styles.subtitle}>
          Privacy-Preserving Population & Workforce Early Warning Prototype (Non-Diagnostic)
        </Text>

        {/* Site Selector */}
        <Text style={styles.sectionLabel}>Active Pilot Site / Cohort</Text>
        <View style={styles.siteRow}>
          {SITE_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.siteChip, activeSite === key && styles.siteChipActive]}
              onPress={() => {
                setActiveSite(key);
                setSubmitted(false);
              }}
            >
              <Text style={[styles.siteChipText, activeSite === key && styles.siteChipTextActive]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role Switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'WORKER' && styles.activeTab]}
            onPress={() => setMode('WORKER')}
          >
            <Text style={[styles.tabText, mode === 'WORKER' && styles.activeTabText]}>
              Worker Check-In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'COMMAND' && styles.activeTab]}
            onPress={() => setMode('COMMAND')}
          >
            <Text style={[styles.tabText, mode === 'COMMAND' && styles.activeTabText]}>
              Health Command
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'WORKER' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>15-Second Anonymous Daily Check-In</Text>
            <Text style={styles.note}>
              Responses are aggregated with k-anonymity (k ≥ 10). Employers and HR never see individual entries.
            </Text>
            {SYNDROMES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.option, selectedSyndrome === item && styles.optionSelected]}
                onPress={() => {
                  setSelectedSyndrome(item);
                  setSubmitted(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.submitBtn} onPress={handleCheckIn}>
              <Text style={styles.submitText}>
                {submitted ? 'Recorded (k-Anonymous Queue Synced)' : 'Submit Anonymous Check-In'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{result.siteName}</Text>
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>STATUS: {result.alertLevel}</Text>
            </View>

            <Text style={styles.metric}>Active Participants: {result.activeParticipants}</Text>
            <Text style={styles.metric}>
              Composite WPRI Score: {result.suppressedForPrivacy ? 'Suppressed (k < 10)' : `${result.wpriScore} / 100`}
            </Text>
            <Text style={styles.metric}>
              EWMA Syndromic Signal: {result.ewmaScore !== null ? `${result.ewmaScore}%` : 'Suppressed (k < 10)'}
            </Text>
            <Text style={styles.metric}>
              Latest Daily Rate: {result.syndromicRatePct !== null ? `${result.syndromicRatePct}%` : 'Suppressed (k < 10)'}
            </Text>

            <Text style={styles.advisory}>{result.advisory}</Text>

            <TouchableOpacity style={styles.fhirToggle} onPress={() => setShowFhir(!showFhir)}>
              <Text style={styles.fhirToggleText}>
                {showFhir ? 'Hide HL7 FHIR R4 MeasureReport' : 'Inspect HL7 FHIR R4 Export Payload'}
              </Text>
            </TouchableOpacity>

            {showFhir && (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>
                  {JSON.stringify(result.fhirMeasureReport, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.disclaimer}>
          CLINICAL BOUNDARY NOTICE: VigilPulse is a non-device population and occupational health early warning tool.
          It does NOT diagnose, treat, or triage individual medical conditions. Always seek licensed clinical care for personal symptoms.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  scroll: { padding: 18, paddingBottom: 36 },
  brand: { fontSize: 23, fontWeight: '700', color: '#1B365D' },
  subtitle: { fontSize: 12, color: '#4A5568', marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#4A5568', marginBottom: 6, textTransform: 'uppercase' },
  siteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  siteChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#E2E8F0' },
  siteChipActive: { backgroundColor: '#1B365D' },
  siteChipText: { fontSize: 11, fontWeight: '600', color: '#1A202C' },
  siteChipTextActive: { color: '#FFFFFF' },
  tabs: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  tab: { flex: 1, padding: 11, backgroundColor: '#E2E8F0', borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#008080' },
  tabText: { color: '#1A202C', fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1B365D', marginBottom: 6 },
  note: { fontSize: 12, color: '#4A5568', marginBottom: 12 },
  option: { padding: 12, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, marginBottom: 8 },
  optionSelected: { borderColor: '#008080', backgroundColor: '#E6FFFA' },
  optionText: { fontSize: 14, color: '#1A202C' },
  submitBtn: { backgroundColor: '#1B365D', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
  badge: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, marginVertical: 6 },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  metric: { fontSize: 14, fontWeight: '600', marginVertical: 3, color: '#2D3748' },
  advisory: { marginTop: 10, padding: 10, backgroundColor: '#FFF5F5', color: '#9B2C2C', borderRadius: 6, fontSize: 13, lineHeight: 18 },
  fhirToggle: { marginTop: 12, padding: 10, backgroundColor: '#EDF2F7', borderRadius: 6, alignItems: 'center' },
  fhirToggleText: { color: '#1B365D', fontWeight: '600', fontSize: 12 },
  codeBox: { marginTop: 10, padding: 10, backgroundColor: '#1A202C', borderRadius: 6 },
  codeText: { color: '#E2E8F0', fontSize: 10, fontFamily: 'monospace' },
  disclaimer: { marginTop: 18, fontSize: 11, color: '#718096', lineHeight: 16 },
});
