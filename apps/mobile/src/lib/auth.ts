import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
let isGoogleSigninConfigured = false;

function configureGoogleSignin() {
  if (!googleWebClientId || !googleIosClientId) {
    throw new Error('Google Sign-In не налаштовано. Додайте Web та iOS Client ID у mobile/.env.');
  }
  if (isGoogleSigninConfigured) return;

  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
  });
  isGoogleSigninConfigured = true;
}

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error(
      'Supabase не підключено. Додайте URL проєкту та publishable key у mobile/.env.',
    );
  }

  configureGoogleSignin();
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const googleResponse = await GoogleSignin.signIn();
  if (isCancelledResponse(googleResponse)) return null;
  if (!isSuccessResponse(googleResponse) || !googleResponse.data.idToken) {
    throw new Error('Google не повернув ID token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: googleResponse.data.idToken,
  });
  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Supabase не створив сесію користувача.');
  return data;
}

export async function signInWithApple() {
  if (!supabase) {
    throw new Error(
      'Supabase не підключено. Додайте URL проєкту та publishable key у mobile/.env.',
    );
  }
  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Sign in with Apple недоступний на цьому пристрої.');
  }
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!credential.identityToken) throw new Error('Apple did not return an identity token');
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Supabase не створив сесію користувача.');

  const fullName = [
    credential.fullName?.givenName,
    credential.fullName?.middleName,
    credential.fullName?.familyName,
  ]
    .filter(Boolean)
    .join(' ');
  if (fullName) {
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: fullName, display_name: fullName },
    });
    if (updateError) console.warn('Apple account created, but the name could not be saved.');
  }

  return data;
}
