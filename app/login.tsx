import { useState } from "react";
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/app-context";
import { AppButton, AppInput, Card, Screen, colors } from "@/components/app-ui";

const bgImage = require("../assets/images/main-bg.png");

export default function LoginScreen() {
  const router = useRouter();
  const { ready, session, signIn } = useApp();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [submitting, setSubmitting] = useState(false);

  if (!ready) {
    return null;
  }

  if (session) {
    return <Redirect href="/dashboard" />;
  }

  async function handleLogin() {
    setSubmitting(true);
    const result = await signIn(username.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      Alert.alert("Login failed", result.message || "Invalid credentials");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <Screen>
      <ImageBackground source={bgImage} resizeMode="cover" style={styles.background} imageStyle={styles.imageOffset}>
        <View style={styles.overlay} />
        <View style={styles.radial} />
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.container}>
          <View style={styles.spacer} />
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <Ionicons name="leaf" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.brandTitle}>LOGIN</Text>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <AppInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <AppInput value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <AppButton title={submitting ? "Signing in..." : "Sign in"} onPress={handleLogin} disabled={submitting} icon="arrow-forward" fullWidth />
          </Card>
          <View style={styles.footer}>
            <Text style={styles.footerText}>copy@2026 - All rights reserved</Text>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </Screen>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  radial: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 43, 30, 0.08)",
  },
  imageOffset: {
    transform: [{ translateY: -56 }],
    marginTop: 18,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  spacer: {
    flex: 1,
  },
  card: {
    gap: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: "rgba(15, 122, 74, 0.35)",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#0F7A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: "#0F7A4A",
    fontWeight: "800",
    letterSpacing: 4,
    fontSize: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: "#0F7A4A",
    backgroundColor: "#fff",
  },
  footerText: {
    color: "#0F7A4A",
    fontWeight: "600",
    fontSize: 12,
  },
});
