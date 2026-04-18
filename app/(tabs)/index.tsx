import React, { useState, useContext, useEffect, useCallback } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { WordCard } from '@/components/WordCard';
import { AppContext } from '@/context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { transcribeAudioWithAzure } from '@/lib/azureSpeech';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { AppModal } from '@/components/AppModal';

const { width, height } = Dimensions.get('window');

const WORDS = [
  'Apple',
  'Banana',
  'Cat',
  'Dog',
  'Elephant',
  'Frog',
  'Giraffe',
  'Hat',
  'Ice Cream',
  'Juice',
];

export default function TabOneScreen() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; status: 'success' | 'error' } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const { score, incrementScore, logout, childProfile } = useContext(AppContext);
  const insets = useSafeAreaInsets();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    confirmAction?: { label: string; onPress: () => void; destructive?: boolean };
  }>({ type: 'info', title: '', message: '' });

  const showModal = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    confirmAction?: { label: string; onPress: () => void; destructive?: boolean }
  ) => {
    setModalConfig({ type, title, message, confirmAction });
    setModalVisible(true);
  };

  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedBgShape1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }]
  }));
  const animatedBgShape2 = useAnimatedStyle(() => ({
    transform: [{ translateY: -floatAnim.value * 1.5 }]
  }));

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch((err) => {
          if (err && !err.message.includes('already been unloaded')) {
            console.log('Clean up record error', err);
          }
        });
      }
    };
  }, [recording]);

  const clearFeedbackAndNext = useCallback((isSuccess: boolean) => {
    setTimeout(() => {
      setFeedback(null);
      if (isSuccess) {
        setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
      }
    }, 2500);
  }, []);

  const handleCorrect = () => {
    setFeedback({ text: 'Success', status: 'success' });
    incrementScore();
    clearFeedbackAndNext(true);
  };

  const handleIncorrect = (wrongWord?: string) => {
    setFeedback({ text: 'Try Again', status: 'error' });
    clearFeedbackAndNext(false);
  };

  const processTranscription = async (uri: string) => {
    try {
      setIsTranscribing(true);
      const text = await transcribeAudioWithAzure(uri);

      const targetWord = WORDS[currentWordIndex];
      const spokenText = text?.trim() || "";

      if (!spokenText) {
        console.log('--- Evaluation Debug ---');
        console.log('Recognized Text (from Azure): [EMPTY] - Audio formatting or silence issue.');
        console.log('------------------------');
        setIsTranscribing(false);
        handleIncorrect();
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/evaluate/`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          target_word: targetWord.toLowerCase(),
          recognized_text: spokenText.toLowerCase(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const evalData = await response.json();
      setIsTranscribing(false);

      console.log('--- Evaluation Debug ---');
      console.log('Recognized Text (from Azure):', spokenText);
      console.log('Target Word:', targetWord);
      console.log('Backend Eval Response:', evalData);
      console.log('------------------------');

      if (evalData.correct) {
        handleCorrect();
      } else {
        handleIncorrect(spokenText);
      }
    } catch (e) {
      console.error("Transcription or Evaluation pipeline failed", e);
      setIsTranscribing(false);
      showModal('error', 'Evaluation Failed', "Something went wrong checking your voice. Let's try again!");
      handleIncorrect();
    }
  };

  const toggleRecord = async () => {
    try {
      if (isRecording && recording) {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
          await processTranscription(uri);
        } else {
          handleIncorrect();
        }
        return;
      }

      setFeedback(null);

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        showModal('error', 'Microphone Unavaiable', 'Please allow microphone permissions to read words.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const RECORDING_OPTIONS_WAV: Audio.RecordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.ogg',
          outputFormat: 11,
          audioEncoder: 7,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(RECORDING_OPTIONS_WAV);

      setRecording(newRecording);
      setIsRecording(true);

    } catch (e) {
      console.error("Audio block error", e);
      setIsRecording(false);
      setRecording(null);
      showModal(
        'warning',
        'Audio Module Error',
        'Could not init microphone. Simulating a correct answer!',
        { label: 'Simulate', onPress: () => { setModalVisible(false); handleCorrect(); } }
      );
    }
  };

  const handleLogout = () => {
    showModal(
      'warning',
      'Logout',
      'Are you sure you want to logout?',
      {
        label: 'Logout',
        destructive: true,
        onPress: async () => {
          setModalVisible(false);
          await supabase.auth.signOut();
          logout();
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bgShape1, animatedBgShape1]} />
      <Animated.View style={[styles.bgShape2, animatedBgShape2]} />
      <Animated.View style={[styles.bgShape3, animatedBgShape1]} />

      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>

        <View style={styles.topRow}>
          <View style={styles.pillContainer}>
            <Text style={styles.pillText}>✨ Learning Activity ✨</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Title and Score Area */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>
              {childProfile ? `Hi, ${childProfile.name}!` : "Hi Kid!"}
            </Text>
            <Text style={styles.subTitle}>Let's Learn!</Text>
          </View>

          <View style={styles.heroScoreBadge}>
            <Text style={styles.heroScoreLabel}>SCORE</Text>
            <View style={styles.heroScoreValueContainer}>
              <Text style={styles.heroScoreValue}>{score}</Text>
            </View>
          </View>
        </View>

      </View>

      <View style={styles.cardContainerWrapper}>
        <WordCard
          word={WORDS[currentWordIndex]}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onRecordPress={toggleRecord}
          feedback={feedback}
        />
      </View>

      <AppModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalVisible(false)}
        confirmAction={modalConfig.confirmAction}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF', // Extremely calming lavender/white
  },
  bgShape1: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#F3E8FF',
    opacity: 0.8,
  },
  bgShape2: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#E0E7FF',
    opacity: 0.8,
  },
  bgShape3: {
    position: 'absolute',
    top: height * 0.4,
    left: -width * 0.5,
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: '#FFE4E6',
    opacity: 0.5,
  },

  topSection: {
    paddingHorizontal: 25,
    zIndex: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pillText: {
    color: '#8b5cf6', // Indigo-purple
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1e1b4b',
    lineHeight: 40,
  },
  subTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6366f1',
    lineHeight: 34,
  },

  // Score Badge
  heroScoreBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    minWidth: 80,
  },
  heroScoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    marginBottom: 4,
    letterSpacing: 1,
  },
  heroScoreValueContainer: {
    backgroundColor: '#fef3c7',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroScoreValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#d97706',
  },

  cardContainerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: 40,
  },
});
