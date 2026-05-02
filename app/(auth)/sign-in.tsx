import { AuthView } from '@clerk/expo/native'
import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function SignInScreen() {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/')
    }
  }, [isSignedIn])

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Atmospherics */}
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.content}>
        <AuthView mode="signIn" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c15',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowTop: {
    top: -50,
    left: -50,
    backgroundColor: '#7e22ce2a',
  },
  glowBottom: {
    bottom: -50,
    right: -100,
    backgroundColor: '#0ea5e91a',
  },
  content: {
    flex: 1,
    paddingTop: 60, // Give some space at the top
  }
})
