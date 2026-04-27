---
title: "TOTP Series Part 5: Architecting Admin Reset APIs, RBAC, and Asynchronous Global Migrations | TOTP 系列之五：建構 Admin Reset API、RBAC 與非同步全局遷移"
date: 2026-04-27 12:00:00 +0800
categories: [Backend, TOTP Series]
tags: [totp, backend, api, security, rbac, admin, clean-code, bullmq, queue, assisted_by_ai]
toc: true
---

## The Inevitability of Administrative Intervention

No matter how flawlessly you design your self-service flows, and no matter how intuitive your user interface is, an enterprise system will always, inevitably, require high-level administrative intervention. 

Employees drop their smartphones in the ocean. Accounts get locked out due to brute-force attacks. Devices get stolen on business trips. When a user loses all physical access to their TOTP generation method (their smartphone) and cannot complete the self-service password verification flow (perhaps because they forgot their master password as well), an Administrator must step in to forcefully reset the user's 2FA state.

Building Administrative APIs for security operations is a delicate, high-stakes balancing act. You are providing network endpoints that entirely bypass user consent and forcefully mutate critical security states. If these APIs are loosely protected, lack proper audit logging, or suffer from authorization flaws (like Insecure Direct Object References - IDOR), they cease to be helpful tools; they become the ultimate backdoor for attackers. 

In this exhaustive deep dive, we will design the Admin Reset APIs. We will implement strict Role-Based Access Control (RBAC) to ensure only authorized administrators can trigger these resets. We will apply the DRY (Don't Repeat Yourself) principle to reuse our core `TotpService` logic. Finally, we will explore the architectural challenges of a "Global Reset" (wiping millions of users' 2FA at once) and implement an asynchronous Queue-based solution using BullMQ to handle it safely.

---

## Deep Dive: Designing the Admin APIs and RBAC

An enterprise Learning Management System (LMS) or corporate portal typically requires two distinct types of reset actions:
1. **Targeted Reset:** Resetting a specific, individual user's TOTP. This is a highly frequent operation, used daily by the Helpdesk team.
2. **Global Reset:** Resetting ALL users' TOTP across the entire system. This is a "nuclear option," used only in emergency scenarios (such as a suspected DEK breach) or during massive infrastructure migrations to a new 2FA provider.

### The Endpoint Architecture & Swagger Documentation

We will create a dedicated `AdminTotpController` specifically for these actions. This keeps our route namespaces clean and distinct from the standard, user-facing `AuthController`. We will also deeply integrate NestJS Swagger decorators to ensure our API is fully documented for the frontend team.

```typescript
// src/modules/admin/totp/admin-totp.controller.ts
import { Controller, Post, Param, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Admin - TOTP Management')
@ApiBearerAuth()
@Controller('admin/totp')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class AdminTotpController {
  constructor(private readonly adminTotpService: AdminTotpService) {}

  @Post('users/:userId/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forcefully reset a specific user\'s TOTP configuration' })
  @ApiResponse({ status: 200, description: 'TOTP successfully reset.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Missing USER_ACCOUNT_2FA_RESET permission.' })
  @ApiResponse({ status: 404, description: 'Target user not found.' })
  @RequirePermissions('USER_ACCOUNT_2FA_RESET') // Strict RBAC Enforcement
  public async resetUserTotp(
    @Request() req: CustomRequest,
    @Param('userId') targetUserId: string,
  ) {
    // We pass the Request Context down to the service.
    // This is CRITICAL for Audit Logging, so the system knows WHICH admin triggered the reset.
    return this.adminTotpService.resetTargetUser(req.context, targetUserId);
  }

  @Post('emergency/reset-all')
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted because it triggers an async background job
  @ApiOperation({ summary: 'EMERGENCY: Trigger a global reset of ALL TOTP configurations' })
  @ApiResponse({ status: 202, description: 'Global reset background job initiated.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Missing SUPER_ADMIN_EMERGENCY permission.' })
  @RequirePermissions('SUPER_ADMIN_EMERGENCY') // Strictly locked down to Super Admins
  public async triggerGlobalReset(@Request() req: CustomRequest) {
    return this.adminTotpService.queueGlobalReset(req.context);
  }
}
```

### Implementing Role-Based Access Control (RBAC)
Notice the `@RequirePermissions()` decorator. We cannot let just any authenticated admin hit these endpoints. A junior helpdesk staff member might have permission to view a user's profile (`USER_VIEW`), but they should not have the authority to wipe a security configuration. 

We introduce specific permission tags: `USER_ACCOUNT_2FA_RESET` for targeted resets, and a highly restricted `SUPER_ADMIN_EMERGENCY` tag for global operations. The `PermissionsGuard` intercepts the request, reads the JWT payload, and cross-references the admin's assigned roles against these required tags before allowing the controller to execute.

---

## Clean Code: Reusing Domain Logic and Audit Logging

When the Admin triggers a Targeted Reset, the actual database manipulation is identical to the Self-Service reset. We need to clear `totp_encrypted_secret`, `totp_encrypted_dek`, set `is_totp_enabled` to `false`, and reset the `ctrl_totp_attempt_count`.

According to the DRY principle, we should not duplicate these TypeORM `update` queries. Instead, the `AdminTotpService` should inject the core `TotpService` and call its `resetUserTotp` method. The key architectural difference lies in the **Security Audit Logging**.

```typescript
// src/modules/admin/totp/admin-totp.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AdminTotpService {
  private readonly logger = new Logger(AdminTotpService.name);

  constructor(
    private readonly userService: UserService,
    private readonly totpService: TotpService,
    private readonly auditLogService: AuditLogService,
    @InjectQueue('emergency-operations') private readonly emergencyQueue: Queue,
  ) {}

  async resetTargetUser(context: CustomContext, targetUserId: string) {
    // 1. Find the target user
    const targetUser = await this.userService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found.`);
    }

    // 2. Delegate database mutation to the domain service
    // We pass the transaction context if available to ensure atomicity
    await this.totpService.resetUserTotp(context, targetUser);

    // 3. Create an Immutable Audit Log
    // This explicitly states that an Admin performed the action, not the user themselves.
    await this.auditLogService.createLog({
      actionByUserId: context.requestUserId, // The Admin executing the request
      targetUserId: targetUser.id,           // The Victim
      action: 'ADMIN_RESET_TARGET_TOTP',
      ipAddress: context.ipAddress,
      description: `Administrator ${context.requestUserEmail} forcefully reset TOTP for user ${targetUser.email}`,
    });

    this.logger.log(`Admin ${context.requestUserId} reset TOTP for user ${targetUser.id}`);
    return { success: true, message: 'User TOTP configuration has been wiped.' };
  }
}
```

---

## Asynchronous Architecture: Handling Global Resets with BullMQ

Now let's address the `reset-all` endpoint. 

A fatal mistake novice developers make is writing a simple `for` loop in the controller that iterates over every user and calls `resetUserTotp()`. If your database has 1 million users, this `for` loop will immediately exhaust the Node.js V8 memory heap and crash the server. Even if it doesn't crash, the HTTP request will time out long before the loop finishes, leaving the frontend with a `504 Gateway Timeout` error.

For enterprise systems, massive data migrations must be handled asynchronously.
1. The API responds immediately with a `202 Accepted`.
2. A background worker picks up the job from a message queue (like RabbitMQ or Redis via BullMQ).
3. The worker processes the migration in manageable chunks.

### The Queue Producer
In our `AdminTotpService`, we simply add a job to the Queue.

```typescript
  async queueGlobalReset(context: CustomContext) {
    this.logger.warn(`EMERGENCY: Global TOTP Reset initiated by Admin ${context.requestUserId}`);
    
    // Add the job to the BullMQ Redis queue
    await this.emergencyQueue.add('global-totp-reset', {
      adminId: context.requestUserId,
      ipAddress: context.ipAddress,
      timestamp: new Date().toISOString()
    });

    // Return 202 Accepted immediately so the HTTP request completes
    return { 
      success: true, 
      message: 'Global reset job has been queued. This process will complete asynchronously in the background.' 
    };
  }
```

### The BullMQ Processor (Background Worker)
In a separate worker process (or a dedicated Microservice), we consume the job. To make it extremely fast, we bypass the ORM loop entirely and use a raw SQL Bulk Update.

```typescript
// src/workers/emergency.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';

@Processor('emergency-operations')
export class EmergencyProcessor extends WorkerHost {
  private readonly logger = new Logger(EmergencyProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    switch (job.name) {
      case 'global-totp-reset':
        return this.handleGlobalTotpReset(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleGlobalTotpReset(job: Job) {
    this.logger.warn(`Executing Global TOTP Reset... Job ID: ${job.id}`);
    
    // Using Raw SQL for a massive, instantaneous bulk update across millions of rows
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const result = await queryRunner.query(`
        UPDATE users 
        SET 
          is_totp_enabled = false,
          totp_encrypted_secret = NULL,
          totp_encrypted_dek = NULL,
          ctrl_totp_attempt_count = 0
        WHERE is_totp_enabled = true;
      `);

      const affectedRows = result[1]; // TypeORM returns affected row count in index 1 for Postgres

      // Create the massive audit log
      await this.auditLogService.createLog({
        actionByUserId: job.data.adminId,
        action: 'EMERGENCY_GLOBAL_TOTP_RESET_COMPLETED',
        ipAddress: job.data.ipAddress,
        description: `CRITICAL: Admin performed a global 2FA reset. Total users wiped: ${affectedRows}`,
      });

      this.logger.log(`Global TOTP Reset finished. Affected ${affectedRows} users.`);
      return { affectedRows };
      
    } catch (error) {
      this.logger.error('Failed to execute Global TOTP Reset SQL query!', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

By leveraging Queues and Raw SQL for bulk operations, we guarantee that our system remains responsive, stable, and highly performant, even during catastrophic emergency security operations.

---

## Admin 介入嘅絕對無可避免性

無論你個自助服務 (Self-service) 流程設計得幾咁完美無瑕，又或者你個 User Interface (用戶介面) 有幾咁直覺易用，一個企業級嘅系統，永遠、絕對無法避免需要高權限嘅 Administrative intervention (管理員介入)。

員工會去沙灘玩嗰陣跌咗部電話落海。帳戶會因為遭受暴力破解攻擊 (Brute-force attacks) 而被系統鎖死。出差公幹嗰陣設備會俾人偷。當一個用戶完全冇晒接觸佢 TOTP Generate 方法 (即係佢部手機) 嘅物理途徑，同時又冇辦法完成自助密碼驗證流程 (可能因為佢急到連個 Master password 都唔記得埋)，呢個時候，就必須要有個 Administrator (管理員) 挺身而出，強行 Reset (重置) 個用戶嘅 2FA 保安狀態。

為保安操作編寫 Administrative APIs，係一件好講究平衡、而且容錯率極低嘅高風險任務。你提供緊嘅，係一啲可以完全 Bypass (繞過) 用戶同意，強行改變系統極關鍵保安狀態嘅 Network Endpoints。如果呢啲 APIs 嘅保護做得唔夠嚴密、缺乏完善嘅 Audit logging (審計日誌)，或者存在授權漏洞 (例如 Insecure Direct Object References - IDOR，唔安全嘅直接物件參照)，佢哋就會由一件好用嘅工具，瞬間變成黑客夢寐以求嘅終極後門 (Backdoor)。

喺呢篇極度深入嘅探討入面，我哋會一齊精心設計 Admin Reset APIs。我哋會 Implement 嚴格嘅基於角色權限控制 (Role-Based Access Control, RBAC)，確保只有真正獲授權嘅 Admin 先可以 Trigger 呢啲 Reset。我哋會應用 DRY (Don't Repeat Yourself) 原則，重用核心嘅 `TotpService` 邏輯。最後，我哋會探討「Global Reset (全局重置)」(即係一次過洗白幾百萬個用戶嘅 2FA) 帶嚟嘅架構挑戰，並利用 BullMQ 構建一個非同步嘅 Queue-based (基於佇列) 解決方案來安全地處理佢。

---

## 深度探討：設計 Admin APIs 與 RBAC

一個企業級嘅學習管理系統 (LMS) 或者 Corporate Portal，通常需要兩種截然不同、影響力懸殊嘅 Reset 行為：
1. **Targeted Reset (針對性重置):** 幫一個特定、單一嘅用戶 Reset TOTP。呢個係一個極高頻率嘅操作，Helpdesk 團隊每日都會用佢嚟應付粗心大意嘅員工。
2. **Global Reset (全局重置):** 將全系統所有用戶嘅 TOTP 全部洗白。呢個係一個「核彈級選項 (Nuclear option)」，只限喺極度緊急嘅情況下使用 (例如懷疑 DEK 發生大規模洩漏)，或者當成間公司進行大型 Infrastructure migration (例如轉用新嘅 2FA 供應商) 嗰陣先會動用。

### Endpoint 架構設計與 Swagger 文檔化

我哋會特別開一個專屬嘅 `AdminTotpController` 來處理呢啲 actions。咁樣做可以令到我哋嘅 API Route Namespace 保持絕對乾淨，同普通面向用戶嘅 `AuthController` 劃清界線。我哋仲會深度整合 NestJS 嘅 Swagger decorators，確保我哋嘅 API 有一份極度詳盡嘅文檔俾 Frontend 團隊參考。

```typescript
// src/modules/admin/totp/admin-totp.controller.ts
import { Controller, Post, Param, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Admin - TOTP 管理')
@ApiBearerAuth()
@Controller('admin/totp')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class AdminTotpController {
  constructor(private readonly adminTotpService: AdminTotpService) {}

  @Post('users/:userId/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '強制重置一個特定用戶嘅 TOTP 設定' })
  @ApiResponse({ status: 200, description: 'TOTP 成功重置。' })
  @ApiResponse({ status: 403, description: '權限不足。缺少 USER_ACCOUNT_2FA_RESET 權限。' })
  @ApiResponse({ status: 404, description: '搵唔到目標用戶。' })
  @RequirePermissions('USER_ACCOUNT_2FA_RESET') // 嚴格嘅 RBAC 強制執行
  public async resetUserTotp(
    @Request() req: CustomRequest,
    @Param('userId') targetUserId: string,
  ) {
    // 我哋將 Request Context 傳遞落去 Service 度。
    // 呢步對於 Audit Logging 係生死攸關嘅，系統必須要知道係「邊個」Admin trigger 呢個 reset。
    return this.adminTotpService.resetTargetUser(req.context, targetUserId);
  }

  @Post('emergency/reset-all')
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted，因為佢係 Trigger 一個 Async background job
  @ApiOperation({ summary: '緊急狀態：觸發全局重置所有 TOTP 設定' })
  @ApiResponse({ status: 202, description: '全局重置後台任務已經啟動。' })
  @ApiResponse({ status: 403, description: '權限不足。缺少 SUPER_ADMIN_EMERGENCY 權限。' })
  @RequirePermissions('SUPER_ADMIN_EMERGENCY') // 極度嚴格鎖死，只限超級管理員
  public async triggerGlobalReset(@Request() req: CustomRequest) {
    return this.adminTotpService.queueGlobalReset(req.context);
  }
}
```

### 實作角色權限控制 (RBAC)
請留意 `@RequirePermissions()` 呢個 Decorator。我哋絕對唔可以俾任何 Login 咗嘅 Admin 隨便 Call 到呢啲 Endpoint。一個初級嘅 Helpdesk 員工可能有權限去睇一個 User 嘅 Profile (`USER_VIEW`)，但佢哋絕對唔應該擁有將人哋個 Security config 徹底洗白嘅權力。

我哋引入咗特定嘅 Permission tags：`USER_ACCOUNT_2FA_RESET` 專門用嚟做 Targeted resets，而 `SUPER_ADMIN_EMERGENCY` 呢個極度受限嘅 Tag 就留俾 Global 操作。`PermissionsGuard` 會攔截個 Request，讀取 JWT payload，然後將 Admin 被分配嘅 Roles 同呢啲 Tag 進行交叉比對，Pass 咗先會俾個 Controller 執行。

---

## Clean Code 原則：重用領域邏輯與 Audit Logging

當 Admin Trigger 咗一個 Targeted Reset 嗰陣，實際落 Database 嘅操作，同我哋之前講嘅 Self-Service reset 係一模一樣嘅。我哋都需要清空 `totp_encrypted_secret`、`totp_encrypted_dek`，將 `is_totp_enabled` 變做 `false`，同埋將 `ctrl_totp_attempt_count` 歸零。

根據 DRY 原則，我哋絕對唔應該 Duplicate (複製貼上) 呢啲 TypeORM 嘅 `update` queries。相反，`AdminTotpService` 應該 Inject 個核心嘅 `TotpService`，然後直接 Call 佢個 `resetUserTotp` method。喺架構上最主要嘅分別，在於 **Security Audit Logging (安全審計日誌)**。

```typescript
// src/modules/admin/totp/admin-totp.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AdminTotpService {
  private readonly logger = new Logger(AdminTotpService.name);

  constructor(
    private readonly userService: UserService,
    private readonly totpService: TotpService,
    private readonly auditLogService: AuditLogService,
    @InjectQueue('emergency-operations') private readonly emergencyQueue: Queue,
  ) {}

  async resetTargetUser(context: CustomContext, targetUserId: string) {
    // 1. 搵個目標對象出來
    const targetUser = await this.userService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException(`搵唔到 ID 為 ${targetUserId} 嘅用戶。`);
    }

    // 2. 將 Database 修改嘅工作委託俾 Domain service
    // 如果有 Transaction context 我哋會傳埋落去，確保原子性
    await this.totpService.resetUserTotp(context, targetUser);

    // 3. 創建一條不可篡改嘅 Audit Log
    // 呢度清清楚楚講明，係一個 Admin 執行咗呢個動作，而唔係個 User 自己做嘅。
    await this.auditLogService.createLog({
      actionByUserId: context.requestUserId, // 執行指令嘅 Admin
      targetUserId: targetUser.id,           // 被洗白嘅苦主
      action: 'ADMIN_RESET_TARGET_TOTP',
      ipAddress: context.ipAddress,
      description: `管理員 ${context.requestUserEmail} 強行重置咗用戶 ${targetUser.email} 嘅 TOTP`,
    });

    this.logger.log(`Admin ${context.requestUserId} 已經幫用戶 ${targetUser.id} Reset 咗 TOTP`);
    return { success: true, message: '用戶 TOTP 設定已經被徹底清除。' };
  }
}
```

---

## 非同步架構：利用 BullMQ 處理 Global Resets

而家我哋嚟處理個 `reset-all` endpoint。

好多新手 Developer 會犯一個致命嘅錯誤：就係喺 Controller 入面寫一個簡單嘅 `for` loop，逐個 User 去 loop 然後 call `resetUserTotp()`。如果 Database 裡面有一百萬個 User，呢個 `for` loop 會瞬間扯爆 Node.js V8 嘅 Memory Heap 然後搞到 Server 死機。就算佢唔死機，個 HTTP request 都會喺個 loop 完之前一早 Timeout 咗，留低個 Frontend 食一個 `504 Gateway Timeout` error 食到成口血。

對於企業級系統來講，大規模嘅 Data Migrations 必須要用 **非同步 (Asynchronous)** 嘅方式處理。
1. API 即刻回應一個 `202 Accepted`。
2. 將個 Job 掟落一個 Message Queue (例如 RabbitMQ 或者透過 BullMQ 用 Redis)。
3. 一個 Background worker 會接手，將個 Migration 切碎做適當嘅 Chunks 慢慢 Process。

### 佇列生產者 (The Queue Producer)
喺我哋嘅 `AdminTotpService` 入面，我哋只需要將個 Job 加入去 Queue 度。

```typescript
  async queueGlobalReset(context: CustomContext) {
    this.logger.warn(`緊急警告：Admin ${context.requestUserId} 啟動咗全局 TOTP 重置`);
    
    // 將個 Job 加入 BullMQ 嘅 Redis Queue 入面
    await this.emergencyQueue.add('global-totp-reset', {
      adminId: context.requestUserId,
      ipAddress: context.ipAddress,
      timestamp: new Date().toISOString()
    });

    // 即刻 Return 202 Accepted，等個 HTTP request 可以光速完結
    return { 
      success: true, 
      message: '全局重置任務已經加入隊列。呢個程序會喺後台非同步完成。' 
    };
  }
```

### BullMQ 處理器 (Background Worker)
喺一個獨立嘅 Worker process (或者一個專門嘅 Microservice) 入面，我哋會 Consume 呢個 Job。為咗令個速度推到極致，我哋會完全 Bypass 個 ORM 嘅 Loop，直接掟一條 Raw SQL Bulk Update 落 Database。

```typescript
// src/workers/emergency.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';

@Processor('emergency-operations')
export class EmergencyProcessor extends WorkerHost {
  private readonly logger = new Logger(EmergencyProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    switch (job.name) {
      case 'global-totp-reset':
        return this.handleGlobalTotpReset(job);
      default:
        this.logger.warn(`未知的 Job Name: ${job.name}`);
    }
  }

  private async handleGlobalTotpReset(job: Job) {
    this.logger.warn(`開始執行全局 TOTP 重置... Job ID: ${job.id}`);
    
    // 運用 Raw SQL 進行一次過跨越數百萬行嘅瞬間 Bulk Update
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const result = await queryRunner.query(`
        UPDATE users 
        SET 
          is_totp_enabled = false,
          totp_encrypted_secret = NULL,
          totp_encrypted_dek = NULL,
          ctrl_totp_attempt_count = 0
        WHERE is_totp_enabled = true;
      `);

      const affectedRows = result[1]; // TypeORM 喺 Postgres 會將影響嘅行數擺喺 index 1

      // 創建一條極度重要嘅巨型 Audit Log
      await this.auditLogService.createLog({
        actionByUserId: job.data.adminId,
        action: 'EMERGENCY_GLOBAL_TOTP_RESET_COMPLETED',
        ipAddress: job.data.ipAddress,
        description: `極度危險：Admin 執行咗全局 2FA 重置。總共洗白咗 ${affectedRows} 個用戶。`,
      });

      this.logger.log(`全局 TOTP 重置完成。受影響人數：${affectedRows}。`);
      return { affectedRows };
      
    } catch (error) {
      this.logger.error('執行全局 TOTP 重置 SQL Query 失敗！', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

透過巧妙咁運用 Queues 同埋 Raw SQL 嚟處理 Bulk operations，我哋可以拍心口保證，就算喺最災難性嘅緊急保安行動期間，我哋嘅系統依然可以保持極高嘅回應速度、穩定性同埋運算效能！
