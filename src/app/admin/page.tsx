"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { supabase } from "../../supabase";

type PostOffice = {
  id: string;
  name: string;
  prefecture: string;
  municipality: string | null;
  county: string | null;
  created_at: string | null;
};

type ActivityLog = {
  id: number;
  post_office_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

type CoordinateDraft = { latitude: string; longitude: string };

function changedFields(log: ActivityLog) {
  if (log.action !== "UPDATE" || !log.old_data || !log.new_data) return [];
  return Object.keys(log.new_data).filter(
    (key) => JSON.stringify(log.old_data?.[key]) !== JSON.stringify(log.new_data?.[key]),
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [missingCoordinates, setMissingCoordinates] = useState<PostOffice[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CoordinateDraft>>({});
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const isAdmin = Boolean(session && authorizedUserId === session.user.id);
  const checkingAdmin = Boolean(session && checkedUserId !== session.user.id);

  const loadAdminData = useCallback(async () => {
    setBusy(true);
    setNotice("");
    const [officePages, logsResult] = await Promise.all([
      (async () => {
        const offices: PostOffice[] = [];
        for (let offset = 0; ; offset += 1000) {
          const result = await supabase
            .from("post_offices")
            .select("id,name,prefecture,municipality,county,created_at")
            .is("latitude", null)
            .order("prefecture")
            .order("name")
            .range(offset, offset + 999);
          if (result.error) return { data: null, error: result.error };
          offices.push(...((result.data || []) as PostOffice[]));
          if ((result.data || []).length < 1000) return { data: offices, error: null };
        }
      })(),
      supabase
        .from("post_office_activity_logs")
        .select("id,post_office_id,action,actor_id,changed_at,old_data,new_data")
        .order("changed_at", { ascending: false })
        .limit(100),
    ]);

    if (officePages.error || logsResult.error) {
      const message = officePages.error?.message || logsResult.error?.message;
      setNotice(`管理者データを読み込めませんでした: ${message}`);
    } else {
      const offices = officePages.data || [];
      setMissingCoordinates(offices);
      setDrafts((current) => {
        const next = { ...current };
        offices.forEach((office) => {
          if (!next[office.id]) next[office.id] = { latitude: "", longitude: "" };
        });
        return next;
      });
      setLogs((logsResult.data || []) as ActivityLog[]);
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setNotice(`ログイン状態を確認できませんでした: ${error.message}`);
      setSession(data.session);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    let active = true;
    void supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          setNotice(`管理者権限を確認できませんでした: ${error.message}`);
          setAuthorizedUserId(null);
          setCheckedUserId(session.user.id);
        } else if (!data) {
          setNotice("このアカウントには管理者権限がありません。");
          setAuthorizedUserId(null);
          setCheckedUserId(session.user.id);
          await supabase.auth.signOut();
        } else {
          setNotice("");
          setAuthorizedUserId(session.user.id);
          setCheckedUserId(session.user.id);
          void loadAdminData();
        }
      });

    return () => {
      active = false;
    };
  }, [session, loadAdminData]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setNotice(`ログインできませんでした: ${error.message}`);
    setBusy(false);
  }

  async function handleLogout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setNotice(`ログアウトできませんでした: ${error.message}`);
    setBusy(false);
  }

  async function saveCoordinates(office: PostOffice) {
    const draft = drafts[office.id];
    const latitude = Number(draft?.latitude);
    const longitude = Number(draft?.longitude);
    if (
      !draft?.latitude.trim() ||
      !draft.longitude.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setNotice(`${office.name}: 緯度・経度を正しい範囲で入力してください。`);
      return;
    }

    setBusy(true);
    setNotice("");
    const { error } = await supabase.rpc("set_post_office_coordinates", {
      target_id: office.id,
      target_latitude: latitude,
      target_longitude: longitude,
    });
    if (error) {
      setNotice(`${office.name}の座標を保存できませんでした: ${error.message}`);
    } else {
      setMissingCoordinates((current) => current.filter((item) => item.id !== office.id));
      setNotice(`${office.name}の座標を登録しました。地図を再読み込みすると反映されます。`);
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <header className="mb-6 flex flex-col gap-3 rounded bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">管理者画面</h1>
          <Link href="/" className="text-sm text-blue-700 underline">メインページへ戻る</Link>
        </div>
        {session && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-800 disabled:opacity-50"
          >
            ログアウト
          </button>
        )}
      </header>

      {notice && (
        <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {notice}
        </p>
      )}

      {authLoading || checkingAdmin ? (
        <p className="rounded bg-white p-6 text-gray-600">認証を確認中...</p>
      ) : !session ? (
        <form onSubmit={handleLogin} className="mx-auto max-w-md space-y-4 rounded bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800">管理者ログイン</h2>
          <label className="block text-sm font-medium text-gray-700">
            ID（メールアドレス）
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-black"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            パスワード
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-black"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {busy ? "確認中..." : "ログイン"}
          </button>
        </form>
      ) : !isAdmin ? (
        <p className="rounded bg-white p-6 text-gray-600">このアカウントの管理者権限を確認できませんでした。</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded bg-white p-4 shadow sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  座標未登録局（{missingCoordinates.length}局）
                </h2>
                <p className="text-sm text-gray-600">座標を登録すると、次回の地図読み込み時にピンが表示されます。</p>
              </div>
              <button
                type="button"
                onClick={() => void loadAdminData()}
                disabled={busy}
                className="min-h-10 w-full rounded bg-gray-100 px-3 py-2 text-sm text-gray-800 disabled:opacity-50 sm:w-auto"
              >
                更新
              </button>
            </div>
            {missingCoordinates.length === 0 ? (
              <p className="text-sm text-gray-600">座標未登録の郵便局はありません。</p>
            ) : (
              <ul className="divide-y">
                {missingCoordinates.map((office) => (
                  <li key={office.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] md:items-end">
                  <div className="min-w-0">
                      <p className="font-medium text-gray-900">{office.name}</p>
                      <p className="text-sm text-gray-600">
                        {[office.prefecture, office.county, office.municipality].filter(Boolean).join(" ")}
                      </p>
                    </div>
                    <label className="text-sm text-gray-700">
                      緯度
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={drafts[office.id]?.latitude ?? ""}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [office.id]: {
                              latitude: event.target.value,
                              longitude: current[office.id]?.longitude ?? "",
                            },
                          }))
                        }
                        className="mt-1 w-full rounded border border-gray-300 p-2 text-black"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      経度
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={drafts[office.id]?.longitude ?? ""}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [office.id]: {
                              latitude: current[office.id]?.latitude ?? "",
                              longitude: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded border border-gray-300 p-2 text-black"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveCoordinates(office)}
                      disabled={busy}
                      className="min-h-10 w-full rounded bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 md:w-auto"
                    >
                      座標を登録
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded bg-white p-4 shadow sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-800">新規登録・編集ログ（最新100件）</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-600">ログはまだありません。</p>
            ) : (
              <ol className="space-y-3">
                {logs.map((log) => (
                  <li key={log.id} className="rounded border border-gray-200 p-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <time dateTime={log.changed_at} className="text-gray-600">
                        {new Date(log.changed_at).toLocaleString("ja-JP")}
                      </time>
                      <span className="font-bold text-gray-900">
                        {log.action === "INSERT" ? "新規登録" : log.action === "UPDATE" ? "編集" : "削除"}
                      </span>
                      <span className="text-gray-700">
                        {String(log.new_data?.name ?? log.old_data?.name ?? "郵便局")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      変更項目: {log.action === "INSERT"
                        ? "新規登録"
                        : log.action === "DELETE"
                          ? "削除"
                          : changedFields(log).join("、") || "変更なし"}
                      {" ・ "}実行者: {log.actor_id || "一般ユーザー"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
