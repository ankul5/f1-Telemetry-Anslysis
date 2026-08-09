import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PitWallTheme } from '../../constants/theme';
import { TopBar } from '../../components/top-bar';

interface TelemetryFact {
  label: string;
  value: string;
  highlight?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  telemetry?: TelemetryFact[];
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', role: 'user', text: 'Should I pit for Softs now?' },
  {
    id: '2',
    role: 'assistant',
    text: 'Simulation suggests staying out 2 more laps. The current Mediums are still holding optimal temperature windows (98°C - 102°C).',
    telemetry: [
      { label: 'TYRE DEG (MED)', value: '-0.15s / LAP', highlight: true },
      { label: 'PIT WINDOW', value: 'LAP 42-45' },
    ],
  },
];

const QUICK_PROMPTS = [
  { icon: 'cloud-outline' as const, text: "What's the rain forecast?" },
  { icon: 'ellipse-outline' as const, text: 'Best tyre for stint 2?' },
  { icon: 'timer-outline' as const, text: 'Gap to Hamilton?' },
];

// Canned replies stand in for the Phase 4 LLM backend so the screen is demo-able today.
const CANNED_REPLY: Message = {
  id: 'pending',
  role: 'assistant',
  text: 'The AI assistant backend arrives in Phase 4. Once wired up, this will answer from live telemetry, tyre models and race context.',
  telemetry: [{ label: 'STATUS', value: 'AWAITING PHASE 4' }],
};

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: `u${now}`, role: 'user', text: trimmed },
      { ...CANNED_REPLY, id: `a${now}` },
    ]);
    setInput('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((m) =>
            m.role === 'user' ? (
              <View key={m.id} style={styles.userRow}>
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={m.id} style={styles.assistantRow}>
                <View style={styles.assistantBubble}>
                  <View style={styles.assistantInner}>
                    <MaterialCommunityIcons
                      name="robot"
                      size={18}
                      color={PitWallTheme.colors.primaryContainer}
                      style={styles.robotIcon}
                    />
                    <View style={styles.assistantBody}>
                      <Text style={styles.assistantText}>{m.text}</Text>
                      {m.telemetry && (
                        <View style={styles.telemetryBox}>
                          {m.telemetry.map((t, i) => (
                            <View
                              key={t.label}
                              style={[
                                styles.telemetryRow,
                                i < m.telemetry!.length - 1 && styles.telemetryRowDivider,
                              ]}
                            >
                              <Text style={styles.telemetryLabel}>{t.label}</Text>
                              <Text
                                style={[
                                  styles.telemetryValue,
                                  t.highlight && { color: PitWallTheme.colors.primary },
                                ]}
                              >
                                {t.value}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ),
          )}
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptRow}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_PROMPTS.map((p) => (
            <TouchableOpacity key={p.text} style={styles.promptChip} activeOpacity={0.75} onPress={() => send(p.text)}>
              <Ionicons name={p.icon} size={14} color={PitWallTheme.colors.onSurfaceVariant} />
              <Text style={styles.promptText}>{p.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything..."
            placeholderTextColor={`${PitWallTheme.colors.onSecondaryContainer}80`}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={() => send(input)} style={styles.sendButton} hitSlop={8}>
            <Ionicons
              name="arrow-up"
              size={20}
              color={input.trim() ? PitWallTheme.colors.primary : PitWallTheme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PitWallTheme.colors.background },
  flex: { flex: 1 },
  chatContent: {
    padding: PitWallTheme.spacing.md,
    gap: PitWallTheme.spacing.lg,
    flexGrow: 1,
  },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: PitWallTheme.colors.surfaceContainerHigh,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    padding: 10,
  },
  userText: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: PitWallTheme.colors.onSurface,
  },

  assistantRow: { alignItems: 'flex-start' },
  assistantBubble: {
    maxWidth: '90%',
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    borderLeftWidth: 2,
    borderLeftColor: PitWallTheme.colors.primaryContainer,
    padding: 10,
  },
  assistantInner: { flexDirection: 'row', gap: 8 },
  robotIcon: { marginTop: 2 },
  assistantBody: { flex: 1, gap: 8 },
  assistantText: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: PitWallTheme.colors.onSurface,
  },

  telemetryBox: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: PitWallTheme.colors.surfaceContainerHighest,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingHorizontal: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: 12,
  },
  telemetryRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: PitWallTheme.colors.surfaceContainerHighest,
  },
  telemetryLabel: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  telemetryValue: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 12,
    color: PitWallTheme.colors.onSurface,
  },

  promptRow: { gap: 8, paddingHorizontal: PitWallTheme.spacing.md, paddingBottom: 8 },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PitWallTheme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outlineVariant}4D`,
    borderRadius: PitWallTheme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptText: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PitWallTheme.spacing.md,
    marginBottom: PitWallTheme.spacing.sm,
    backgroundColor: PitWallTheme.colors.surfaceDim,
    borderWidth: 2,
    borderColor: 'rgba(138,138,142,0.4)',
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingLeft: 12,
    paddingRight: 6,
    height: 46,
  },
  input: {
    flex: 1,
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    color: PitWallTheme.colors.onSurface,
    padding: 0,
  },
  sendButton: { padding: 6 },
});
