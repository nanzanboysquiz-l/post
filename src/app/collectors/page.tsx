"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import Link from "next/link";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "海外"
];

export default function CollectorsPage() {
  const [userName, setUserName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [filterPrefecture, setFilterPrefecture] = useState<string>("all");
  // 収集者リストを保存するための状態を追加
  const [uniqueCollectors, setUniqueCollectors] = useState<string[]>([]);

  useEffect(() => {
    const savedName = localStorage.getItem("fukeiin_user");
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
    }
    
    // データベースから収集者の名前をすべて取得して重複をなくす処理
    const fetchCollectors = async () => {
      const { data, error } = await supabase
        .from("post_offices")
        .select("collector_name")
        .not("collector_name", "is", null);
        
      if (!error && data) {
        const names = Array.from(new Set(data.map((po) => po.collector_name).filter(Boolean))).sort();
        setUniqueCollectors(names as string[]);
      }
      setIsLoading(false);
    };

    fetchCollectors();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsFetching(true);
    setHasSearched(true);
    
    // プルダウンでの選択になったため、あいまい検索(ilike)から完全一致検索(eq)に変更
    const { data, error } = await supabase
      .from("post_offices")
      .select("*")
      .eq("collector_name", searchQuery)
      .order("prefecture")
      .order("name");

    if (error) {
      console.error("データ取得エラー:", error.message);
    } else {
      setPostOffices(data || []);
    }
    setIsFetching(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="mb-4">名前が登録されていません。</p>
          <Link href="/" className="text-blue-600 underline">メインページに戻る</Link>
        </div>
      </main>
    );
  }

  const filteredPostOffices = postOffices.filter((po) => {
    if (filterPrefecture !== "all" && po.prefecture !== filterPrefecture) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 relative">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow print:hidden">
        <h1 className="text-xl font-bold text-gray-800">収集者別リスト検索</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm bg-red-800 text-white py-1 px-3 rounded hover:bg-red-900 transition font-medium">
            メインページ
          </Link>
        </div>
      </header>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          「{searchQuery}」さんの収集リスト
          {filterPrefecture !== "all" ? ` (${filterPrefecture})` : ""}
        </h1>
        <p className="text-gray-600">出力日: {new Date().toLocaleDateString("ja-JP")}</p>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6 print:hidden">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">収集者の名前を選択</label>
              {/* ▼ iPad文字薄れ対策: text-black bg-white opacity-100 を追加 */}
              <select
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-black bg-white opacity-100"
              >
                <option value="">選択してください</option>
                {uniqueCollectors.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isFetching || !searchQuery}
                className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 transition w-full sm:w-auto disabled:bg-gray-400"
              >
                検索
              </button>
            </div>
          </div>
        </form>

        {hasSearched && !isFetching && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-gray-700 font-medium mb-2 text-sm">都道府県で絞り込む</label>
            {/* ▼ iPad文字薄れ対策: text-black bg-white opacity-100 を追加 */}
            <select
              value={filterPrefecture}
              onChange={(e) => setFilterPrefecture(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-black bg-white opacity-100"
            >
              <option value="all">すべての都道府県</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hasSearched && (
        <div className="bg-white p-6 rounded shadow print:shadow-none print:p-0">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">
              検索結果 ({filteredPostOffices.length}局)
            </h2>
            {filteredPostOffices.length > 0 && (
              <button
                onClick={handlePrint}
                className="text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors print:hidden"
              >
                PDFで出力 (印刷)
              </button>
            )}
          </div>
          
          {isFetching ? (
            <p className="text-gray-500 py-4 print:hidden">検索中...</p>
          ) : (
            <ul className="space-y-2">
              {filteredPostOffices.map((po) => (
                <li key={po.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 hover:bg-gray-50 border-b last:border-0 print:border-b-gray-300 print:break-inside-avoid">
                  <div className="flex flex-col mb-2 sm:mb-0">
                    <span className="font-medium text-gray-900">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mr-2">{po.prefecture}</span>
                      {po.name}
                    </span>
                    {po.memo && (
                      <span className="text-xs text-gray-500 mt-1">メモ: {po.memo}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-full">
                      取得済 ({po.collected_date})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {filteredPostOffices.length === 0 && !isFetching && (
            <p className="text-gray-500 mt-4">該当する収集データはありません。</p>
          )}
        </div>
      )}
    </main>
  );
}