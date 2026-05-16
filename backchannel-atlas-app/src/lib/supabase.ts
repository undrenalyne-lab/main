"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { appPath } from "./format";
import { clearPendingSync, loadPlans, loadProfile, savePlans, saveProfile } from "./profile";
import type { ActionPlan, UserProfile } from "./types";

let client: SupabaseClient | null = null;

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase() {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return client;
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const redirectTo = `${window.location.origin}${appPath("/auth/callback/")}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function saveProfileToCloud(session: Session, profile = loadProfile()) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const nextProfile = saveProfile({ ...profile, userId: session.user.id });
  const { error } = await supabase.from("profiles").upsert(
    {
      id: nextProfile.id,
      user_id: session.user.id,
      profile_json: nextProfile,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return nextProfile;
}

export async function savePlanToCloud(session: Session, plan: ActionPlan) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const nextPlan: ActionPlan = { ...plan, userId: session.user.id };
  const { error: planError } = await supabase.from("saved_plans").upsert({
    id: nextPlan.id,
    user_id: session.user.id,
    profile_id: nextPlan.profileId,
    country_id: nextPlan.countryId,
    plan_json: nextPlan,
    progress: nextPlan.progress,
    status: nextPlan.status,
  });
  if (planError) throw planError;

  const rows = nextPlan.phases.flatMap((phase) =>
    phase.tasks.map((task, index) => ({
      id: task.id,
      user_id: session.user.id,
      plan_id: nextPlan.id,
      title: task.title,
      description: task.description,
      category: task.category,
      phase: phase.label,
      status: task.status,
      order_index: index,
      source_ids: task.sourceIds || [],
    })),
  );
  if (rows.length) {
    const { error: taskError } = await supabase.from("plan_tasks").upsert(rows);
    if (taskError) throw taskError;
  }
  return nextPlan;
}

export async function syncGuestDataToCloud(session: Session) {
  await saveProfileToCloud(session);
  const plans = loadPlans();
  for (const plan of plans) {
    await savePlanToCloud(session, plan);
  }
  clearPendingSync();
}

export async function loadCloudData(session: Session) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("profile_json")
    .eq("user_id", session.user.id)
    .limit(1);
  if (profileError) throw profileError;
  const cloudProfile = profileRows?.[0]?.profile_json;
  if (cloudProfile) saveProfile({ ...cloudProfile, userId: session.user.id });

  const { data: planRows, error: plansError } = await supabase
    .from("saved_plans")
    .select("plan_json")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });
  if (plansError) throw plansError;
  if (planRows?.length) savePlans(planRows.map((row) => row.plan_json));
}

export async function deleteCloudData(session: Session) {
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = session.user.id;
  const { error: taskError } = await supabase.from("plan_tasks").delete().eq("user_id", userId);
  if (taskError) throw taskError;
  const { error: plansError } = await supabase.from("saved_plans").delete().eq("user_id", userId);
  if (plansError) throw plansError;
  const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", userId);
  if (profileError) throw profileError;
  const { error: settingsError } = await supabase.from("user_settings").delete().eq("user_id", userId);
  if (settingsError) throw settingsError;
}
