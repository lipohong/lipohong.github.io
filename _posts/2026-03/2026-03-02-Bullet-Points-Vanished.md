---
title: When the Bullet Points Vanished | 子彈符號失蹤記
date: 2026-03-02 18:37:37 +0800
categories: [Language, Java]
tags: [java, debug]     # TAG names should always be lowercase
pin: true
toc: true
image:
  path: /assets/img/common/common-banner.png
  lqip: data:image/webp;base64,UklGRpoAAABXRUJQVlA4WAoAAAAQAAAADwAABwAAQUxQSDIAAAARL0AmbZurmr57yyIiqE8oiG0bejIYEQTgqiDA9vqnsUSI6H+oAERp2HZ65qP/VIAWAFZQOCBCAAAA8AEAnQEqEAAIAAVAfCWkAALp8sF8rgRgAP7o9FDvMCkMde9PK7euH5M1m6VWoDXf2FkP3BqV0ZYbO6NA/VFIAAAA
---

<p>
  Last weekend, I pushed the latest markdown article to Stan Blog. Everything looked fine in the rich-text editor, but once it landed on the portal, every unordered list sat there—completely naked—no bullets, no numbers, nothing. My first instinct was “Did I mess up the HTML?”. Spoiler: the HTML was spotless.
</p>
<p>
  <strong>
    Step 1 – Reproducing the Bug
  </strong>
</p>
<ol>
  <li>
    Opened an article in the WYSIWYG editor → bullets showed up.
  </li>
  <li>
    Saved and refreshed the public page → bullets disappeared.
  </li>
  <li>
    Inspected the generated HTML with Chrome DevTools → &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt; tags were intact. The problem had to be CSS.
  </li>
</ol>
<p>
  <strong>
    Step 2 – Source‐Hunting
  </strong>
</p>
<p>
  I searched the project with "list-style" for any global “reset” rules, but nothing found.
</p>
<p>
  Then I remembered that Material UI’s
  <code>
    &lt;CssBaseline /&gt;
  </code>
  does a hard reset.
</p>
<p>
  Popped open their docs—sure enough,
  <code>
    CssBaseline
  </code>
  sets:
</p>
<pre>
  <code >
    ul, ol {  margin: 0;  padding: 0;  list-style: none;}
  </code>
</pre>
<p>
  Bingo.
</p>
<p>
  <strong>
    Step 3 – Scoping the Fix
  </strong>
</p>
<p>
  Globally undoing that reset felt risky, so I scoped a tiny override to the article container used by WangEditor:
  <code>
    RichContentReader.css
  </code>
</p>
<pre>
  <code >
    .w-e-text-container ul,.w-e-text-container ol {  list-style: initial;  margin-left: 1.5rem;}
  </code>
</pre>
<p>
  <strong>
    Step 4 – Verify
  </strong>
</p>
<p>
  Ran
  <code>
    npm run dev
  </code>
  .
</p>
<p>
  • Reloaded the article page.
</p>
<p>
  • Bullets and numbers were back, perfectly aligned.
</p>
<p>
  <br>
</p>
<p>
  <img src="https://api-v1.stanli.site/v1/files/5/view" alt="1.png" data-href="https://api-v1.stanli.site/v1/files/5/view" style=""/>
</p>
<p>
  <br>
</p>
<ul>
  <li>
    No side effects across the site because the rule is locked to
    <code>
      .w-e-text-container
    </code>
    .
  </li>
</ul>
<p>
  <strong>
    Takeaways
  </strong>
</p>
<p>
  1. CSS frameworks’ global resets are convenient until they’re not.
</p>
<p>
  2. Always reproduce the bug with DevTools first—HTML vs. CSS vs. JS becomes obvious.
</p>
<p>
  <br>
</p>
<p>
  <br>
</p>
<p>
  <br>
</p>
<p>
  3. Defensive scoping of overrides prevents a one-line fix from becoming tomorrow’s headache.
</p>
<hr/>
<p>
  上個週末，我將最新文章推上 Stan Blog。喺編輯器入面睇一切正常，一 Publish 到門戶，list嘅「•」同數字全部蒸發。第一反應：「係咪我啲 HTML 有事？」結果 HTML 完美無瑕。
</p>
<p>
  <strong>
    Step 1 — 重現問題
  </strong>
</p>
<p>
  1. 喺Rich text editor 睇 → 有bullets符號。
</p>
<p>
  2. Refesh之後刷新content頁 → bullets符號消失。
</p>
<p>
  3. 用 Chrome DevTools 睇 HTML → &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt; 完好無缺。問題肯定係 CSS。
</p>
<p>
  <strong>
    Step2 — 追源頭
  </strong>
</p>
<p>
  全項目搜尋 "list-style"去睇有冇
  <em>
    reset
  </em>
  規則，但無特別發現。
</p>
<p>
  然後諗起 Material UI 嘅
  <code>
    &lt;CssBaseline /&gt;
  </code>
  會做全局 reset。
</p>
<p>
  翻文檔一睇，果然：
</p>
<pre>
  <code >
    ul, ol {  margin: 0;  padding: 0;  list-style: none;}
  </code>
</pre>
<p>
  Bingo。
</p>
<p>
  <strong>
    Step3 — 制定修正
  </strong>
</p>
<p>
  唔想全站還原 list-style，於是只喺 WangEditor 啲內容容器
  <code>
    .w-e-text-container
  </code>
  入面覆寫：
</p>
<p>
  <code>
    RichContentReader.css
  </code>
</p>
<pre>
  <code >
    .w-e-text-container ul,.w-e-text-container ol {  list-style: initial;  margin-left: 1.5rem;}
  </code>
</pre>
<p>
  再喺
  <code>
    RichContentReader.tsx
  </code>
  引入：
</p>
<pre>
  <code >
    import './RichContentReader.css';
  </code>
</pre>
<p>
  <strong>
    Step4 驗證
  </strong>
</p>
<ul>
  <li>
    <code>
      npm run dev
    </code>
    起伺服器。
  </li>
  <li>
    重新載入文章頁。
  </li>
</ul>
<p>
  <br>
</p>
<p>
  <img src="https://api-v1.stanli.site/v1/files/6/view" alt="1.png" data-href="https://api-v1.stanli.site/v1/files/6/view" style=""/>
</p>
<p>
  <br>
</p>
<ul>
  <li>
    bullets符號完全返嚟，layout靚仔。
  </li>
</ul>
<p>
  因為只針對
  <code>
    .w-e-text-container
  </code>
  ，其他頁面冇受影響。
</p>
<p>
  <strong>
    Take away
  </strong>
</p>
<ul>
  <li>
    CSS framework 嘅 global reset 方便，但有時會反咬一口。
  </li>
  <li>
    先用 DevTools 分析，快速斷定係 HTML、CSS 定 JS。
  </li>
  <li>
    Override 要局部，細修一行，第二日唔洗執手尾。
  </li>
</ul>
<p>
  <br>
</p>

