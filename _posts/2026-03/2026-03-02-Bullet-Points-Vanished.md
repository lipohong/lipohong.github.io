---
title: "[Forwarded] When the Bullet Points Vanished | [轉] 子彈符號失蹤記"
date: 2026-03-02 18:37:37 +0800
categories: [Frontend, CSS]
tags: [css, debug]     # TAG names should always be lowercase
toc: true
image:
  path: /assets/img/posts/2026-03-02/bullet_point.jpg
  lqip: data:image/webp;base64,UklGRpoAAABXRUJQVlA4WAoAAAAQAAAADwAABwAAQUxQSDIAAAARL0AmbZurmr57yyIiqE8oiG0bejIYEQTgqiDA9vqnsUSI6H+oAERp2HZ65qP/VIAWAFZQOCBCAAAA8AEAnQEqEAAIAAVAfCWkAALp8sF8rgRgAP7o9FDvMCkMde9PK7euH5M1m6VWoDXf2FkP3BqV0ZYbO6NA/VFIAAAA
---

Last weekend, I pushed the latest markdown article to Stan Blog[^1]. Everything looked fine in the rich-text editor, but once it landed on the portal, every unordered list sat there—completely naked—no bullets, no numbers, nothing. My first instinct was “Did I mess up the HTML?”. Spoiler: the HTML was spotless.

### Step 1 – Reproducing the Bug

- Opened an article in the WYSIWYG editor → bullets showed up.
- Saved and refreshed the public page → bullets disappeared.
- Inspected the generated HTML with Chrome DevTools → &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt; tags were intact. The problem had to be CSS.

### Step 2 – Source‐Hunting

I searched the project with "list-style" for any global “reset” rules, but nothing found.

Then I remembered that Material UI’s `CssBaseline` does a hard reset.

Popped open their docs—sure enough, `CssBaseline` sets:

```css
  ul, ol {  
    margin: 0;  
    padding: 0;  
    list-style: none;
  }
```

Bingo.

### Step 3 – Scoping the Fix

Globally undoing that reset felt risky, so I scoped a tiny override to the article container used by WangEditor: `RichContentReader.css`

```css
.w-e-text-container ul,.w-e-text-container ol {
  list-style: initial;
  margin-left: 1.5rem;
}
```

Import it in `RichContentReader.tsx`:

```typescript
import './RichContentReader.css';
```

### Step 4 Verify

Ran `npm run dev`.

- Reloaded the article page.
- Bullets and numbers were back, perfectly aligned.

![bullet points shows](/assets/img/posts/2026-03-02/d0f3c5e61ec94634b8ffc2fa5afa48e4.png)

- No side effects across the site because the rule is locked to `.w-e-text-container`.

### Takeaways
1. CSS frameworks’ global resets are convenient until they’re not.
2. Always reproduce the bug with DevTools first—HTML vs. CSS vs. JS becomes obvious.
3. Defensive scoping of overrides prevents a one-line fix from becoming tomorrow’s headache.

---

上個週末，我將最新文章推上 Stan Blog[^2]。喺編輯器入面睇一切正常，一 Publish 到門戶，list嘅「•」同數字全部蒸發。第一反應：「係咪我啲 HTML 有事？」結果 HTML 完美無瑕。

### Step1 — 重現問題

1. 喺Rich text editor 睇 → 有bullets符號。
2. Refesh之後刷新content頁 → bullets符號消失。
3. 用 Chrome DevTools 睇 HTML → &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt; 完好無缺。問題肯定係 CSS。

### Step2 — 追源頭

全項目搜尋 "list-style"去睇有冇 *reset* 規則，但無特別發現。

然後諗起 Material UI 嘅 `CssBaseline` 會做全局 reset。

翻文檔一睇，果然：

```css
  ul, ol {  
    margin: 0;  
    padding: 0;  
    list-style: none;
  }
```
Bingo。

### Step3 — 制定修正

唔想全站還原 list-style，於是只喺 WangEditor 啲內容容器 `.w-e-text-container` 入面覆寫：`RichContentReader.css`

```css
.w-e-text-container ul,.w-e-text-container ol {
  list-style: initial;
  margin-left: 1.5rem;
}
```

再喺 `RichContentReader.tsx` 引入：

```typescript
import './RichContentReader.css';
```

### Step4 驗證

- `npm run dev` 起伺服器。
- 重新載入文章頁。

![bullet points shows](/assets/img/posts/2026-03-02/d0f3c5e61ec94634b8ffc2fa5afa48e4.png)

- bullets符號完全返嚟，layout靚仔。
- 因為只針對 `.w-e-text-container`，其他頁面冇受影響。

### Take away

- CSS framework 嘅 global reset 方便，但有時會反咬一口。
- 先用 DevTools 分析，快速斷定係 HTML、CSS 定 JS。
- Override 要局部，細修一行，第二日唔洗執手尾。


## Reference

[^1]: It's the my previous modified open source blog project in ReactJS + Spring Boot. See [Stan Blog (ReactJS + Spring Boot)](https://github.com/lipohong/stan-blog)
[^2]: 呢個係我之前改寫嘅開源博客項目， 用到ReactJS + Spring Boot 。詳情請瀏覽 [Stan Blog (ReactJS + Spring Boot)](https://github.com/lipohong/stan-blog)

