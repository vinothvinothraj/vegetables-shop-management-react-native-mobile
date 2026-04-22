import { Tabs, Redirect, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/app-context";
import { colors } from "@/components/app-ui";

export default function TabLayout() {
  const { ready, session } = useApp();
  const insets = useSafeAreaInsets();

  if (!ready) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.shell}>
      <TopBar />
      <View style={styles.tabsWrap}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#D8FF95",
            tabBarInactiveTintColor: "rgba(233,247,238,0.72)",
            tabBarShowLabel: true,
            tabBarLabelStyle: styles.tabLabel,
            tabBarBackground: () => (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <LinearGradient
                  colors={["#081F12", "#1A6A40", "#2BAA61", "#1C7A49", "#0B2716"]}
                  locations={[0, 0.22, 0.5, 0.78, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0)"]}
                  locations={[0, 0.38, 1]}
                  start={{ x: 0.08, y: 0 }}
                  end={{ x: 0.92, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            ),
            tabBarStyle: {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: Math.max(insets.bottom, 12) + 14,
              paddingTop: 8,
              minHeight: 72 + insets.bottom,
              backgroundColor: "transparent",
              borderTopWidth: 0,
              borderWidth: 0,
              shadowColor: "#000",
              shadowOpacity: 0.22,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -2 },
              elevation: 12,
              overflow: "visible",
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="grid-outline" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="products"
            options={{
              title: "Products",
              tabBarLabel: "Products",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="leaf-outline" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="purchases"
            options={{
              title: "Purchases",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="download-outline" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="sales"
            options={{
              title: "Sales",
              tabBarLabel: "Sales",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="receipt-outline" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="expenses"
            options={{
              title: "Expenses",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="wallet-outline" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="stock"
            options={{
              title: "Stock",
              tabBarLabel: "Stock",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="layers-outline" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: "Reports",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} icon="bar-chart-outline" color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

function TopBar() {
  const { signOut } = useApp();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const current = String(segments[segments.length - 1] || "dashboard");
  const titleMap: Record<string, string> = {
    dashboard: "Dashboard",
    products: "Products",
    purchases: "Purchases",
    sales: "Sales",
    expenses: "Expenses",
    stock: "Stock",
    reports: "Reports",
  };
  const titleIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    dashboard: "grid-outline",
    products: "leaf-outline",
    purchases: "download-outline",
    sales: "pricetag-outline",
    expenses: "wallet-outline",
    stock: "layers-outline",
    reports: "bar-chart-outline",
  };
  const pageTitle = titleMap[current] || "Veg Manage";

  return (
    <View style={[styles.topSafe, { paddingTop: insets.top + 8 }]}>
      <LinearGradient
        colors={["#1A5B35", "#21804C", "#43B066", "#17633F", "#0D3F26"]}
        locations={[0, 0.24, 0.5, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGradient}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.04)", "rgba(255,255,255,0)"]}
        locations={[0, 0.48, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.topGradient}
      />
      <View style={styles.topBar}>
        <View style={styles.titleCluster}>
          <Ionicons name={titleIconMap[current] || "grid-outline"} size={18} color="#FFFFFF" />
          <Text style={styles.pageTitle}>{pageTitle}</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            onPress={async () => {
              await signOut();
            }}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logout</Text>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topSafe: {
    backgroundColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  titleCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
  },
  logoutButton: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  tabsWrap: {
    flex: 1,
  },
  topGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  tabIcon: {
    marginTop: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
    lineHeight: 12,
  },
});

function TabIcon({
  focused,
  icon,
  color,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return <Ionicons name={icon} color={focused ? "#D8FF95" : color} size={24} />;
}
