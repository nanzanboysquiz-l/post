"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "海外"
];

export default function AddPostOffice() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // フォームの入力状態
  const [prefecture, setPrefecture] = useState<string>("北海道");
  const [municipality, setMunicipality] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isCollected, setIsCollected] = useState<boolean>(false);
  const [collectedDate, setCollectedDate] = useState<string>("");
  const [collectorName, setCollectorName] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const savedName = localStorage.getItem("fukeiin_user");
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
      // 初期値としてログインユーザー名をセットしておく
      setCollectorName(savedName);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("郵便局名を入力してください。");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      prefecture,
      municipality: municipality.trim() || null,
      name: name.trim(),
      is_collected: isCollected,
      collected_date: isCollected && collectedDate ? collectedDate : null,
      collector_name: isCollected && collectorName ? collectorName.trim() : null,
      memo: memo.trim() || null,
    };

    const { error } = await supabase.from("post_offices").insert([payload]);

    if (error) {
      alert("登録に失敗しました: " + error.message);
      setIsSubmitting(false);
    } else {
      alert(`${name} を登録しました。`);
      // 連続で登録しやすいように一部の項目をリセット
      setName("");
      setMunicipality("");
      setIsCollected(false);
      setMemo("");
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="mb-4 text-black">名前が登録されていません。</p>
          <Link href="/" className="text-blue-600 underline">メインページに戻る</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 relative">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow">
        <h1 className="text-xl font-bold text-gray-800">郵便局を手動登録</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm bg-gray-200 text-gray-700 py-1 px-3 rounded hover:bg-gray-300 transition font-medium">
            メインページに戻る
          </Link>
        </div>
      </header>

      <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">都道府県 <span className="text-red-500">*</span></label>
            {/* ▼ iPad文字薄れ対策: text-black bg-white opacity-100 を追加 */}
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white opacity-100"
              required
            >
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">市区町村</label>
            {/* ▼ iPad文字薄れ対策を追加 */}
            <input
              type="text"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="例：札幌市"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white opacity-100 placeholder:text-gray-500 placeholder:opacity-100"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">郵便局名 <span className="text-red-500">*</span></label>
            {/* ▼ iPad文字薄れ対策を追加 */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：札幌中央郵便局"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white opacity-100 placeholder:text-gray-500 placeholder:opacity-100"
              required
            />
          </div>

          <div className="border-t pt-4 pb-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCollected}
                onChange={(e) => {
                  setIsCollected(e.target.checked);
                  if (e.target.checked && !collectedDate) {
                    // チェックを入れたら今日の日付をデフォルトセット
                    const today = new Date().toLocaleDateString("ja-JP", {
                      year: "numeric", month: "2-digit", day: "2-digit"
                    }).replace(/\//g, "-");
                    setCollectedDate(today);
                  }
                }}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-100"
              />
              <span className="text-gray-800 font-bold">すでに風景印を取得済みとして登録する</span>
            </label>
          </div>

          {isCollected && (
            <div className="bg-gray-50 p-4 rounded border space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">取得日</label>
                {/* ▼ iPad文字薄れ対策を追加 */}
                <input
                  type="date"
                  value={collectedDate}
                  onChange={(e) => setCollectedDate(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white opacity-100"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-bold mb-2">収集者</label>
                {/* ▼ iPad文字薄れ対策を追加 */}
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white opacity-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-2">メモ</label>
            {/* ▼ iPad文字薄れ対策を追加 */}
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="例：ポストカードで押印"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white opacity-100 placeholder:text-gray-500 placeholder:opacity-100"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isSubmitting ? "登録中..." : "データベースに登録する"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}