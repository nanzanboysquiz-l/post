"use client";

import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Link from "next/link";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function Home() {
  const [userName, setUserName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("北海道");
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [collectorFilter, setCollectorFilter] = useState<string>("");

  const [editingPostOffice, setEditingPostOffice] = useState<any | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editMemo, setEditMemo] = useState<string>("");
  const [editCollector, setEditCollector] = useState<string>("");

  useEffect(() => {
    const savedName = localStorage.getItem("fukeiin_user");
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchPostOffices = async () => {
      setIsFetching(true);
      const { data, error } = await supabase
        .from("post_offices")
        .select("*")
        .eq("prefecture", selectedPrefecture)
        .order("name", { ascending: true });

      if (error) {
        console.error("データ取得エラー:", error.message);
      } else {
        setPostOffices(data || []);
      }
      setIsFetching(false);
    };

    fetchPostOffices();
  }, [selectedPrefecture, isLoggedIn]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "-");

    setPostOffices(
      postOffices.map((po) => {
        if (po.id === id) {
          return {
            ...po,
            is_collected: newStatus,
            collected_date: newStatus ? today : null,
            collector_name: newStatus ? userName : null,
          };
        }
        return po;
      })
    );

    const { error } = await supabase
      .from("post_offices")
      .update({
        is_collected: newStatus,
        collected_date: newStatus ? today : null,
        collector_name: newStatus ? userName : null,
      })
      .eq("id", id);

    if (error) {
      alert("データベースの更新に失敗しました: " + error.message);
    }
  };

  const openEditModal = (po: any) => {
    setEditingPostOffice(po);
    setEditDate(po.collected_date || "");
    setEditMemo(po.memo || "");
    setEditCollector(po.collector_name || "");
  };

  const saveEdit = async () => {
    if (!editingPostOffice) return;

    setPostOffices(
      postOffices.map((po) =>
        po.id === editingPostOffice.id
          ? { 
              ...po, 
              collected_date: editDate || null, 
              memo: editMemo,
              collector_name: editCollector || null
            }
          : po
      )
    );

    const { error } = await supabase
      .from("post_offices")
      .update({
        collected_date: editDate || null,
        memo: editMemo,
        collector_name: editCollector || null,
      })
      .eq("id", editingPostOffice.id);

    if (error) {
      alert("更新に失敗しました: " + error.message);
    }

    setEditingPostOffice(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() === "") {
      alert("名前を入力してください。");
      return;
    }
    localStorage.setItem("fukeiin_user", userName);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("fukeiin_user");
    setUserName("");
    setIsLoggedIn(false);
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
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Rits地理研風景印データベース
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                お名前を入力してください
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：地理研太郎"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition"
            >
              はじめる
            </button>
          </form>
        </div>
      </main>
    );
  }

  const filteredPostOffices = postOffices.filter((po) => {
    if (searchQuery && !po.name.includes(searchQuery)) {
      return false;
    }
    if (filterType === "collected" && !po.is_collected) {
      return false;
    }
    if (filterType === "uncollected" && po.is_collected) {
      return false;
    }
    if (collectorFilter && (!po.collector_name || !po.collector_name.includes(collectorFilter))) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 relative">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow print:hidden">
        <h1 className="text-xl font-bold text-gray-800">Rits地理研風景印データベース</h1>
        <div className="flex items-center gap-4">
          <Link href="/collectors" className="text-sm bg-red-800 text-white py-1 px-3 rounded hover:bg-red-900 transition font-medium">
            収集者別リストを見る
          </Link>
          <span className="text-gray-600 font-medium border-l pl-4 ml-2">{userName} さん</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-200 text-gray-700 py-1 px-3 rounded hover:bg-gray-300 transition"
          >
            名前を変更
          </button>
        </div>
      </header>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rits地理研風景印データベース - {selectedPrefecture}</h1>
        <p className="text-gray-600">出力日: {new Date().toLocaleDateString("ja-JP")}</p>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6 space-y-4 print:hidden">
        <div>
          <label className="block text-gray-700 font-medium mb-2">都道府県を選択</label>
          <select
            value={selectedPrefecture}
            onChange={(e) => setSelectedPrefecture(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2 text-sm">郵便局名で検索</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="例：札幌中央"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2 text-sm">収集者で検索</label>
            <input
              type="text"
              value={collectorFilter}
              onChange={(e) => setCollectorFilter(e.target.value)}
              placeholder="例：地理研太郎"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">収集状況</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">すべて表示</option>
              <option value="collected">取得済のみ</option>
              <option value="uncollected">未取得のみ</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow print:shadow-none print:p-0">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-bold">
            {selectedPrefecture}の郵便局 ({filteredPostOffices.length}局)
          </h2>
          <button
            onClick={handlePrint}
            className="text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors print:hidden"
          >
            PDFで出力 (印刷)
          </button>
        </div>
        
        {isFetching ? (
          <p className="text-gray-500 py-4 print:hidden">データを取得中...</p>
        ) : (
          <ul className="space-y-2">
            {filteredPostOffices.map((po) => (
              <li key={po.id} className="flex justify-between items-center p-3 hover:bg-gray-50 border-b last:border-0 print:border-b-gray-300 print:break-inside-avoid">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{po.name}</span>
                  {po.collector_name && (
                    <span className="text-xs text-gray-600 mt-1">収集者: {po.collector_name}</span>
                  )}
                  {po.memo && (
                    <span className="text-xs text-gray-500 mt-1">メモ: {po.memo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      po.is_collected 
                        ? "bg-green-100 text-green-800 border-green-300" 
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {po.is_collected ? `取得済 (${po.collected_date})` : "未取得"}
                  </span>
                  <button
                    onClick={() => openEditModal(po)}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors print:hidden"
                  >
                    編集
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {filteredPostOffices.length === 0 && !isFetching && (
          <p className="text-gray-500 mt-4">条件に一致する郵便局はありません。</p>
        )}
      </div>

      {editingPostOffice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingPostOffice.name} の編集</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">取得日</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">収集者</label>
                <input
                  type="text"
                  value={editCollector}
                  onChange={(e) => setEditCollector(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">メモ</label>
                <textarea
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingPostOffice(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}