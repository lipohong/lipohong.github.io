---
title: "TOTP Series Part 4: Defeating Replay Attacks, Mitigating Clock Drift, and Redis LUA Scripts | TOTP 系列之四：擊破重放攻擊、化解時間漂移與 Redis LUA 腳本"
date: 2026-04-27 11:30:00 +0800
categories: [Security, TOTP Series]
tags: [totp, security, backend, replay-protection, clock-sync, algorithms, redis, lua, assisted_by_ai]
toc: true
---

## The Vulnerability of Valid Codes

By definition, a Time-based One-Time Password (TOTP) is mathematically valid for a specific window of time—usually exactly 30 seconds. This 30-second window is an absolute necessity because humans are not machines. Users need time to open their authenticator app, read the 6-digit code, mentally hold it in short-term memory, type it into the browser's input fields, and submit the form over the network. 

However, this generous 30-second window creates a severe, inherent vulnerability: **The Replay Attack**. 

Imagine Alice generates a code, types it in rapidly, and successfully logs in within 5 seconds. The code she used is technically still mathematically valid for another 25 seconds! If a malicious actor (or a man-in-the-middle proxy script) intercepts that HTTP payload over a compromised coffee shop Wi-Fi (perhaps via SSL stripping), they can immediately "replay" that exact same payload back to the server. 

If the server relies *only* on the pure mathematical HMAC validation provided by `otplib`, it will calculate the current time window, see that the attacker's replayed code matches perfectly, and blindly grant the attacker full access to Alice's account.

Furthermore, we face a second, infuriating physical reality: **Clock Drift**. A user's smartphone internal clock is rarely synchronized perfectly with the server's highly accurate NTP (Network Time Protocol) clock. If a user's phone is just 45 seconds behind the server (perhaps because they haven't connected to a cell tower recently), they will constantly fail the 2FA challenge, leading to extreme frustration and helpdesk tickets.

In this deep dive, we will explore the advanced algorithms and architectural patterns needed to completely mitigate both Replay Attacks and Clock Drift. We will transition from stateless validation to stateful validation utilizing Redis, and we will write custom LUA scripts to prevent race conditions during highly concurrent attacks.

---

## Deep Dive: The Stateful Replay Protection Pattern

To prevent replay attacks, our backend must undergo a fundamental architectural shift: it must transition from being purely *stateless* (where it only performs a mathematical validation calculation) to being *stateful*. 

We must implement a system that "remembers" every single TOTP code that has been successfully used. However, we do not need to remember them forever. We only need to remember them for as long as the code mathematically remains valid. Once the 30-second window expires, the underlying mathematical validation will fail anyway, so our system can safely "forget" the code.

### The Algorithm: TTL-Based Distributed Blacklisting
1. The user submits their `userId` and the `code`.
2. The server checks a high-speed distributed cache (like Redis): Does the specific key `totp_used:{userId}:{code}` exist?
   - If **YES**: Reject immediately. A Replay Attack has been detected.
3. The server performs the mathematical HMAC-SHA-1 validation against the decrypted secret.
   - If **INVALID**: Reject.
4. If **VALID**: Write the key `totp_used:{userId}:{code}` to the cache with a Time-To-Live (TTL) exactly equal to the maximum possible TOTP time window (e.g., 30 seconds).
5. Grant Access.

### The Race Condition Flaw
If we implement the algorithm above using standard pseudo-code:
```javascript
const isUsed = await redis.get(cacheKey);
if (isUsed) throw Error();
// ... validate ...
await redis.set(cacheKey, true);
```
We introduce a critical **Race Condition**. If an attacker uses a botnet to send 5 identical login requests containing the exact same valid code within the same 5 milliseconds, all 5 threads will execute `redis.get()` simultaneously. All 5 threads will see `null` (not used). All 5 threads will then proceed to validate and log the user in, completely bypassing the replay protection!

### The Solution: Redis LUA Scripting and Atomic Operations
To solve this, the check and the set must happen **Atomically**. In Redis, we can achieve this using the `SET NX` (Set if Not Exists) command. Better yet, if we need complex logic, we use a LUA script which Redis guarantees will execute atomically, blocking all other commands until it finishes.

Let's look at the robust NestJS implementation.

```typescript
// src/modules/auth/totp/totp.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { authenticator } from 'otplib';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  private readonly WINDOW_SECONDS = 30;

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private readonly encryptionService: EncryptionService,
  ) {}

  async verifyLoginTotp(userId: string, code: string, encryptedSecret: string, dekBuffer: Buffer) {
    const cacheKey = `totp_used:${userId}:${code}`;
    
    // 1. Decrypt the secret (Always do this first to ensure the request is well-formed)
    let secret: string;
    try {
      secret = this.encryptionService.decrypt(encryptedSecret, dekBuffer);
    } catch (e) {
      throw new BadRequestException('Invalid TOTP Configuration');
    }

    // 2. Pure Mathematical Validation
    const isValid = authenticator.check(code, secret);
    
    if (!isValid) {
      // Throw a generic error. NEVER tell the attacker "Code Expired" vs "Wrong Code"
      throw new BadRequestException('Invalid Verification Code');
    }

    // 3. Atomic Replay Protection Check
    // We use SET with the NX (Not eXists) flag.
    // EX sets the expiry in seconds.
    // If the key already exists, Redis returns null.
    // This entirely eliminates the Race Condition.
    const result = await this.redisClient.set(cacheKey, 'USED', 'EX', this.WINDOW_SECONDS, 'NX');
    
    if (result !== 'OK') {
      this.logger.warn(`REPLAY ATTACK DETECTED for user ${userId} with code ${code}`);
      // Again, throw the exact same generic error. Do not give the attacker hints.
      throw new BadRequestException('Invalid Verification Code');
    }

    // If we reach here, the code was mathematically valid AND mathematically unique.
    return true;
  }
}
```

---

## Algorithm Breakdown: Complete Clock Drift Mitigation

The `authenticator.check(code, secret)` method mathematically calculates the current Unix epoch, divides it by 30 to find the current step `T`, and generates the expected code to compare against the user's input. But what happens if the user's smartphone clock is drifted?

### The Epoch Tolerance Algorithm
If a user's clock is 35 seconds slow, they are generating codes for the `T-1` window. When they submit it to the server, the server is checking the `T` window. It will fail every single time.

Instead of just checking the strictly current time window (`T`), an enterprise server must calculate and check a spread of windows: `T-1` (the past), `T` (the present), and `T+1` (the future). 

Example: If the server's precise NTP time is `10:00:15`, it should accept codes generated for:
- `T-1`: 09:59:30 to 10:00:00 (Accommodates users whose clocks are slow)
- `T`: 10:00:00 to 10:00:30 (The precise current window)
- `T+1`: 10:00:30 to 10:01:00 (Accommodates users whose clocks are fast)

If the user's submitted code matches *any* of these three windows, the server accepts it. The `otplib` library provides a built-in configuration for this exact purpose, called `window` or `epochTolerance`.

### The Critical Synchronization Trap!
There is a massive, highly dangerous trap here that catches many senior engineers. 

If you configure `otplib` to accept a window of `1` (which means it accepts `T-1`, `T`, and `T+1`), **you have effectively increased the valid lifetime of a TOTP code from 30 seconds to 90 seconds!**

If your Redis Replay Protection TTL is still hardcoded to 30 seconds, an attacker can capture a code generated in the `T+1` window, wait 35 seconds for your Redis cache to expire and drop the blacklist record, and then successfully replay the code because the `otplib` math says the code is *still* valid within the 90-second total spread!

**RULE: Your Replay Protection TTL MUST always be equal to `(Window Size * 2 + 1) * Time Step`.**

Let's fix our implementation:

```typescript
// Global Configuration (usually done in a module provider)
authenticator.options = {
  window: 1 // Accepts [T-1, T, T+1]
};

// ... inside verifyLoginTotp ...

// We must dynamically calculate the TTL based on the otplib configuration!
// window = 1 means 1 step backward AND 1 step forward, plus the current step = 3 total steps.
const totalValidSteps = (authenticator.options.window * 2) + 1;
const maxValiditySeconds = totalValidSteps * authenticator.options.step; // 3 * 30 = 90 seconds

const result = await this.redisClient.set(
  cacheKey, 
  'USED', 
  'EX', 
  maxValiditySeconds, // 90 seconds!
  'NX'
);
```

By tweaking the `window` option and mathematically ensuring our distributed caching mechanism perfectly aligns with the expanded mathematical tolerance, we completely eliminate user frustration caused by desynchronized smartphone clocks, while maintaining an absolutely ironclad, mathematically proven defense against replay attacks.

---

## Valid Code 嘅潛在致命漏洞

由數學定義上來講，Time-based One-Time Password (TOTP) 喺一段特定嘅時間內（通常係精準嘅 30 秒）係 Valid (有效) 嘅。呢 30 秒嘅空檔係絕對必需嘅，因為人類唔係機器。用戶需要時間去解鎖電話、打開 Authenticator app、肉眼讀取嗰 6 位數 Code、將佢短暫記喺腦海入面、喺 Browser 嘅 Input field 慢慢打返出嚟，然後再透過網絡 Submit 張表單。

不過，呢種「寬容」嘅 30 秒 Window，同時製造咗一個極度嚴重、先天性嘅系統漏洞：**重放攻擊 (Replay Attack)**。

試幻想吓：Alice Generate 咗個 Code，打字打得好快，喺 5 秒內就完美登入咗。喺技術同數學上，佢啱啱用完嗰個 Code 喺剩低嗰 25 秒入面依然係完全 Valid 嘅！如果有一個惡意黑客（或者一個潛伏喺公眾咖啡店 Wi-Fi 嘅 Man-in-the-middle 攔截腳本，例如透過 SSL Stripping），成功截取咗嗰個 HTTP payload，佢哋就可以即刻將同一個 Payload "Replay" (重放) 去 Server 度。

如果 Server 嘅設計有缺陷，淨係依賴 `otplib` 提供嘅純數學 HMAC 驗證，Server 會計一計當前嘅 Time window，發現黑客重放過嚟嘅 Code 同數學結果完美吻合，然後就會盲目咁將 Alice 帳戶嘅完整控制權雙手奉上俾個黑客！

除此之外，我哋仲要面對另一個令人極度火滾嘅物理現實：**時間漂移 (Clock Drift)**。用戶部智能電話嘅內部時鐘，極少可以同 Server 嗰個極度精準嘅 NTP (網絡時間協議) 時鐘完美同步。如果用戶部電話只係慢咗 Server 45 秒 (可能因為佢最近冇連上過電話訊號塔對時)，佢哋就會不斷 fail 個 2FA 驗證，搞到嬲到掟爛部機兼且瘋狂開 Helpdesk tickets 鬧人。

喺呢篇極度深入嘅探討入面，我哋會研究用來徹底防禦重放攻擊同時間漂移嘅進階演算法同架構模式。我哋會將系統由 Stateless (無狀態驗證) 昇華至利用 Redis 進行 Stateful (有狀態) 驗證，同埋我哋會親手寫 Custom 嘅 LUA Scripts，去杜絕喺高併發攻擊下出現嘅 Race conditions (競爭危害)。

---

## 深度探討：有狀態嘅重放防禦模式 (Stateful Replay Protection)

要徹底防止重放攻擊，我哋嘅 Backend 架構必須經歷一次根本性嘅轉變：佢必須由純粹嘅 *Stateless* (無狀態，即係只做數學運算)，轉變成 *Stateful* (有狀態)。

我哋必須要 Implement 一個系統，去「記住」每一個成功用過嘅 TOTP Code。不過，我哋唔需要記住佢哋一世。我哋只需要記住一段時間——就係個 Code 喺數學上仲係 Valid 嗰段時間。一旦 30 秒 window 完結，個數學驗證本身都會 Fail，所以我哋個系統就可以安全地將個 Code「遺忘」。

### 演算法：基於 TTL 嘅分散式黑名單機制
1. 用戶 Submit 佢哋嘅 `userId` 同埋 `code`。
2. Server 去一個極高速嘅分散式快取 (例如 Redis) Check 吓：`totp_used:{userId}:{code}` 呢條特定嘅 Key 存唔存在？
   - 如果 **存在 (YES)**：即刻 Reject 佢。系統已經偵測到重放攻擊。
3. Server 運用解密後嘅 Secret，進行 HMAC-SHA-1 嘅純數學驗證。
   - 如果 **唔 Valid (INVALID)**：Reject 佢。
4. 如果 **Valid**：將 `totp_used:{userId}:{code}` 呢條 Key 寫入 Cache，並設定 Time-To-Live (TTL) 準確等於 TOTP 嘅最長有效期 (例如 30 秒)。
5. 批准登入。

### 競爭危害 (Race Condition) 嘅致命缺陷
如果我哋用普通嘅 Pseudo-code 去寫上面個演算法：
```javascript
const isUsed = await redis.get(cacheKey);
if (isUsed) throw Error();
// ... 驗證過程 ...
await redis.set(cacheKey, true);
```
咁樣寫會引入一個極度危險嘅 **Race Condition (競爭危害)**！如果一個黑客用 Botnet (殭屍網絡) 喺同一毫秒內，掟 5 個包含同一個 Valid code 嘅 Login requests 埋嚟。呢 5 個 Threads 會完全同步執行 `redis.get()`。呢 5 個 Threads 全部都會睇到 `null` (代表未用過)。然後，呢 5 個 Threads 全部都會繼續行落去、驗證成功、然後俾個黑客登入 5 次，完美 Bypass 咗你個防禦系統！

### 終極解法：Redis 原子性操作與 LUA 腳本
要解決呢個問題，個 Check 同個 Set 嘅動作必須要 **原子性地 (Atomically)** 發生。喺 Redis 入面，我哋可以利用 `SET NX` (Set if Not Exists) command 嚟做到。如果需要更複雜嘅邏輯，我哋就可以寫 LUA Script，Redis 會保證 LUA Script 執行嗰陣係絕對 Atomic 嘅，會 Block 停所有其他 Commands 直到佢行完為止。

我哋嚟睇吓 NestJS 裡面堅如磐石嘅實作：

```typescript
// src/modules/auth/totp/totp.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { authenticator } from 'otplib';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  private readonly WINDOW_SECONDS = 30;

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private readonly encryptionService: EncryptionService,
  ) {}

  async verifyLoginTotp(userId: string, code: string, encryptedSecret: string, dekBuffer: Buffer) {
    const cacheKey = `totp_used:${userId}:${code}`;
    
    // 1. 解密條 Secret (永遠都第一步做呢樣嘢，確保個 Request 係格式正確嘅)
    let secret: string;
    try {
      secret = this.encryptionService.decrypt(encryptedSecret, dekBuffer);
    } catch (e) {
      throw new BadRequestException('TOTP 配置無效');
    }

    // 2. 純數學驗證
    const isValid = authenticator.check(code, secret);
    
    if (!isValid) {
      // 掟一個 generic 嘅 Error 出去。絕對唔好同黑客講 "Code Expired" 定係 "Wrong Code"
      throw new BadRequestException('驗證碼錯誤');
    }

    // 3. 原子性嘅重放防禦檢查 (Atomic Replay Protection Check)
    // 我哋用帶有 NX (Not eXists) flag 嘅 SET 指令。
    // EX 代表設定過期秒數。
    // 如果條 Key 已經存在，Redis 會直接 return null。
    // 呢招百分百完全消滅咗 Race Condition！
    const result = await this.redisClient.set(cacheKey, 'USED', 'EX', this.WINDOW_SECONDS, 'NX');
    
    if (result !== 'OK') {
      this.logger.warn(`成功攔截針對用戶 ${userId} 嘅重放攻擊！使用嘅 Code 係 ${code}`);
      // 同樣，掟返同一個 generic error 出去。唔好俾黑客有任何提示。
      throw new BadRequestException('驗證碼錯誤');
    }

    // 如果行到嚟呢度，代表個 Code 喺數學上 Valid，兼且喺系統上係 Unique 嘅。
    return true;
  }
}
```

---

## 演算法解碼：全面化解時間漂移 (Clock Drift Mitigation)

`authenticator.check(code, secret)` 呢個 method 會喺數學上計出當前嘅 Unix Epoch，除以 30 搵出當前嘅 Step `T`，然後 Generate 預期嘅 Code 出來同用戶輸入嘅做對比。但如果用戶部手機個鐘行歪咗點算？

### Epoch Tolerance (時間容忍度) 演算法
如果用戶個鐘慢咗 35 秒，佢部機其實係 Generate 緊 `T-1` window 嘅 Code。當佢 Submit 俾 Server 嗰陣，Server 查緊嘅係 `T` window。結果就係次次都會 Fail。

與其死板地淨係 Check 當前嗰個 Time window (`T`)，一個企業級嘅 Server 必須要計算並檢查一個範圍嘅 Windows：`T-1` (過去)、`T` (現在)、同埋 `T+1` (未來)。

例子：如果 Server 嘅精準 NTP 時間係 `10:00:15`，佢應該要接受喺以下時間 Generate 嘅 Codes：
- `T-1`: 09:59:30 到 10:00:00 (照顧時鐘慢咗嘅用戶)
- `T`: 10:00:00 到 10:00:30 (精準嘅當前 window)
- `T+1`: 10:00:30 到 10:01:00 (照顧時鐘快咗嘅用戶)

只要用戶 Submit 嘅 Code 命中呢三個 Windows 入面嘅 *任何一個*，Server 都會照殺。`otplib` 呢個 library 內建咗一個專為呢個用途而設嘅 Config，叫 `window` 或者 `epochTolerance`。

### 致命嘅同步陷阱！
呢度有一個極度巨大、非常危險嘅陷阱，好多 Senior engineers 都會中招！

如果你將 `otplib` 個 Config set 做接受 window `1` (即係接受 `T-1`, `T`, 同 `T+1`)，**你其實已經靜靜雞將 TOTP code 嘅有效壽命，由 30 秒延長到 90 秒！**

如果你嘅 Redis Replay Protection TTL 仲係 Hardcode 緊 30 秒，一個聰明嘅黑客可以偷一個喺 `T+1` (未來) window generate 嘅 Code，乖乖地等 35 秒，等你個 Redis cache 過期兼且將個黑名單洗走。然後，黑客再將個 Code 重放 (Replay) 入來。因為 `otplib` 嘅數學算式話個 Code 喺 90 秒嘅 Tolerance 內依然係 Valid 嘅，結果黑客就成功登入咗啦！

**鐵則：你嘅 Replay Protection TTL 必須永遠等於 `(Window Size * 2 + 1) * Time Step`！**

我哋嚟 Fix 返我哋個 Implementation：

```typescript
// 全局設定 (通常喺 module provider 度做)
authenticator.options = {
  window: 1 // 接受 [T-1, T, T+1]
};

// ... 喺 verifyLoginTotp 入面 ...

// 我哋必須根據 otplib 嘅 configuration，動態計算個 TTL！
// window = 1 代表向後 1 個 step 兼且向前 1 個 step，加埋當前 step = 總共 3 個 steps。
const totalValidSteps = (authenticator.options.window * 2) + 1;
const maxValiditySeconds = totalValidSteps * authenticator.options.step; // 3 * 30 = 90 秒！

const result = await this.redisClient.set(
  cacheKey, 
  'USED', 
  'EX', 
  maxValiditySeconds, // 90 秒！
  'NX'
);
```

透過微調 `window` 嘅設定，同時喺數學上確保我哋嘅分散式 Caching 機制同擴展咗嘅數學容忍度完美掛鈎，我哋就可以將因為手機時鐘唔準而引致嘅用戶怨氣徹底抹殺，同時保持一個絕對堅不可摧、數學上被證明無懈可擊嘅重放防禦系統！
