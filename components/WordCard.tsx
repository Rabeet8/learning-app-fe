import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    Easing,
    withSequence,
    withSpring
} from 'react-native-reanimated';

interface WordCardProps {
  word: string;
  isRecording: boolean;
  isTranscribing: boolean;
  onRecordPress: () => void;
  feedback: { text: string; status: 'success' | 'error' } | null;
}

const { width } = Dimensions.get('window');

export const WordCard: React.FC<WordCardProps> = ({ word, isRecording, isTranscribing, onRecordPress, feedback }) => {
  const theme = useTheme();
  
  // Animation values
  const pulse = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const feedbackOpacity = useSharedValue(0);

  // Animate mic pulse
  useEffect(() => {
    if (isRecording || isTranscribing) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [isRecording, isTranscribing]);

  // Animate feedback and card bounce
  useEffect(() => {
    if (feedback) {
      cardScale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
      feedbackOpacity.value = withTiming(1, { duration: 300 });
    } else {
      feedbackOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [feedback]);

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowOpacity: isRecording ? 0.4 : 0.2,
    shadowRadius: isRecording ? 15 : 5,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }]
  }));

  const animatedFeedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [
      { translateY: feedbackOpacity.value === 1 ? withSpring(0) : 20 }
    ]
  }));

  // Determine colors based on state
  const micBgColor = isTranscribing ? '#8b5cf6' : isRecording ? '#ff4081' : theme.colors.primary;
  const feedbackColor = feedback?.status === 'success' ? '#2e7d32' : '#c62828';
  const feedbackBgColor = feedback?.status === 'success' ? '#e8f5e9' : '#ffebee';
  const feedbackText = feedback?.text || '';

  return (
    <Animated.View style={[styles.card, animatedCardStyle]}>
      <View style={styles.cardHeader}>
         <View style={styles.decorationCircle1} />
         <View style={styles.decorationCircle2} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.wordText, { color: theme.colors.primary }]}>{word}</Text>
        
        <Animated.View style={[styles.feedbackContainer, { backgroundColor: feedbackText ? feedbackBgColor : 'transparent' }, animatedFeedbackStyle]}>
          <Text style={[styles.feedbackText, { color: feedbackColor }]}>
             {feedbackText}
          </Text>
        </Animated.View>

        <View style={styles.micContainer}>
          <Animated.View style={[styles.micPulseRing, animatedMicStyle, { backgroundColor: micBgColor }]} />
          <TouchableOpacity 
            style={[styles.micButton, { backgroundColor: micBgColor }]}
            onPress={onRecordPress}
            activeOpacity={0.8}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <FontAwesome5 
                 name={isRecording ? "stop" : "microphone"} 
                 size={32} 
                 color="#fff" 
              />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.hintText}>
          {isTranscribing 
            ? "Thinking..." 
            : isRecording 
              ? "Listening... Tap to stop" 
              : "Tap the mic and say the word!"}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#a1aebf',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    height: 30,
    width: '100%',
    backgroundColor: '#f1f5fb',
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    zIndex: 0,
  },
  decorationCircle1: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff5252'
  },
  decorationCircle2: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffca28'
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    zIndex: 1,
  },
  wordText: {
    fontSize: 54,
    fontFamily: 'SpaceMono', // using expo standard font from template
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  feedbackContainer: {
    minHeight: 40,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  feedbackText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  micContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  micPulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.3,
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  hintText: {
    fontSize: 16,
    color: '#8898aa',
    fontWeight: '500',
  }
});
