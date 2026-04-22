import { Redirect } from "expo-router";
import { useApp } from "@/context/app-context";
import { LoadingScreen } from "@/components/app-ui";

export default function IndexRoute() {
  const { ready, session } = useApp();

  if (!ready) {
    return <LoadingScreen />;
  }

  return <Redirect href={session ? "/dashboard" : "/login"} />;
}
