import React, { useState, useContext, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, Dimensions, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { AppContext } from '@/context/AppContext';
import { Redirect, router } from 'expo-router';
import Animated from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { AppModal } from '@/components/AppModal';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { isAuthenticated, login } = useContext(AppContext);
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ type: 'info', title: '', message: '' });

  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const handleAuth = async () => {
    Keyboard.dismiss();

    // Basic validation
    if (!email.trim() || !password.trim()) {
      showModal('warning', 'Missing Fields', 'Please enter email and password.');
      return;
    }

    if (activeTab === 'signup' && (!childName.trim() || !childAge.trim())) {
      showModal('warning', 'Missing Fields', "Please enter the child's name and age.");
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'signup') {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (authError) throw authError;

        if (authData.user) {
          // 2. Insert corresponding profile record
          // Use upsert to handle edge cases where the profile row may already exist
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: childName.trim(),
              age: parseInt(childAge, 10),
            });

          if (profileError) {
            // Log the detailed error but don't block the user
            console.error('Profile insert error:', JSON.stringify(profileError));
            showModal('warning', 'Profile Warning', `Account created but profile save failed: ${profileError.message}. You can update it later.`);
          }

          // Update local state Context
          login({ name: childName.trim(), age: childAge.trim() });
          router.replace('/(tabs)');
        }
      } else {
        // 1. Log in via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (authError) throw authError;

        if (authData.user) {
          // 2. Fetch corresponding profile record
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, age')
            .eq('id', authData.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Could not fetch child profile:', profileError.message);
          }

          // Update local state Context
          login({
            name: profileData?.full_name || 'Buddy',
            age: profileData?.age?.toString() || '0'
          });
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      showModal('error', 'Authentication Error', error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subTitle}>Ready to learn and play?</Text>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.cardEarLeft} />
              <View style={styles.cardEarRight} />
              <View style={styles.card}>
              {/* Custom Toggle Bar */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, activeTab === 'login' && styles.activeToggle]}
                  onPress={() => setActiveTab('login')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, activeTab === 'login' && styles.activeToggleText]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, activeTab === 'signup' && styles.activeToggle]}
                  onPress={() => setActiveTab('signup')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, activeTab === 'signup' && styles.activeToggleText]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Inputs */}
              <View style={styles.formContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  theme={{ roundness: 20 }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  outlineColor="#f1f5f9"
                  activeOutlineColor="#8b5cf6"
                  left={<TextInput.Icon icon="email-outline" color="#8b5cf6" />}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  theme={{ roundness: 20 }}
                  secureTextEntry
                  style={styles.input}
                  outlineColor="#f1f5f9"
                  activeOutlineColor="#8b5cf6"
                  left={<TextInput.Icon icon="lock-plus" color="#8b5cf6" />}
                />

                {activeTab === 'signup' && (
                  <View style={styles.signupLayout}>
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.sectionTitle}>Child Profile</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TextInput
                      label="Child's Name"
                      value={childName}
                      onChangeText={setChildName}
                      mode="outlined"
                      theme={{ roundness: 20 }}
                      style={styles.input}
                      outlineColor="#f1f5f9"
                      activeOutlineColor="#10b981"
                      left={<TextInput.Icon icon="face-man" color="#10b981" />}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
                      }}
                    />

                    <TextInput
                      label="Child's Age"
                      value={childAge}
                      onChangeText={setChildAge}
                      mode="outlined"
                      theme={{ roundness: 20 }}
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor="#f1f5f9"
                      activeOutlineColor="#f59e0b"
                      left={<TextInput.Icon icon="cake-variant" color="#f59e0b" />}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
                      }}
                    />
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={handleAuth}
                  loading={loading}
                  disabled={loading}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  labelStyle={styles.actionButtonText}
                  icon={activeTab === 'login' ? 'rocket-launch' : 'star'}
                >
                  {activeTab === 'login' ? "Let's Go!" : "Create Profile"}
                </Button>
              </View>
            </View>
          </View>

            {/* Bottom spacer for keyboard */}
            <View style={{ height: 60 }} />

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Custom Modal */}
      <AppModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  kavContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e1b4b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 20,
    color: '#8b5cf6',
    fontWeight: '800',
    textAlign: 'center',
  },
  cardContainer: {
    position: 'relative',
    marginTop: 20,
  },
  cardEarLeft: {
    position: 'absolute',
    top: -15,
    left: 30,
    width: 40,
    height: 40,
    backgroundColor: '#ffb74d',
    borderRadius: 20,
    zIndex: 0,
  },
  cardEarRight: {
    position: 'absolute',
    top: -15,
    right: 30,
    width: 40,
    height: 40,
    backgroundColor: '#ffb74d',
    borderRadius: 20,
    zIndex: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#ede9fe',
    padding: 24,
    paddingTop: 32,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 8,
    zIndex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 6,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: '#fff',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  activeToggleText: {
    color: '#8b5cf6',
  },
  formContainer: {
    gap: 4,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  signupLayout: {
    marginTop: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },
  actionButton: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    borderWidth: 4,
    borderColor: '#7c3aed',
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  actionButtonContent: {
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  }
});
