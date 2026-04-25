# 🌌 ThoughtSpace

> **「あなたの思考を、宇宙にする。」**
>
> X(Twitter)が時系列で思考を流すなら、ThoughtSpaceは**思考を空間に配置**する次世代SNS。

[Live Demo →](https://guttyanneruuuuuu.github.io/service9/)

---

## 🚀 What is this?

ThoughtSpaceは、SNSの新しい**フォーマット**です。

| | 既存SNS | ThoughtSpace |
|---|---|---|
| 構造 | 時系列 / グリッド | **空間配置(2D)** |
| 関連性 | 暗黙(アルゴ) | **明示的なワームホール** |
| バックエンド | 必要 | **不要(URL自体がデータ)** |
| 広告 | あり | **ゼロ** |
| 登録 | 必須 | **不要** |
| AI | 依存 | **完全人間生成** |

## ✨ コア機能

- 🌟 **4種のオブジェ** — 星(アイデア)/惑星(プロジェクト)/星雲(感情)/ノート(メモ)
- 🕳️ **ワームホール** — 関連思考を視覚的に接続
- 🔗 **URL共有** — バックエンドゼロ、宇宙データはURLに圧縮
- 🛡️ **完全プライバシー** — 全データブラウザ内、Cookie/トラッカーゼロ
- ⚡ **AI不使用** — 純粋に人間の思考を記録するための場所
- ↺ **Undo/Redo** — Ctrl+Z/Y
- 📱 **モバイル完全対応** — タッチ/ピンチズーム

## 💰 ビジネスモデル(将来展開)

1. **ThoughtSpace Pro (¥500/月)** — 無制限ノード、独自ドメイン、カスタムテーマ
2. **Embed API** — 個人/企業サイトに自分の宇宙を埋め込み
3. **Insights** — 思考パターン分析(Pro限定)
4. **検証バッジ** — クリエイター認証

完全クライアントサイドなので**サーバーコスト¥0**で運営可能。
ユーザーが増えてからプレミアム機能で収益化する典型的なフリーミアムモデル。

## 🏗 技術スタック

- **Pure HTML/CSS/JS** — フレームワーク不使用、依存ゼロ
- **SVGベース** — 滑らかなレンダリング、無限ズーム
- **localStorage + URL** — Firebase等不要、サーバーコスト¥0
- **GitHub Pages** — 無料ホスティング

## 🔐 セキュリティ

- CSP(Content Security Policy)厳格設定
- XSS防止: 全テキストは`textContent`/sanitization経由
- HTML属性ホワイトリスト
- referrer-policy: strict-origin-when-cross-origin
- X-Content-Type-Options: nosniff

## 📊 アナリティクス

完全自前実装(localStorage)。第三者送信ゼロ、Do-Not-Trackリスペクト。

## 🛠 開発

```bash
git clone https://github.com/guttyanneruuuuuu/service9.git
cd service9
# 静的サイトなのでローカルで開くだけ
python3 -m http.server 8000
# → http://localhost:8000
```

## 📜 ライセンス

MIT

---

Built for a generation that thinks in space, not in time. 🌌
