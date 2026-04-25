/* lp.js — Landing Page */
(function (global) {
  'use strict';
  const { el } = global.TS.sec;

  function renderNav() {
    return el('nav', { class: 'nav' }, [
      el('a', { class: 'brand', attrs: { href: '#/' } }, [
        el('span', { class: 'brand-mark' }),
        el('strong', { text: 'ThoughtSpace' })
      ]),
      el('div', { class: 'nav-links' }, [
        el('a', { attrs: { href: '#/' }, text: 'Home', class: 'hide-mobile' }),
        el('a', { attrs: { href: '#/manifesto' }, text: 'Manifesto', class: 'hide-mobile' }),
        el('a', { class: 'btn-primary', attrs: { href: '#/app' }, text: 'Launch App' })
      ])
    ]);
  }

  function statBlock(num, lbl) {
    return el('div', { class: 'hero-stat' }, [
      el('div', { class: 'num', text: num }),
      el('div', { class: 'lbl', text: lbl })
    ]);
  }

  function renderHero() {
    return el('section', { class: 'hero' }, [
      el('span', { class: 'eyebrow' }, [
        el('span', { class: 'dot' }),
        document.createTextNode('NEW FORMAT · BETA · 2025')
      ]),
      el('h1', {}, [
        document.createTextNode('あなたの思考を、'),
        el('span', { class: 'accent', text: '宇宙にする。' })
      ]),
      el('p', { class: 'sub', text: 'Xは時系列で思考を流す。Instagramは画像を並べる。ThoughtSpaceは、あなたの思考を「点」ではなく「星」として宇宙に配置する、まったく新しいSNSです。' }),
      el('div', { class: 'hero-cta' }, [
        el('a', { class: 'cta-big', attrs: { href: '#/app' }, text: '✨ 自分の宇宙を作る' }),
        el('a', { class: 'cta-ghost', attrs: { href: '#/u/eyJ2IjoxLCJuIjoiV2VsY29tZSB0byBUaG91Z2h0U3BhY2UiLCJhIjoiVGhvdWdodFNwYWNlIiwiYiI6IkEgc2FtcGxlIHVuaXZlcnNlIHRvIGV4cGxvcmUiLCJjIjoiIzdjNWNmZiIsIk4iOlt7ImkiOiJuMSIsIngiOjAsInkiOi0xODAsInQiOiJJZGVhIiwiYyI6IiM3YzVjZmYiLCJzIjoic3RhciIsInoiOjgwfSx7ImkiOiJuMiIsIngiOi0yMjAsInkiOjQwLCJ0IjoiUHJvamVjdCIsImMiOiIjMDBlNmZmIiwicyI6InBsYW5ldCIsInoiOjgwfSx7ImkiOiJuMyIsIngiOjIyMCwieSI6NDAsInQiOiJGZWVsaW5nIiwiYyI6IiNmZjRmYTMiLCJzIjoibmVidWxhIiwieiI6OTB9LHsiaSI6Im40IiwieCI6MCwieSI6MjQwLCJ0IjoiTm90ZSIsImMiOiIjZmJiZjI0IiwicyI6Im5vdGUiLCJ6Ijo3MH0seyJpIjoibjUiLCJ4IjotMzYwLCJ5IjotMTIwLCJ0IjoiQ3VyaW9zaXR5IiwiYyI6IiNhNzhiZmEiLCJzIjoic3RhciIsInoiOjYwfSx7ImkiOiJuNiIsIngiOjM2MCwieSI6LTEyMCwidCI6IkRyZWFtIiwiYyI6IiM0YWRlODAiLCJzIjoic3RhciIsInoiOjYwfV0sIkUiOlt7ImkiOiJlMSIsImYiOiJuMSIsInQiOiJuMiIsImsiOiJub3JtYWwifSx7ImkiOiJlMiIsImYiOiJuMSIsInQiOiJuMyIsImsiOiJub3JtYWwifSx7ImkiOiJlMyIsImYiOiJuMiIsInQiOiJuNCIsImsiOiJub3JtYWwifSx7ImkiOiJlNCIsImYiOiJuMyIsInQiOiJuNCIsImsiOiJub3JtYWwifSx7ImkiOiJlNSIsImYiOiJuNSIsInQiOiJuMSIsImsiOiJ3b3JtaG9sZSJ9LHsiaSI6ImU2IiwiZiI6Im42IiwidCI6Im4xIiwiayI6Indvcm1ob2xlIn1dfQ' }, text: '🌌 サンプル宇宙を見る' })
      ]),
      el('div', { class: 'hero-stats' }, [
        statBlock('∞', 'NODES'),
        statBlock('¥0', 'PRICE'),
        statBlock('100%', 'YOURS'),
        statBlock('0', 'BACKEND')
      ])
    ]);
  }

  function renderFeatures() {
    const features = [
      { ico: '🌌', t: '思考は、星になる', d: '投稿は時系列ではなく、宇宙の中の好きな場所に配置される。あなたの脳の構造そのものが可視化される。' },
      { ico: '🕳️', t: 'ワームホールで繋ぐ', d: '関連する2つのアイデアを「ワームホール」で接続。発想の連鎖が、目に見える線になる。' },
      { ico: '🔗', t: 'リンク1つで共有', d: 'バックエンドは存在しません。あなたの宇宙はURLそのものに圧縮されます。SNSに貼るだけで誰でも見れる。' },
      { ico: '🪐', t: '4種類のオブジェ', d: '星(アイデア)、惑星(プロジェクト)、星雲(感情)、ノート(メモ)。思考の種類で形を変える。' },
      { ico: '🛡️', t: '完全プライバシー', d: '全データはあなたのブラウザの中。サーバーに送信ゼロ。Do Not Track対応。' },
      { ico: '⚡', t: 'AI不要', d: '生成AIではなく、あなた自身の思考そのものを記録します。だからこそ価値がある。' }
    ];
    return el('section', { class: 'section' }, [
      el('div', { class: 'container' }, [
        el('h2', { text: 'なぜ、思考は時系列じゃないのか。' }),
        el('p', { class: 'lead', text: '人間の脳は、考えを「並べる」のではなく「繋げる」。ThoughtSpaceは、その自然な構造を初めてSNSに持ち込みます。' }),
        el('div', { class: 'cards' }, features.map(f =>
          el('div', { class: 'card' }, [
            el('div', { class: 'ico', text: f.ico }),
            el('h3', { text: f.t }),
            el('p', { text: f.d })
          ])
        ))
      ])
    ]);
  }

  function renderCompare() {
    return el('section', { class: 'section' }, [
      el('div', { class: 'container' }, [
        el('h2', { text: '次の時代のSNSの形。' }),
        el('p', { class: 'lead', text: 'すべてのプラットフォームには「フォーマット」があります。Twitterはタイムライン、Instagramはグリッド。次は、空間です。' }),
        el('div', { class: 'compare' }, [
          el('div', { class: 'old' }, [
            el('h4', { text: '今までのSNS' }),
            el('ul', {}, [
              el('li', { text: '時系列で流れる → 思考が消える' }),
              el('li', { text: '関連性は表示されない' }),
              el('li', { text: 'バズった投稿だけが残る' }),
              el('li', { text: 'アルゴリズムに支配される' }),
              el('li', { text: '広告でフィードが汚れる' })
            ])
          ]),
          el('div', { class: 'new' }, [
            el('h4', { text: 'ThoughtSpace' }),
            el('ul', {}, [
              el('li', { text: '空間に配置 → 思考が積み重なる' }),
              el('li', { text: 'ワームホールで関連性を可視化' }),
              el('li', { text: 'すべてのアイデアが等価' }),
              el('li', { text: 'アルゴリズムなし、あなたが配置' }),
              el('li', { text: '広告ゼロ、プライバシー完全保護' })
            ])
          ])
        ])
      ])
    ]);
  }

  function renderHow() {
    const steps = [
      { n: '01', t: 'ダブルクリックでノードを作る', d: 'キャンバスをダブルクリックすれば、そこに「思考の星」が誕生する。' },
      { n: '02', t: 'ドラッグで自由に配置', d: '時系列でも、カテゴリ別でも、感覚的でも。あなたの脳の地図を描いてください。' },
      { n: '03', t: 'ワームホールで繋ぐ', d: '2つのノードを選んで接続。アイデアの連鎖が見える化される。' },
      { n: '04', t: 'リンクをコピーして共有', d: 'あなたの宇宙はURL1つに圧縮されます。XやLINEに貼るだけで誰でも閲覧可能。' }
    ];
    return el('section', { class: 'section' }, [
      el('div', { class: 'container' }, [
        el('h2', { text: '使い方は4ステップ。' }),
        el('p', { class: 'lead', text: '登録不要。ログイン不要。アプリのインストールも不要。今すぐブラウザだけで始められます。' }),
        el('div', { class: 'cards' }, steps.map(s =>
          el('div', { class: 'card' }, [
            el('div', { class: 'ico', text: s.n }),
            el('h3', { text: s.t }),
            el('p', { text: s.d })
          ])
        )),
        el('div', { class: 'hero-cta' }, [
          el('a', { class: 'cta-big', attrs: { href: '#/app' }, text: '🚀 今すぐ始める (完全無料)' })
        ])
      ])
    ]);
  }

  function renderFooter() {
    return el('footer', { class: 'lp-footer' }, [
      el('div', { class: 'links' }, [
        el('a', { attrs: { href: '#/manifesto' }, text: 'Manifesto' }),
        el('a', { attrs: { href: '#/privacy' }, text: 'Privacy' }),
        el('a', { attrs: { href: '#/app' }, text: 'Launch App' })
      ]),
      el('div', { text: '© 2025 ThoughtSpace — Built for a generation that thinks in space, not in time.' })
    ]);
  }

  function textBlock(text) { return el('p', { class: 'lead', text }); }

  function renderManifesto() {
    return el('section', { class: 'section' }, [
      el('div', { class: 'container' }, [
        el('h2', { text: 'Manifesto' }),
        el('p', { class: 'lead', text: '私たちは、思考を時系列に縛るのをやめる。' }),
        textBlock('Twitterは便利だ。でも、私たちの脳の中の思考は時系列じゃない。アイデアは関連で繋がっている。記憶は空間で記憶される。'),
        textBlock('ThoughtSpaceは、その自然な構造をデジタル空間に持ち込む最初のSNSだ。'),
        textBlock('ここでは「いいね」の数は問題じゃない。あなたの思考の宇宙が、どれだけ豊かかが問題なのだ。'),
        textBlock('そして私たちは、いつかこの「思考の空間」が、人と人との物理的距離も超えると信じている。あなたの宇宙が、誰かの宇宙とワームホールで繋がる時、それは小さな「どこでもドア」になる。'),
        el('div', { class: 'hero-cta' }, [
          el('a', { class: 'cta-big', attrs: { href: '#/app' }, text: 'あなたの宇宙を始める' })
        ])
      ])
    ]);
  }

  function renderPrivacy() {
    return el('section', { class: 'section' }, [
      el('div', { class: 'container' }, [
        el('h2', { text: 'プライバシーポリシー' }),
        el('p', { class: 'lead', text: 'シンプルに言うと、私たちはあなたのデータを集めません。' }),
        textBlock('1. ThoughtSpaceは静的サイトです。バックエンドサーバーがありません。'),
        textBlock('2. あなたが作成した宇宙データは、あなたのブラウザのlocalStorageにのみ保存されます。'),
        textBlock('3. 共有URLにはあなたの宇宙データが圧縮されて含まれますが、私たちのサーバーには送信されません。'),
        textBlock('4. アクセス解析はブラウザ内でのみ動作し、第三者に送信されません。Do Not Trackも尊重します。'),
        textBlock('5. Cookieは使用していません。')
      ])
    ]);
  }

  function render(route) {
    const root = document.getElementById('page-lp');
    root.innerHTML = '';
    root.appendChild(renderNav());
    const wrapper = el('div', { class: 'lp' });
    if (route === 'manifesto') {
      wrapper.appendChild(renderManifesto());
    } else if (route === 'privacy') {
      wrapper.appendChild(renderPrivacy());
    } else {
      wrapper.appendChild(renderHero());
      wrapper.appendChild(renderFeatures());
      wrapper.appendChild(renderCompare());
      wrapper.appendChild(renderHow());
    }
    root.appendChild(wrapper);
    root.appendChild(renderFooter());
  }

  global.TS = global.TS || {};
  global.TS.lp = { render };
})(window);
