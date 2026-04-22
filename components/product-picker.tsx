import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { Product } from "@/lib/types";
import { colors } from "@/components/app-ui";

type Props = {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  allowAll?: boolean;
  allLabel?: string;
};

export function ProductPicker({ products, value, onChange, allowAll = false, allLabel = "All products" }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {allowAll ? (
        <Chip active={!value} label={allLabel} onPress={() => onChange("")} />
      ) : null}
      {products
        .filter((product) => product.active)
        .map((product) => (
          <Chip key={product.id} active={value === product.id} label={product.name} onPress={() => onChange(product.id)} />
        ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  labelActive: {
    color: colors.primary,
  },
});
